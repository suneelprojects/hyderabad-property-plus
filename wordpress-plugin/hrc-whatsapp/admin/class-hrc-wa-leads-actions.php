<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Adds "Call Customer" + "WhatsApp Customer" row actions to the HRC Leads
 * list table, plus a "WhatsApp" status column.
 *
 * Post type is auto-detected via the `hrc_wa_lead_post_type` filter; default
 * is `hrc_lead`. This keeps the plugin self-contained and lets the host
 * plugin override without editing this file.
 */
class HRC_WA_Leads_Actions {

	public static function init(): void {
		$pt = self::post_type();
		add_filter( "manage_{$pt}_posts_columns",       [ __CLASS__, 'columns' ] );
		add_action( "manage_{$pt}_posts_custom_column", [ __CLASS__, 'column' ], 10, 2 );
		add_filter( 'post_row_actions',                 [ __CLASS__, 'row_actions' ], 10, 2 );
	}

	protected static function post_type(): string {
		return (string) apply_filters( 'hrc_wa_lead_post_type', 'hrc_lead' );
	}

	public static function columns( array $cols ): array {
		$cols['hrc_wa'] = 'WhatsApp';
		return $cols;
	}

	public static function column( string $col, int $post_id ): void {
		if ( $col !== 'hrc_wa' ) return;
		$status = get_post_meta( $post_id, HRC_WA_Logger::META_STATUS, true );
		$err    = get_post_meta( $post_id, HRC_WA_Logger::META_LAST_ERR, true );
		if ( $status === 'sent' ) {
			echo '<span title="' . esc_attr( 'Sent ' . get_post_meta( $post_id, HRC_WA_Logger::META_SENT_AT, true ) ) . '" style="color:#25D366;">● sent</span>';
		} elseif ( $status === 'failed' ) {
			echo '<span title="' . esc_attr( $err ) . '" style="color:#d63638;">● failed</span>';
		} else {
			echo '<span style="color:#999;">—</span>';
		}
	}

	public static function row_actions( array $actions, $post ): array {
		if ( ! $post || $post->post_type !== self::post_type() ) return $actions;
		if ( ! current_user_can( 'edit_post', $post->ID ) ) return $actions;

		$lead = HRC_WA_Notifier::normalize_lead( (int) $post->ID, [] );
		if ( empty( $lead['phone'] ) ) return $actions;

		$digits = HRC_WA_Notifier::normalize_phone( $lead['phone'] );
		$settings = HRC_WA_Settings::get();
		$reply_body = HRC_WA_Templates::render(
			$settings['customer_reply_template'] ?? HRC_WA_Templates::default_customer_reply(),
			$lead
		);

		$tel_url = 'tel:+' . $digits;
		$wa_url  = 'https://wa.me/' . rawurlencode( $digits ) . '?text=' . rawurlencode( $reply_body );

		$actions['hrc_call'] = sprintf(
			'<a href="%s">📞 Call</a>', esc_url( $tel_url )
		);
		$actions['hrc_wa'] = sprintf(
			'<a href="%s" target="_blank" rel="noopener">💬 WhatsApp</a>', esc_url( $wa_url )
		);
		return $actions;
	}
}
