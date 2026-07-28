<?php
/**
 * One-time importer for Alekhya Rise flats.
 *
 * Run on the WordPress server with WP-CLI:
 *   wp eval-file wp-content/plugins/hrc-flat-enhancements/../scripts/import-alekhya-rise-flats.php
 * (Or place this file anywhere and use its absolute path.)
 *
 * Behaviour:
 *  - Reads all post_meta from REFERENCE_FLAT_ID (63) to discover the exact
 *    meta keys the HRC plugin uses (bhk, size, tower, facing, price, project).
 *  - For each row below, creates a new `hrc_flat` post if a matching title
 *    does not already exist (idempotent).
 *  - Copies reference-flat meta keys and overrides bhk/size/tower/facing/price
 *    with the row's values. Project relation is copied from the reference flat
 *    so every new flat is attached to Alekhya Rise.
 *  - Sets ribbon meta `_hrc_flat_ribbon` to `premium`.
 *  - Optionally attaches PLACEHOLDER_ATTACHMENT_ID as the featured image.
 *
 * SAFETY: This script does not modify the HRC plugin. It only writes posts
 * and post_meta through core WP APIs. Re-running it is safe (duplicates skipped).
 */

if ( ! defined( 'WP_CLI' ) || ! WP_CLI ) {
	fwrite( STDERR, "Run via: wp eval-file <path-to-this-file>\n" );
	exit( 1 );
}

// ---------------------------------------------------------------- config

const REFERENCE_FLAT_ID       = 63;      // an existing Alekhya Rise flat
const PLACEHOLDER_ATTACHMENT_ID = 0;     // set to an attachment ID, or 0 to skip
const RIBBON_VALUE            = 'premium';
const CPT                     = 'hrc_flat';

$rows = [
	[ 'size' => 3565, 'facing' => 'East',  'tower' => 'D', 'views' => [ 'Lake View', 'ORR View' ] ],
	[ 'size' => 3565, 'facing' => 'East',  'tower' => 'E', 'views' => [ 'Lake View', 'ORR View' ] ],
	[ 'size' => 3675, 'facing' => 'West',  'tower' => 'B', 'views' => [ 'Internal View' ] ],
	[ 'size' => 3675, 'facing' => 'West',  'tower' => 'C', 'views' => [ 'Lake View', 'Outer View' ] ],
	[ 'size' => 3675, 'facing' => 'West',  'tower' => 'D', 'views' => [ 'Lake View', 'ORR View' ] ],
	[ 'size' => 3675, 'facing' => 'West',  'tower' => 'E', 'views' => [ 'Lake View', 'ORR View' ] ],
	[ 'size' => 4260, 'facing' => 'North', 'tower' => 'B', 'views' => [ 'Outer View' ] ],
	[ 'size' => 4260, 'facing' => 'North', 'tower' => 'C', 'views' => [ 'Lake View', 'Outer View' ] ],
	[ 'size' => 4260, 'facing' => 'North', 'tower' => 'D', 'views' => [ 'Lake View', 'Outer View' ] ],
	[ 'size' => 4260, 'facing' => 'North', 'tower' => 'E', 'views' => [ 'Internal View' ] ],
	[ 'size' => 5465, 'facing' => 'East',  'tower' => 'A', 'views' => [ 'ORR Greenery View' ] ],
	[ 'size' => 5465, 'facing' => 'East',  'tower' => 'F', 'views' => [ 'Lake View', 'ORR Greenery View' ] ],
	[ 'size' => 6165, 'facing' => 'North', 'tower' => 'A', 'views' => [ 'ORR Greenery View' ] ],
	[ 'size' => 6130, 'facing' => 'North', 'tower' => 'F', 'views' => [ 'Lake View', 'ORR Greenery View' ] ],
];

// ---------------------------------------------------------------- discover meta keys

$reference = get_post( REFERENCE_FLAT_ID );
if ( ! $reference || $reference->post_type !== CPT ) {
	WP_CLI::error( 'Reference flat ' . REFERENCE_FLAT_ID . ' not found or wrong post_type.' );
}
$ref_meta = get_post_meta( REFERENCE_FLAT_ID );

/**
 * Heuristic key finder — scans reference meta for a key whose value looks
 * like the target, then returns the meta_key so we write to the same one.
 */
$find_key = function ( array $candidates, $expected = null ) use ( $ref_meta ) {
	// prefer exact candidate name match first
	foreach ( $candidates as $c ) {
		if ( isset( $ref_meta[ $c ] ) ) return $c;
	}
	// fallback: match by value
	if ( $expected !== null ) {
		foreach ( $ref_meta as $k => $vals ) {
			$v = is_array( $vals ) ? reset( $vals ) : $vals;
			if ( (string) $v === (string) $expected ) return $k;
		}
	}
	return null;
};

$key_bhk    = $find_key( [ 'bhk', '_bhk', 'hrc_flat_bhk', '_hrc_flat_bhk' ], '3BHK' );
$key_size   = $find_key( [ 'size_sqft', 'size', '_size', 'hrc_flat_size_sqft', '_hrc_flat_size_sqft' ], 3565 );
$key_tower  = $find_key( [ 'tower', '_tower', 'hrc_flat_tower', '_hrc_flat_tower' ], 'C' );
$key_facing = $find_key( [ 'facing', '_facing', 'hrc_flat_facing', '_hrc_flat_facing' ], 'East' );
$key_price  = $find_key( [ 'price', '_price', 'hrc_flat_price', '_hrc_flat_price' ], 0 );
$key_floor  = $find_key( [ 'floor', '_floor', 'hrc_flat_floor', '_hrc_flat_floor' ], 0 );
$key_flatno = $find_key( [ 'flat_number', '_flat_number', 'hrc_flat_number', '_hrc_flat_number' ] );
$key_project = $find_key( [ 'project', 'project_id', '_project_id', 'hrc_flat_project', '_hrc_flat_project' ] );

$project_value = $key_project ? get_post_meta( REFERENCE_FLAT_ID, $key_project, true ) : null;

WP_CLI::log( 'Discovered meta keys:' );
WP_CLI::log( '  bhk     : ' . var_export( $key_bhk, true ) );
WP_CLI::log( '  size    : ' . var_export( $key_size, true ) );
WP_CLI::log( '  tower   : ' . var_export( $key_tower, true ) );
WP_CLI::log( '  facing  : ' . var_export( $key_facing, true ) );
WP_CLI::log( '  price   : ' . var_export( $key_price, true ) );
WP_CLI::log( '  floor   : ' . var_export( $key_floor, true ) );
WP_CLI::log( '  flat_no : ' . var_export( $key_flatno, true ) );
WP_CLI::log( '  project : ' . var_export( $key_project, true ) . ' = ' . var_export( $project_value, true ) );

if ( ! $key_bhk || ! $key_size || ! $key_tower || ! $key_facing ) {
	WP_CLI::error( 'Could not auto-discover core meta keys from reference flat. Inspect meta manually and set keys at the top of this file.' );
}

// ---------------------------------------------------------------- helpers

$make_title = function ( array $r ) {
	$parts = array_merge(
		[ $r['size'] . ' sqft', $r['facing'], 'Tower ' . $r['tower'] ],
		$r['views']
	);
	return implode( ' – ', $parts ); // en dash
};

$title_exists = function ( $title ) {
	$q = new WP_Query( [
		'post_type'      => CPT,
		'post_status'    => [ 'publish', 'draft', 'pending', 'private' ],
		'title'          => $title,
		'posts_per_page' => 1,
		'fields'         => 'ids',
		'no_found_rows'  => true,
	] );
	return $q->have_posts() ? (int) $q->posts[0] : 0;
};

// ---------------------------------------------------------------- run

$created   = [];
$skipped   = [];

foreach ( $rows as $row ) {
	$title = $make_title( $row );

	if ( $existing = $title_exists( $title ) ) {
		$skipped[] = [ 'title' => $title, 'id' => $existing ];
		WP_CLI::log( "SKIP  [{$existing}] {$title}" );
		continue;
	}

	$post_id = wp_insert_post( [
		'post_type'   => CPT,
		'post_status' => 'publish',
		'post_title'  => $title,
	], true );

	if ( is_wp_error( $post_id ) ) {
		WP_CLI::warning( 'Insert failed for: ' . $title . ' — ' . $post_id->get_error_message() );
		continue;
	}

	update_post_meta( $post_id, $key_bhk,    '3BHK' );
	update_post_meta( $post_id, $key_size,   $row['size'] );
	update_post_meta( $post_id, $key_tower,  $row['tower'] );
	update_post_meta( $post_id, $key_facing, $row['facing'] );
	if ( $key_price )  update_post_meta( $post_id, $key_price, 0 );
	if ( $key_floor )  update_post_meta( $post_id, $key_floor, '' );
	if ( $key_flatno ) update_post_meta( $post_id, $key_flatno, '' );
	if ( $key_project && $project_value !== null && $project_value !== '' ) {
		update_post_meta( $post_id, $key_project, $project_value );
	}
	update_post_meta( $post_id, '_hrc_flat_ribbon', RIBBON_VALUE );

	if ( PLACEHOLDER_ATTACHMENT_ID > 0 ) {
		set_post_thumbnail( $post_id, PLACEHOLDER_ATTACHMENT_ID );
	}

	$created[] = [
		'id'     => $post_id,
		'title'  => $title,
		'tower'  => $row['tower'],
		'facing' => $row['facing'],
		'size'   => $row['size'],
		'ribbon' => RIBBON_VALUE,
	];
	WP_CLI::log( "CREATE [{$post_id}] {$title}" );
}

// ---------------------------------------------------------------- report

WP_CLI::success( sprintf( 'Created %d flats, skipped %d duplicates.', count( $created ), count( $skipped ) ) );

WP_CLI::log( "\nCREATED:" );
foreach ( $created as $c ) {
	WP_CLI::log( sprintf(
		'  #%d  %s  | tower=%s facing=%s size=%d sqft ribbon=%s',
		$c['id'], $c['title'], $c['tower'], $c['facing'], $c['size'], $c['ribbon']
	) );
}

if ( $skipped ) {
	WP_CLI::log( "\nSKIPPED (duplicate titles):" );
	foreach ( $skipped as $s ) {
		WP_CLI::log( sprintf( '  #%d  %s', $s['id'], $s['title'] ) );
	}
}
