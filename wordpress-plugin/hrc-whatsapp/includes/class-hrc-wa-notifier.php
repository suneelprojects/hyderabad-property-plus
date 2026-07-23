<?php
if ( ! defined( 'ABSPATH' ) ) exit;

/**
 * The isolation layer between the existing lead save flow and any WhatsApp
 * delivery. Listens on `hrc_lead_saved` (emitted by the HRC leads plugin
 * AFTER a successful save) and dispatches to the configured provider.
 *
 * Guarantees:
 *   - Never throws back to the caller — the existing enquiry flow is safe.
 *   - Runs synchronously by default; can be flipped to WP-Cron by filter
 *     `hrc_wa_defer` returning true.
 *   - Provider selection is data-driven; no if/else on provider id inside
 *     business logic.
 */
class HRC_WA_Notifier {

	/** @var array<string, HRC_WA_Provider_Interface> */
	protected static $providers = [];

	public static function init(): void {
		// Register built-in providers. Third parties can add more via the filter.
		self::register( new HRC_WA_Click_To_Chat() );
		self::register( new HRC_WA_Cloud_API() );

		/**
		 * Filter: hrc_wa_providers
		 * Allows plugins to register additional providers (Twilio, Gupshup, …).
		 * @param array<string, HRC_WA_Provider_Interface> $providers
		 */
		self::$providers = apply_filters( 'hrc_wa_providers', self::$providers );

		add_action( 'hrc_lead_saved', [ __CLASS__, 'on_lead_saved' ], 10, 2 );
	}

	public static function register( HRC_WA_Provider_Interface $p ): void {
		self::$providers[ $p->id() ] = $p;
	}

	/** @return array<string, HRC_WA_Provider_Interface> */
	public static function providers(): array {
		return self::$providers;
	}

	/**
	 * Entry point. Bound to the WP action so we can be swapped out with
	 * remove_action() without touching the lead save code.
	 */
	public static function on_lead_saved( $lead_id, $lead_data = [] ): void {
		try {
			$settings = HRC_WA_Settings::get();
			if ( empty( $settings['enabled'] ) ) return;

			$provider_id = $settings['provider'] ?? 'click_to_chat';
			$provider    = self::$providers[ $provider_id ] ?? null;
			if ( ! $provider ) return;

			$lead    = self::normalize_lead( (int) $lead_id, (array) $lead_data );
			$message = HRC_WA_Templates::render(
				$settings['notification_template'] ?? HRC_WA_Templates::default_notification(),
				$lead
			);

			if ( apply_filters( 'hrc_wa_defer', false, $lead, $settings ) ) {
				wp_schedule_single_event( time() + 5, 'hrc_wa_deferred_send', [ $lead_id, $provider_id, $message ] );
				return;
			}

			$result = $provider->send( $lead, $message, $settings );
			HRC_WA_Logger::record( (int) $lead_id, $result );
		} catch ( \Throwable $e ) {
			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( '[HRC WA] notifier threw: ' . $e->getMessage() );
			}
			// Swallow — existing enquiry flow must not be affected.
		}
	}

	/**
	 * Build the canonical lead payload used by templates and providers.
	 * Reads from the passed array first, then falls back to post meta on
	 * the lead CPT (so this works whether the host plugin passes full data
	 * or just the ID).
	 */
	public static function normalize_lead( int $lead_id, array $data ): array {
		$get = function ( $key, $meta_key = null ) use ( $data, $lead_id ) {
			if ( isset( $data[ $key ] ) && $data[ $key ] !== '' ) return (string) $data[ $key ];
			if ( $lead_id > 0 && $meta_key ) {
				$v = get_post_meta( $lead_id, $meta_key, true );
				if ( $v !== '' ) return (string) $v;
			}
			return '';
		};

		return [
			'id'           => (string) $lead_id,
			'name'         => $get( 'name',       '_hrc_lead_name' ),
			'phone'        => $get( 'phone',      '_hrc_lead_phone' )
							?: $get( 'mobile',    '_hrc_lead_mobile' ),
			'email'        => $get( 'email',      '_hrc_lead_email' ),
			'project'      => $get( 'project',    '_hrc_lead_project' ),
			'location'     => $get( 'location',   '_hrc_lead_location' ),
			'visit_date'   => $get( 'visit_date', '_hrc_lead_visit_date' ),
			'message'      => $get( 'message',    '_hrc_lead_message' ),
			'source'       => $get( 'source',     '_hrc_lead_source' ),
			'submitted_at' => $get( 'submitted_at', '_hrc_lead_submitted_at' )
							?: current_time( 'mysql' ),
		];
	}

	public static function normalize_phone( string $raw ): string {
		$digits = preg_replace( '/\D+/', '', $raw );
		if ( $digits === '' ) return '';
		if ( strlen( $digits ) === 10 )                       return '91' . $digits;
		if ( strlen( $digits ) === 11 && $digits[0] === '0' ) return '91' . substr( $digits, 1 );
		return $digits;
	}
}

// Deferred-send hook (used only when the `hrc_wa_defer` filter returns true).
add_action( 'hrc_wa_deferred_send', function ( $lead_id, $provider_id, $message ) {
	$providers = HRC_WA_Notifier::providers();
	if ( empty( $providers[ $provider_id ] ) ) return;
	$settings = HRC_WA_Settings::get();
	$lead     = HRC_WA_Notifier::normalize_lead( (int) $lead_id, [] );
	$result   = $providers[ $provider_id ]->send( $lead, (string) $message, $settings );
	HRC_WA_Logger::record( (int) $lead_id, $result );
}, 10, 3 );
