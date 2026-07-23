<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Tiny mustache-style renderer for message templates.
 *
 * Only replaces `{{token}}` where token is a key in the given data array.
 * Missing tokens render as empty strings (never leak `{{...}}` to WhatsApp).
 */
class HRC_WA_Templates {

	public static function render( string $tpl, array $data ): string {
		return preg_replace_callback( '/\{\{\s*([a-z0-9_]+)\s*\}\}/i', function ( $m ) use ( $data ) {
			$key = strtolower( $m[1] );
			return isset( $data[ $key ] ) ? (string) $data[ $key ] : '';
		}, $tpl );
	}

	public static function default_notification(): string {
		return "New Lead — Hyderabad Realty Choices\n\n"
			. "Name: {{name}}\n"
			. "Phone: {{phone}}\n"
			. "Email: {{email}}\n"
			. "Project: {{project}}\n"
			. "Location: {{location}}\n"
			. "Visit Date: {{visit_date}}\n"
			. "Message: {{message}}\n"
			. "Source: {{source}}\n"
			. "Submitted: {{submitted_at}}";
	}

	public static function default_customer_reply(): string {
		return "Hi {{name}},\n\n"
			. "Thank you for contacting Hyderabad Realty Choices. "
			. "Our Property Advisor will connect with you shortly.\n\n"
			. "Meanwhile, let us know if you have any questions.";
	}
}
