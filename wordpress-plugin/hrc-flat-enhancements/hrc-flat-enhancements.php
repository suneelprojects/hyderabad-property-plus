<?php
/**
 * Plugin Name: HRC Flat Enhancements
 * Description: Adds an optional ribbon selector to HRC Flat posts and exposes it (and the featured image) in the /hrc/v1/flats REST response. Zero modifications to the core HRC plugin.
 * Version:     1.0.4
 * Author:      Hyderabad Realty Choices
 * License:     GPL-2.0-or-later
 * Requires PHP: 7.4
 *
 * Safety:
 * - Independently activatable and removable.
 * - Uses only WordPress core APIs (post meta, meta box, REST filter).
 * - Additive: never modifies existing fields; the `ribbon` key defaults to "none".
 * - No database schema changes.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

const HRC_FLAT_POST_TYPE = 'hrc_flat';
const HRC_FLAT_RIBBON_META = '_hrc_flat_ribbon';

// Secure admin REST endpoint (bulk import).
require_once __DIR__ . '/includes/class-hrc-flat-admin-rest.php';

register_activation_hook( __FILE__, function () {
	$role = get_role( 'administrator' );
	if ( $role && ! $role->has_cap( HRC_FLAT_ADMIN_CAP ) ) {
		$role->add_cap( HRC_FLAT_ADMIN_CAP );
	}
} );

/**
 * Allowed ribbon values. Keep in sync with the frontend `FlatRibbon` type.
 */
function hrc_flat_ribbon_choices() {
	return array(
		'none'                 => __( 'None', 'hrc' ),
		'featured'             => __( 'Featured', 'hrc' ),
		'premium'              => __( 'Premium', 'hrc' ),
		'best_value'           => __( 'Best Value', 'hrc' ),
		'limited_availability' => __( 'Limited Availability', 'hrc' ),
		'ready_to_move'        => __( 'Ready to Move', 'hrc' ),
		'hot_deal'             => __( 'Hot Deal', 'hrc' ),
	);
}

function hrc_flat_sanitize_ribbon( $value ) {
	$value = is_string( $value ) ? strtolower( trim( $value ) ) : 'none';
	$choices = hrc_flat_ribbon_choices();
	return isset( $choices[ $value ] ) ? $value : 'none';
}

/* -------------------------------------------------------------------------
 * Meta box
 * ---------------------------------------------------------------------- */

add_action( 'add_meta_boxes', function () {
	add_meta_box(
		'hrc_flat_ribbon',
		__( 'Flat Ribbon', 'hrc' ),
		'hrc_flat_render_ribbon_meta_box',
		HRC_FLAT_POST_TYPE,
		'side',
		'default'
	);
} );

function hrc_flat_render_ribbon_meta_box( $post ) {
	$current = get_post_meta( $post->ID, HRC_FLAT_RIBBON_META, true );
	if ( ! $current ) {
		$current = 'none';
	}
	wp_nonce_field( 'hrc_flat_ribbon_save', 'hrc_flat_ribbon_nonce' );
	echo '<p><label for="hrc_flat_ribbon_field" style="display:block;margin-bottom:6px;font-weight:600;">'
		. esc_html__( 'Ribbon Label', 'hrc' ) . '</label>';
	echo '<select id="hrc_flat_ribbon_field" name="hrc_flat_ribbon" style="width:100%;">';
	foreach ( hrc_flat_ribbon_choices() as $value => $label ) {
		printf(
			'<option value="%s" %s>%s</option>',
			esc_attr( $value ),
			selected( $current, $value, false ),
			esc_html( $label )
		);
	}
	echo '</select></p>';
	echo '<p style="color:#666;font-size:12px;margin-top:8px;">'
		. esc_html__( 'Shown as a badge on the flat card. Select "None" to hide.', 'hrc' )
		. '</p>';
}

add_action( 'save_post_' . HRC_FLAT_POST_TYPE, function ( $post_id ) {
	if ( defined( 'DOING_AUTOSAVE' ) && DOING_AUTOSAVE ) return;
	if ( ! isset( $_POST['hrc_flat_ribbon_nonce'] )
		|| ! wp_verify_nonce( sanitize_text_field( wp_unslash( $_POST['hrc_flat_ribbon_nonce'] ) ), 'hrc_flat_ribbon_save' ) ) {
		return;
	}
	if ( ! current_user_can( 'edit_post', $post_id ) ) return;

	$raw = isset( $_POST['hrc_flat_ribbon'] ) ? sanitize_text_field( wp_unslash( $_POST['hrc_flat_ribbon'] ) ) : 'none';
	$value = hrc_flat_sanitize_ribbon( $raw );

	if ( 'none' === $value ) {
		delete_post_meta( $post_id, HRC_FLAT_RIBBON_META );
	} else {
		update_post_meta( $post_id, HRC_FLAT_RIBBON_META, $value );
	}
} );

/* -------------------------------------------------------------------------
 * REST: extend HRC responses that carry flat objects with `ribbon` and
 * `featured_image`. The custom HRC controller does NOT run through
 * register_rest_field(), so we augment its output via rest_post_dispatch —
 * a core WP filter that fires for every REST response, including custom
 * routes. We handle three shapes observed on the live API:
 *
 *   1) /hrc/v1/flats                    -> { items: [ flat, ... ], ... }
 *   2) /hrc/v1/flats/{id}               -> { id, ... }  (single flat)
 *   3) /hrc/v1/projects/{slug}          -> { ..., flats: [ flat, ... ] }
 *
 * We only touch objects that look like a flat (post_type === hrc_flat).
 * ---------------------------------------------------------------------- */

function hrc_flat_is_flat_post( $id ) {
	if ( ! $id ) return false;
	$pt = get_post_type( (int) $id );
	return $pt === HRC_FLAT_POST_TYPE;
}

function hrc_flat_augment( array $item ) {
	if ( empty( $item['id'] ) || ! hrc_flat_is_flat_post( $item['id'] ) ) {
		return $item;
	}
	$id = (int) $item['id'];

	// Ribbon — always present; "none" when unset.
	$stored = get_post_meta( $id, HRC_FLAT_RIBBON_META, true );
	$item['ribbon'] = $stored ? hrc_flat_sanitize_ribbon( $stored ) : 'none';

	// featured_image — only when the upstream response left it empty/false.
	$existing = array_key_exists( 'featured_image', $item ) ? $item['featured_image'] : null;
	if ( empty( $existing ) ) {
		$thumb_id = get_post_thumbnail_id( $id );
		if ( $thumb_id ) {
			$url = wp_get_attachment_image_url( $thumb_id, 'large' );
			$item['featured_image'] = $url ? $url : false;
		} elseif ( ! array_key_exists( 'featured_image', $item ) ) {
			$item['featured_image'] = false;
		}
	}
	return $item;
}

add_filter( 'rest_post_dispatch', function ( $response, $server, $request ) {
	if ( ! ( $response instanceof WP_REST_Response ) ) return $response;

	$route = $request->get_route();
	// Only touch our custom HRC namespace.
	if ( strpos( $route, '/hrc/v1/' ) !== 0 ) return $response;

	$data = $response->get_data();
	if ( ! is_array( $data ) ) return $response;

	// (1) Wrapped collection { items: [...] } — e.g. /hrc/v1/flats, /hrc/v1/projects
	if ( isset( $data['items'] ) && is_array( $data['items'] ) ) {
		foreach ( $data['items'] as $i => $it ) {
			if ( is_array( $it ) ) $data['items'][ $i ] = hrc_flat_augment( $it );
		}
	}

	// (2) Single flat resource — { id, ... } where id is an hrc_flat post
	if ( isset( $data['id'] ) && hrc_flat_is_flat_post( $data['id'] ) ) {
		$data = hrc_flat_augment( $data );
	}

	// (3) Project resource with embedded flats array — { flats: [ ... ] }
	if ( isset( $data['flats'] ) && is_array( $data['flats'] ) ) {
		foreach ( $data['flats'] as $i => $it ) {
			if ( is_array( $it ) ) $data['flats'][ $i ] = hrc_flat_augment( $it );
		}
	}

	// (4) Bare list [ flat, flat, ... ] — defensive
	if ( isset( $data[0] ) && is_array( $data[0] ) ) {
		foreach ( $data as $i => $it ) {
			if ( is_array( $it ) ) $data[ $i ] = hrc_flat_augment( $it );
		}
	}

	$response->set_data( $data );
	return $response;
}, 20, 3 );



/* -------------------------------------------------------------------------
 * Ensure `hrc_flat` supports thumbnails (safe no-op if it already does).
 * ---------------------------------------------------------------------- */

add_action( 'init', function () {
	if ( post_type_exists( HRC_FLAT_POST_TYPE ) ) {
		add_post_type_support( HRC_FLAT_POST_TYPE, 'thumbnail' );
	}
}, 20 );
