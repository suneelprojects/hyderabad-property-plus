<?php
/**
 * Secure admin REST endpoint for bulk-creating hrc_flat posts.
 *
 * Route:    POST /wp-json/hrc-admin/v1/flats/bulk-import
 * Auth:     WordPress Application Password (Basic auth) → user must have
 *           `manage_options` OR the custom `manage_hrc_flats` capability.
 * Scope:    Additive. Does not touch the HRC plugin. Does not update/delete.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const HRC_FLAT_ADMIN_NAMESPACE = 'hrc-admin/v1';
const HRC_FLAT_ADMIN_CAP       = 'manage_hrc_flats';
const HRC_FLAT_MAX_BULK        = 50;
const HRC_FLAT_REFERENCE_ID    = 63;

/**
 * Registered meta-key map. Discovered lazily from the reference flat and
 * cached in a WP option so repeated calls avoid recomputation.
 *
 * Option key: hrc_flat_meta_key_map
 * Value:      array{ bhk:string, size:string, tower:string, facing:string,
 *                     price:?string, floor:?string, flat_number:?string,
 *                     project:?string, project_value:?scalar }
 */
const HRC_FLAT_META_MAP_OPTION = 'hrc_flat_meta_key_map';

/* -------------------------------------------------------------------------
 * Route registration
 * ---------------------------------------------------------------------- */

add_action( 'rest_api_init', function () {
	register_rest_route(
		HRC_FLAT_ADMIN_NAMESPACE,
		'/flats/bulk-import',
		array(
			'methods'             => 'POST',
			'permission_callback' => 'hrc_flat_admin_permission_check',
			'callback'            => 'hrc_flat_admin_bulk_import',
			'args'                => array(
				'project_id'               => array( 'type' => 'integer', 'required' => true ),
				'placeholder_attachment_id' => array( 'type' => 'integer', 'required' => false, 'default' => 0 ),
				'dry_run'                  => array( 'type' => 'boolean', 'required' => false, 'default' => false ),
				'flats'                    => array( 'type' => 'array',   'required' => true ),
			),
		)
	);

	// Diagnostic: inspect linkage (post_parent, all meta, taxonomies) for a flat.
	register_rest_route(
		HRC_FLAT_ADMIN_NAMESPACE,
		'/flats/inspect/(?P<id>\d+)',
		array(
			'methods'             => 'GET',
			'permission_callback' => 'hrc_flat_admin_permission_check',
			'callback'            => function ( WP_REST_Request $req ) {
				$id = (int) $req['id'];
				$p  = get_post( $id );
				if ( ! $p ) return new WP_Error( 'not_found', 'not found', array( 'status' => 404 ) );
				$taxes = get_object_taxonomies( $p->post_type );
				$terms = array();
				foreach ( $taxes as $t ) {
					$tt = wp_get_object_terms( $id, $t, array( 'fields' => 'all' ) );
					if ( ! is_wp_error( $tt ) && $tt ) {
						$terms[ $t ] = array_map( function ( $x ) {
							return array( 'term_id' => $x->term_id, 'slug' => $x->slug, 'name' => $x->name );
						}, $tt );
					}
				}
				return rest_ensure_response( array(
					'id'          => $id,
					'post_type'   => $p->post_type,
					'post_status' => $p->post_status,
					'post_parent' => $p->post_parent,
					'post_date'   => $p->post_date,
					'title'       => $p->post_title,
					'meta'        => get_post_meta( $id ),
					'taxonomies'  => $taxes,
					'terms'       => $terms,
				) );
			},
		)
	);

	// Repair: assign a set of flat post IDs to a project using the same
	// mechanism the HRC plugin uses. Auto-detects: post_parent, taxonomy
	// term, or a meta key discovered from a reference flat.
	register_rest_route(
		HRC_FLAT_ADMIN_NAMESPACE,
		'/flats/repair-project',
		array(
			'methods'             => 'POST',
			'permission_callback' => 'hrc_flat_admin_permission_check',
			'callback'            => 'hrc_flat_admin_repair_project',
			'args'                => array(
				'project_id'    => array( 'type' => 'integer', 'required' => true ),
				'flat_ids'      => array( 'type' => 'array',   'required' => true ),
				'reference_id'  => array( 'type' => 'integer', 'required' => false, 'default' => HRC_FLAT_REFERENCE_ID ),
				'dry_run'       => array( 'type' => 'boolean', 'required' => false, 'default' => true ),
			),
		)
	);
} );

function hrc_flat_admin_detect_project_link( $reference_id ) {
	$ref = get_post( (int) $reference_id );
	if ( ! $ref || $ref->post_type !== HRC_FLAT_POST_TYPE ) {
		return new WP_Error( 'ref_missing', 'reference flat not found', array( 'status' => 500 ) );
	}
	// (a) post_parent → project?
	if ( $ref->post_parent ) {
		$parent = get_post( $ref->post_parent );
		if ( $parent && $parent->post_type === 'hrc_project' ) {
			return array( 'method' => 'post_parent', 'project_id' => (int) $parent->ID );
		}
	}
	// (b) taxonomy term whose slug matches an hrc_project slug?
	$taxes = get_object_taxonomies( HRC_FLAT_POST_TYPE );
	foreach ( $taxes as $t ) {
		$terms = wp_get_object_terms( $ref->ID, $t );
		if ( is_wp_error( $terms ) || ! $terms ) continue;
		foreach ( $terms as $term ) {
			$maybe = get_page_by_path( $term->slug, OBJECT, 'hrc_project' );
			if ( $maybe ) {
				return array( 'method' => 'taxonomy', 'taxonomy' => $t, 'term_id' => $term->term_id, 'project_id' => (int) $maybe->ID );
			}
		}
		// even without slug match, record the first taxonomy that binds flats to something
		if ( $terms ) {
			return array( 'method' => 'taxonomy', 'taxonomy' => $t, 'term_id' => (int) $terms[0]->term_id, 'note' => 'term slug did not resolve to hrc_project; using term as-is' );
		}
	}
	// (c) meta key whose value is a project post id
	$meta = get_post_meta( $ref->ID );
	foreach ( $meta as $k => $vals ) {
		$v = is_array( $vals ) ? reset( $vals ) : $vals;
		if ( ! is_numeric( $v ) ) continue;
		$maybe = get_post( (int) $v );
		if ( $maybe && $maybe->post_type === 'hrc_project' ) {
			return array( 'method' => 'meta', 'meta_key' => $k, 'project_id' => (int) $maybe->ID );
		}
	}
	return new WP_Error( 'link_unknown', 'could not detect flat→project link mechanism', array( 'status' => 500 ) );
}

function hrc_flat_admin_repair_project( WP_REST_Request $req ) {
	$project_id = (int) $req->get_param( 'project_id' );
	$flat_ids   = (array) $req->get_param( 'flat_ids' );
	$ref_id     = (int) $req->get_param( 'reference_id' );
	$dry_run    = (bool) $req->get_param( 'dry_run' );

	$project = get_post( $project_id );
	if ( ! $project || $project->post_type !== 'hrc_project' ) {
		return new WP_Error( 'bad_project', 'project_id is not an hrc_project', array( 'status' => 400 ) );
	}
	$detect = hrc_flat_admin_detect_project_link( $ref_id );
	if ( is_wp_error( $detect ) ) return $detect;

	// For taxonomy method, resolve the correct term for the target project.
	$target_term_id = null;
	if ( $detect['method'] === 'taxonomy' ) {
		$term = get_term_by( 'slug', $project->post_name, $detect['taxonomy'] );
		if ( ! $term ) {
			return new WP_Error( 'no_term', "no term in taxonomy {$detect['taxonomy']} matching project slug '{$project->post_name}'", array( 'status' => 500, 'detected' => $detect ) );
		}
		$target_term_id = (int) $term->term_id;
	}

	$actions = array();
	foreach ( $flat_ids as $fid ) {
		$fid = (int) $fid;
		$p = get_post( $fid );
		if ( ! $p || $p->post_type !== HRC_FLAT_POST_TYPE ) {
			$actions[] = array( 'flat_id' => $fid, 'action' => 'skip', 'reason' => 'not an hrc_flat' );
			continue;
		}
		$act = array(
			'flat_id'           => $fid,
			'method'            => $detect['method'],
			'status_backfilled' => false,
			'price_backfilled'  => false,
			'floor_backfilled'  => false,
		);
		if ( $dry_run ) {
			$act['action'] = 'would_link';
			$act['status_backfilled'] = ! get_post_meta( $fid, '_hrc_status', true );
			$act['price_backfilled']  = ! metadata_exists( 'post', $fid, '_hrc_price' );
			$act['floor_backfilled']  = ! metadata_exists( 'post', $fid, '_hrc_floor' );
		} else {
			if ( $detect['method'] === 'post_parent' ) {
				wp_update_post( array( 'ID' => $fid, 'post_parent' => $project_id ) );
			} elseif ( $detect['method'] === 'taxonomy' ) {
				wp_set_object_terms( $fid, array( $target_term_id ), $detect['taxonomy'], false );
			} elseif ( $detect['method'] === 'meta' ) {
				update_post_meta( $fid, $detect['meta_key'], $project_id );
			}
			if ( ! get_post_meta( $fid, '_hrc_status', true ) ) {
				update_post_meta( $fid, '_hrc_status', 'Available' );
				$act['status_backfilled'] = true;
			}
			if ( ! metadata_exists( 'post', $fid, '_hrc_price' ) ) {
				update_post_meta( $fid, '_hrc_price', '' );
				$act['price_backfilled'] = true;
			}
			if ( ! metadata_exists( 'post', $fid, '_hrc_floor' ) ) {
				update_post_meta( $fid, '_hrc_floor', '' );
				$act['floor_backfilled'] = true;
			}
			$act['action'] = 'linked';
		}
		$actions[] = $act;
	}

	return rest_ensure_response( array(
		'dry_run'   => $dry_run,
		'detected'  => $detect,
		'project_id' => $project_id,
		'actions'   => $actions,
	) );
}

/* -------------------------------------------------------------------------
 * AuthN / AuthZ
 * ---------------------------------------------------------------------- */

function hrc_flat_admin_permission_check( WP_REST_Request $request ) {
	// Application Passwords populate the current user through Basic auth
	// before permission_callback runs.
	if ( ! is_user_logged_in() ) {
		return new WP_Error(
			'hrc_flat_admin_unauthenticated',
			__( 'Authentication required.', 'hrc' ),
			array( 'status' => 401 )
		);
	}
	if ( ! current_user_can( 'manage_options' ) && ! current_user_can( HRC_FLAT_ADMIN_CAP ) ) {
		return new WP_Error(
			'hrc_flat_admin_forbidden',
			__( 'You do not have permission to bulk-import flats.', 'hrc' ),
			array( 'status' => 403 )
		);
	}
	return true;
}

/* -------------------------------------------------------------------------
 * Meta-key discovery (from reference flat #63)
 * ---------------------------------------------------------------------- */

/**
 * Returns the meta-key map. Reads WP option cache first; on cache miss
 * (or when force=true) rediscovers from the reference flat and stores it.
 *
 * @return array|WP_Error
 */
function hrc_flat_get_meta_map( $force = false ) {
	if ( ! $force ) {
		$cached = get_option( HRC_FLAT_META_MAP_OPTION );
		if ( is_array( $cached ) && ! empty( $cached['bhk'] ) ) {
			return $cached;
		}
	}

	$ref = get_post( HRC_FLAT_REFERENCE_ID );
	if ( ! $ref || $ref->post_type !== HRC_FLAT_POST_TYPE ) {
		return new WP_Error(
			'hrc_flat_reference_missing',
			sprintf(
				/* translators: %d = expected reference flat ID */
				__( 'Reference flat #%d not found or is not an hrc_flat post; cannot discover HRC meta keys.', 'hrc' ),
				HRC_FLAT_REFERENCE_ID
			),
			array( 'status' => 500 )
		);
	}

	$meta = get_post_meta( HRC_FLAT_REFERENCE_ID );

	$find = function ( array $candidates, $expected = null ) use ( $meta ) {
		foreach ( $candidates as $c ) {
			if ( isset( $meta[ $c ] ) ) return $c;
		}
		if ( $expected !== null ) {
			foreach ( $meta as $k => $vals ) {
				$v = is_array( $vals ) ? reset( $vals ) : $vals;
				if ( (string) $v === (string) $expected ) return $k;
			}
		}
		return null;
	};

	$key_bhk     = $find( array( 'bhk', '_bhk', 'hrc_flat_bhk', '_hrc_flat_bhk' ), '3BHK' );
	$key_size    = $find( array( 'size_sqft', '_size_sqft', 'size', '_size', 'hrc_flat_size_sqft', '_hrc_flat_size_sqft' ), 3565 );
	$key_tower   = $find( array( 'tower', '_tower', 'hrc_flat_tower', '_hrc_flat_tower' ), 'C' );
	$key_facing  = $find( array( 'facing', '_facing', 'hrc_flat_facing', '_hrc_flat_facing' ), 'East' );
	$key_price   = $find( array( 'price', '_price', 'hrc_flat_price', '_hrc_flat_price' ), 0 );
	$key_floor   = $find( array( 'floor', '_floor', 'hrc_flat_floor', '_hrc_flat_floor' ), 0 );
	$key_flatno  = $find( array( 'flat_number', '_flat_number', 'hrc_flat_number', '_hrc_flat_number' ) );
	$key_project = $find( array( 'project', 'project_id', '_project_id', '_hrc_project_id', 'hrc_flat_project', '_hrc_flat_project' ) );

	if ( ! $key_bhk || ! $key_size || ! $key_tower || ! $key_facing ) {
		return new WP_Error(
			'hrc_flat_meta_discovery_failed',
			__( 'Could not auto-discover core HRC meta keys (bhk/size/tower/facing) from the reference flat.', 'hrc' ),
			array( 'status' => 500 )
		);
	}

	$project_value = $key_project ? get_post_meta( HRC_FLAT_REFERENCE_ID, $key_project, true ) : null;

	$map = array(
		'bhk'          => $key_bhk,
		'size'         => $key_size,
		'tower'        => $key_tower,
		'facing'       => $key_facing,
		'price'        => $key_price,
		'floor'        => $key_floor,
		'flat_number'  => $key_flatno,
		'project'      => $key_project,
		'project_value' => $project_value,
	);
	update_option( HRC_FLAT_META_MAP_OPTION, $map, false );
	return $map;
}

/* -------------------------------------------------------------------------
 * Handler
 * ---------------------------------------------------------------------- */

function hrc_flat_admin_bulk_import( WP_REST_Request $request ) {
	$project_id    = (int) $request->get_param( 'project_id' );
	$attachment_id = (int) $request->get_param( 'placeholder_attachment_id' );
	$dry_run       = (bool) $request->get_param( 'dry_run' );
	$flats         = $request->get_param( 'flats' );

	if ( $project_id <= 0 ) {
		return new WP_Error( 'hrc_flat_bad_project', __( 'project_id is required and must be positive.', 'hrc' ), array( 'status' => 400 ) );
	}
	if ( ! is_array( $flats ) || empty( $flats ) ) {
		return new WP_Error( 'hrc_flat_no_flats', __( 'flats must be a non-empty array.', 'hrc' ), array( 'status' => 400 ) );
	}
	if ( count( $flats ) > HRC_FLAT_MAX_BULK ) {
		return new WP_Error(
			'hrc_flat_too_many',
			sprintf( /* translators: %d = limit */ __( 'A maximum of %d flats can be imported per request.', 'hrc' ), HRC_FLAT_MAX_BULK ),
			array( 'status' => 400 )
		);
	}

	$project = get_post( $project_id );
	if ( ! $project ) {
		return new WP_Error( 'hrc_flat_project_missing', __( 'project_id does not resolve to a post.', 'hrc' ), array( 'status' => 400 ) );
	}

	if ( $attachment_id > 0 ) {
		$att = get_post( $attachment_id );
		if ( ! $att || $att->post_type !== 'attachment' ) {
			return new WP_Error( 'hrc_flat_bad_attachment', __( 'placeholder_attachment_id is not a valid attachment.', 'hrc' ), array( 'status' => 400 ) );
		}
	}

	$map = hrc_flat_get_meta_map();
	if ( is_wp_error( $map ) ) {
		return $map;
	}

	$results         = array();
	$created_ids     = array();
	$created_count   = 0;
	$skipped_count   = 0;
	$errors          = array();

	foreach ( $flats as $index => $raw ) {
		$row_result = array( 'index' => $index );

		if ( ! is_array( $raw ) ) {
			$row_result['action'] = 'error';
			$row_result['error']  = 'Row is not an object.';
			$results[]            = $row_result;
			$errors[]             = $row_result;
			continue;
		}

		$title = isset( $raw['title'] ) ? sanitize_text_field( (string) $raw['title'] ) : '';
		if ( $title === '' ) {
			$row_result['action'] = 'error';
			$row_result['error']  = 'title is required.';
			$results[]            = $row_result;
			$errors[]             = $row_result;
			continue;
		}
		$row_result['title'] = $title;

		$size_for_key   = isset( $raw['size_sqft'] ) ? (int) $raw['size_sqft'] : 0;
		$tower_for_key  = isset( $raw['tower'] ) ? sanitize_text_field( (string) $raw['tower'] ) : '';
		$facing_for_key = isset( $raw['facing'] ) ? sanitize_text_field( (string) $raw['facing'] ) : '';

		// Composite duplicate check: project + title + size + tower + facing.
		$existing_id = hrc_flat_find_composite_duplicate( $title, $project_id, $size_for_key, $tower_for_key, $facing_for_key, $map );
		if ( $existing_id ) {
			$row_result['action']  = 'skipped_duplicate';
			$row_result['post_id'] = $existing_id;
			$results[]             = $row_result;
			$skipped_count++;
			continue;
		}

		if ( $dry_run ) {
			$row_result['action'] = 'would_create';
			$results[]            = $row_result;
			$created_count++;
			continue;
		}

		$post_id = wp_insert_post( array(
			'post_type'   => HRC_FLAT_POST_TYPE,
			'post_status' => 'publish',
			'post_title'  => $title,
		), true );

		if ( is_wp_error( $post_id ) ) {
			$row_result['action'] = 'error';
			$row_result['error']  = $post_id->get_error_message();
			$results[]            = $row_result;
			$errors[]             = $row_result;
			continue;
		}

		hrc_flat_apply_meta( $post_id, $raw, $project_id, $map );
		// Apply the detected project linkage (post_parent / taxonomy / meta).
		$link_res = hrc_flat_apply_project_link( $post_id, $project_id );
		if ( is_wp_error( $link_res ) ) {
			$row_result['link_warning'] = $link_res->get_error_message();
		} else {
			$row_result['link'] = $link_res;
		}

		if ( $attachment_id > 0 ) {
			set_post_thumbnail( $post_id, $attachment_id );
		}

		$row_result['action']  = 'created';
		$row_result['post_id'] = $post_id;
		$results[]             = $row_result;
		$created_ids[]         = $post_id;
		$created_count++;
	}

	return rest_ensure_response( array(
		'dry_run'      => $dry_run,
		'project_id'   => $project_id,
		'created'      => $created_count,
		'skipped'      => $skipped_count,
		'error_count'  => count( $errors ),
		'created_ids'  => $created_ids,
		'errors'       => $errors,
		'results'      => $results,
		'meta_map'     => array_diff_key( $map, array( 'project_value' => true ) ),
	) );
}

/* -------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------- */

function hrc_flat_find_by_title_and_project( $title, $project_id, array $map ) {
	// Legacy title-only variant, kept for reference.
	$args = array(
		'post_type'      => HRC_FLAT_POST_TYPE,
		'post_status'    => array( 'publish', 'draft', 'pending', 'private', 'future' ),
		'title'          => $title,
		'posts_per_page' => 20,
		'fields'         => 'ids',
		'no_found_rows'  => true,
	);
	$q = new WP_Query( $args );
	if ( ! $q->have_posts() ) return 0;
	$project_key = $map['project'] ?? null;
	if ( ! $project_key ) return (int) $q->posts[0];
	foreach ( $q->posts as $pid ) {
		if ( (int) get_post_meta( (int) $pid, $project_key, true ) === (int) $project_id ) return (int) $pid;
	}
	return 0;
}

/**
 * Composite duplicate: same project AND same title AND same size AND
 * same tower AND same facing. Uses the detected project-link mechanism
 * (post_parent / taxonomy / meta) to scope by project.
 */
function hrc_flat_find_composite_duplicate( $title, $project_id, $size_sqft, $tower, $facing, array $map ) {
	$candidates = hrc_flat_query_project_flat_ids( $project_id );
	if ( ! $candidates ) return 0;
	$title_norm  = mb_strtolower( trim( (string) $title ) );
	$tower_norm  = mb_strtolower( trim( (string) $tower ) );
	$facing_norm = mb_strtolower( trim( (string) $facing ) );
	foreach ( $candidates as $pid ) {
		$p = get_post( (int) $pid );
		if ( ! $p ) continue;
		if ( mb_strtolower( trim( $p->post_title ) ) !== $title_norm ) continue;
		$c_size   = (int) get_post_meta( $pid, $map['size'], true );
		$c_tower  = mb_strtolower( trim( (string) get_post_meta( $pid, $map['tower'], true ) ) );
		$c_facing = mb_strtolower( trim( (string) get_post_meta( $pid, $map['facing'], true ) ) );
		if ( $c_size === (int) $size_sqft && $c_tower === $tower_norm && $c_facing === $facing_norm ) {
			return (int) $pid;
		}
	}
	return 0;
}

/**
 * Return all hrc_flat post IDs linked to $project_id via the detected
 * linkage (post_parent / taxonomy / meta). Best-effort superset: on
 * unknown linkage, falls back to all flats.
 */
function hrc_flat_query_project_flat_ids( $project_id ) {
	$detect = hrc_flat_admin_detect_project_link( HRC_FLAT_REFERENCE_ID );
	$args = array(
		'post_type'      => HRC_FLAT_POST_TYPE,
		'post_status'    => array( 'publish', 'draft', 'pending', 'private', 'future' ),
		'posts_per_page' => -1,
		'fields'         => 'ids',
		'no_found_rows'  => true,
	);
	if ( ! is_wp_error( $detect ) ) {
		if ( $detect['method'] === 'post_parent' ) {
			$args['post_parent'] = (int) $project_id;
		} elseif ( $detect['method'] === 'taxonomy' ) {
			$project = get_post( (int) $project_id );
			if ( $project ) {
				$term = get_term_by( 'slug', $project->post_name, $detect['taxonomy'] );
				if ( $term ) {
					$args['tax_query'] = array( array(
						'taxonomy' => $detect['taxonomy'],
						'field'    => 'term_id',
						'terms'    => (int) $term->term_id,
					) );
				}
			}
		} elseif ( $detect['method'] === 'meta' ) {
			$args['meta_query'] = array( array(
				'key'   => $detect['meta_key'],
				'value' => (int) $project_id,
			) );
		}
	}
	$q = new WP_Query( $args );
	return $q->posts ?: array();
}

/**
 * Link one flat post to a project using the detected mechanism.
 * Returns an array describing the action, or WP_Error.
 */
function hrc_flat_apply_project_link( $flat_id, $project_id ) {
	$detect = hrc_flat_admin_detect_project_link( HRC_FLAT_REFERENCE_ID );
	if ( is_wp_error( $detect ) ) return $detect;
	if ( $detect['method'] === 'post_parent' ) {
		wp_update_post( array( 'ID' => (int) $flat_id, 'post_parent' => (int) $project_id ) );
		return array( 'method' => 'post_parent', 'project_id' => (int) $project_id );
	}
	if ( $detect['method'] === 'taxonomy' ) {
		$project = get_post( (int) $project_id );
		$term = $project ? get_term_by( 'slug', $project->post_name, $detect['taxonomy'] ) : null;
		if ( ! $term ) return new WP_Error( 'no_term', "no term in {$detect['taxonomy']} for project slug" );
		wp_set_object_terms( (int) $flat_id, array( (int) $term->term_id ), $detect['taxonomy'], false );
		return array( 'method' => 'taxonomy', 'taxonomy' => $detect['taxonomy'], 'term_id' => (int) $term->term_id );
	}
	if ( $detect['method'] === 'meta' ) {
		update_post_meta( (int) $flat_id, $detect['meta_key'], (int) $project_id );
		return array( 'method' => 'meta', 'meta_key' => $detect['meta_key'], 'project_id' => (int) $project_id );
	}
	return new WP_Error( 'link_unknown', 'unknown link method' );
}

function hrc_flat_apply_meta( $post_id, array $raw, $project_id, array $map ) {
	$bhk    = isset( $raw['bhk'] )    ? sanitize_text_field( (string) $raw['bhk'] )    : '3BHK';
	$size   = isset( $raw['size_sqft'] ) ? (int) $raw['size_sqft']                     : 0;
	$tower  = isset( $raw['tower'] )  ? sanitize_text_field( (string) $raw['tower'] )  : '';
	$facing = isset( $raw['facing'] ) ? sanitize_text_field( (string) $raw['facing'] ) : '';
	$price  = isset( $raw['price'] )  ? (float) $raw['price']                          : 0;
	$floor  = array_key_exists( 'floor', $raw ) ? $raw['floor'] : null;
	$flatno = array_key_exists( 'flat_number', $raw ) ? (string) $raw['flat_number'] : '';
	$ribbon = isset( $raw['ribbon'] ) ? hrc_flat_sanitize_ribbon( (string) $raw['ribbon'] ) : 'premium';

	update_post_meta( $post_id, $map['bhk'],    $bhk );
	update_post_meta( $post_id, $map['size'],   $size );
	update_post_meta( $post_id, $map['tower'],  $tower );
	update_post_meta( $post_id, $map['facing'], $facing );

	if ( ! empty( $map['price'] ) ) {
		update_post_meta( $post_id, $map['price'], $price > 0 ? $price : 0 );
	}
	if ( ! empty( $map['floor'] ) ) {
		if ( $floor === null || $floor === '' ) {
			update_post_meta( $post_id, $map['floor'], '' );
		} else {
			update_post_meta( $post_id, $map['floor'], sanitize_text_field( (string) $floor ) );
		}
	}
	if ( ! empty( $map['flat_number'] ) ) {
		update_post_meta( $post_id, $map['flat_number'], sanitize_text_field( $flatno ) );
	}
	if ( ! empty( $map['project'] ) ) {
		update_post_meta( $post_id, $map['project'], (int) $project_id );
	}

	// Ensure HRC listing endpoint includes this flat. HRC's /hrc/v1/flats
	// query filters by _hrc_status; without it the flat is invisible.
	$status_in  = isset( $raw['status'] ) ? sanitize_text_field( (string) $raw['status'] ) : '';
	$status_val = $status_in !== '' ? $status_in : 'Available';
	update_post_meta( $post_id, '_hrc_status', $status_val );

	// HRC listing controller filters flats by presence of _hrc_price / _hrc_floor.
	// Guarantee both keys exist even when the meta map didn't resolve them.
	foreach ( array( '_hrc_price', '_hrc_floor' ) as $mk ) {
		if ( ! metadata_exists( 'post', $post_id, $mk ) ) {
			update_post_meta( $post_id, $mk, '' );
		}
	}

	if ( 'none' === $ribbon ) {
		delete_post_meta( $post_id, HRC_FLAT_RIBBON_META );
	} else {
		update_post_meta( $post_id, HRC_FLAT_RIBBON_META, $ribbon );
	}
}

/* Activation hook lives in the main plugin file (register_activation_hook
 * only fires for the plugin's own base file). */

