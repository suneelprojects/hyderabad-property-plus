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
} );

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
	$key_project = $find( array( 'project', 'project_id', '_project_id', 'hrc_flat_project', '_hrc_flat_project' ) );

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

		// Duplicate check — same title within the same project.
		$existing_id = hrc_flat_find_by_title_and_project( $title, $project_id, $map );
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
	if ( ! $project_key ) {
		// No project meta key discovered — fall back to title-only dedupe.
		return (int) $q->posts[0];
	}
	foreach ( $q->posts as $pid ) {
		$val = get_post_meta( (int) $pid, $project_key, true );
		if ( (int) $val === (int) $project_id ) {
			return (int) $pid;
		}
	}
	return 0;
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

	if ( 'none' === $ribbon ) {
		delete_post_meta( $post_id, HRC_FLAT_RIBBON_META );
	} else {
		update_post_meta( $post_id, HRC_FLAT_RIBBON_META, $ribbon );
	}
}

/* Activation hook lives in the main plugin file (register_activation_hook
 * only fires for the plugin's own base file). */

