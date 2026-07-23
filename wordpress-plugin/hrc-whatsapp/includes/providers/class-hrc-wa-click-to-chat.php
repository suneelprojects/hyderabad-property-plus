<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Click-to-Chat provider.
 *
 * Cannot auto-send. Instead:
 *   1. Builds a wa.me deep link with the lead notification prefilled.
 *   2. Emails the sales team that link so any agent can tap once and open
 *      WhatsApp with the full lead already typed.
 *
 * Zero external dependencies, zero API keys, ships today.
 */
class HRC_WA_Click_To_Chat implements HRC_WA_Provider_Interface {

	public function id(): string { return 'click_to_chat'; }
	public function label(): string { return 'Click-to-Chat (wa.me link + email)'; }

	public function send( array $lead, string $message, array $settings ): array {
		$sales_number = HRC_WA_Notifier::normalize_phone( $settings['sales_number'] ?? '' );
		if ( ! $sales_number ) {
			return [
				'ok' => false, 'provider' => $this->id(), 'channel' => 'click_to_chat',
				'ref' => null, 'error' => 'Sales WhatsApp number not configured',
			];
		}

		$wa_link = 'https://wa.me/' . rawurlencode( $sales_number )
			. '?text=' . rawurlencode( $message );

		$to = $settings['notify_email']
			?? get_option( 'admin_email' );

		$subject = sprintf( '[HRC Lead] %s — %s',
			$lead['name'] ?? 'New enquiry',
			$lead['project'] ?: ( $lead['location'] ?: 'General' )
		);

		$body  = "A new lead has been received.\n\n";
		$body .= $message . "\n\n";
		$body .= "Tap to WhatsApp the sales team with this pre-filled message:\n";
		$body .= $wa_link . "\n";

		$sent = wp_mail( $to, $subject, $body );

		return [
			'ok'       => (bool) $sent,
			'provider' => $this->id(),
			'channel'  => 'click_to_chat',
			'ref'      => $wa_link,
			'error'    => $sent ? null : 'wp_mail() returned false',
		];
	}
}
