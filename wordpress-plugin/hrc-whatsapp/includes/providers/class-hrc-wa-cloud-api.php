<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Meta WhatsApp Cloud API provider.
 *
 * Sends a pre-approved template message to the configured sales number.
 * Requires (configured in Settings → HRC WhatsApp):
 *   - phone_number_id  (Meta-side sender)
 *   - access_token     (permanent system-user token — store in wp-config if possible)
 *   - template_name    (approved template)
 *   - template_lang    (e.g. en_US)
 *
 * Template must accept the notification text as its first body variable
 * (`{{1}}`). Keeps the template simple so it survives Meta re-approval.
 *
 * Secrets are NEVER exposed via REST; they live only in wp_options
 * (autoload = no) or wp-config constants.
 */
class HRC_WA_Cloud_API implements HRC_WA_Provider_Interface {

	public function id(): string { return 'cloud_api'; }
	public function label(): string { return 'Meta WhatsApp Cloud API'; }

	public function send( array $lead, string $message, array $settings ): array {
		$phone_number_id = $settings['cloud_phone_number_id'] ?? '';
		$access_token    = defined( 'HRC_WA_CLOUD_TOKEN' )
			? HRC_WA_CLOUD_TOKEN
			: ( $settings['cloud_access_token'] ?? '' );
		$template_name   = $settings['cloud_template_name'] ?? '';
		$template_lang   = $settings['cloud_template_lang'] ?? 'en_US';
		$to              = HRC_WA_Notifier::normalize_phone( $settings['sales_number'] ?? '' );

		foreach ( [
			'phone_number_id' => $phone_number_id,
			'access_token'    => $access_token,
			'template_name'   => $template_name,
			'sales_number'    => $to,
		] as $k => $v ) {
			if ( empty( $v ) ) {
				return [
					'ok' => false, 'provider' => $this->id(), 'channel' => 'cloud_api',
					'ref' => null, 'error' => "Missing setting: $k",
				];
			}
		}

		$endpoint = "https://graph.facebook.com/v20.0/{$phone_number_id}/messages";

		$body = [
			'messaging_product' => 'whatsapp',
			'to'                => $to,
			'type'              => 'template',
			'template'          => [
				'name'     => $template_name,
				'language' => [ 'code' => $template_lang ],
				'components' => [ [
					'type' => 'body',
					'parameters' => [ [ 'type' => 'text', 'text' => $message ] ],
				] ],
			],
		];

		$resp = wp_remote_post( $endpoint, [
			'timeout' => 15,
			'headers' => [
				'Authorization' => 'Bearer ' . $access_token,
				'Content-Type'  => 'application/json',
			],
			'body'    => wp_json_encode( $body ),
		] );

		if ( is_wp_error( $resp ) ) {
			return [
				'ok' => false, 'provider' => $this->id(), 'channel' => 'cloud_api',
				'ref' => null, 'error' => $resp->get_error_message(),
			];
		}

		$code  = wp_remote_retrieve_response_code( $resp );
		$json  = json_decode( wp_remote_retrieve_body( $resp ), true );

		if ( $code >= 200 && $code < 300 ) {
			$id = $json['messages'][0]['id'] ?? null;
			return [
				'ok' => true, 'provider' => $this->id(), 'channel' => 'cloud_api',
				'ref' => $id, 'error' => null,
			];
		}

		$err = $json['error']['message'] ?? ( 'HTTP ' . $code );
		return [
			'ok' => false, 'provider' => $this->id(), 'channel' => 'cloud_api',
			'ref' => null, 'error' => $err,
		];
	}
}
