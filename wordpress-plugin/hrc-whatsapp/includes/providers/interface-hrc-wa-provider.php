<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * Contract every WhatsApp delivery provider must implement.
 *
 * A provider takes a normalized lead payload + a fully rendered message body
 * and is responsible for actually delivering it (or generating a link an
 * admin can click). Providers MUST NOT throw on failure — return a result
 * array so the notifier can log it uniformly.
 *
 * Return shape:
 *   [
 *     'ok'       => bool,
 *     'provider' => string,     // provider id
 *     'channel'  => string,     // e.g. 'click_to_chat' | 'cloud_api'
 *     'ref'      => string|null,// provider-side message id / url
 *     'error'    => string|null,
 *   ]
 */
interface HRC_WA_Provider_Interface {

	/** Stable provider id, e.g. 'click_to_chat', 'cloud_api'. */
	public function id(): string;

	/** Human label for the settings dropdown. */
	public function label(): string;

	/**
	 * @param array  $lead     Normalized lead: name, phone, email, project, location, visit_date, message, source, submitted_at.
	 * @param string $message  Fully rendered message body (already tokenized).
	 * @param array  $settings Plugin settings array.
	 * @return array           See interface docblock.
	 */
	public function send( array $lead, string $message, array $settings ): array;
}
