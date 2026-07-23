<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Persist notifier delivery attempts against the lead post as post meta.
 * Keeps things simple (no custom table) and gives the leads dashboard
 * enough data to show WhatsApp status per lead.
 *
 * A dedicated wp_hrc_wa_log table can be added later without changing
 * caller signatures — that's why the reads/writes go through this class.
 */
class HRC_WA_Logger {

	const META_STATUS   = '_hrc_wa_status';
	const META_LAST_ERR = '_hrc_wa_last_error';
	const META_SENT_AT  = '_hrc_wa_sent_at';
	const META_LINK     = '_hrc_wa_link';
	const META_PROVIDER = '_hrc_wa_provider';

	public static function record( int $lead_id, array $result ): void {
		if ( $lead_id <= 0 ) return;
		update_post_meta( $lead_id, self::META_STATUS,   $result['ok'] ? 'sent' : 'failed' );
		update_post_meta( $lead_id, self::META_PROVIDER, $result['provider'] ?? '' );
		update_post_meta( $lead_id, self::META_SENT_AT,  current_time( 'mysql' ) );
		if ( ! empty( $result['ref'] ) ) {
			update_post_meta( $lead_id, self::META_LINK, $result['ref'] );
		}
		update_post_meta( $lead_id, self::META_LAST_ERR, $result['error'] ?? '' );

		if ( ! $result['ok'] && defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( sprintf(
				'[HRC WA] lead #%d failed via %s: %s',
				$lead_id, $result['provider'] ?? '?', $result['error'] ?? '?'
			) );
		}
	}
}
