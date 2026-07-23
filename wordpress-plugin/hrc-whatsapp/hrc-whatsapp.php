<?php
/**
 * Plugin Name:       HRC WhatsApp
 * Description:       Adds quick call/WhatsApp actions to the HRC Leads dashboard and an isolated, provider-based WhatsApp notifier fired when a lead is saved. Does NOT modify the existing enquiry submission flow.
 * Version:           1.0.0
 * Author:            Hyderabad Realty Choices
 * License:           GPL-2.0-or-later
 * Text Domain:       hrc-whatsapp
 *
 * Architecture:
 *   Lead Save (existing hrc_submit_lead)
 *     → do_action( 'hrc_lead_saved', $lead_id, $lead_data )   [emitted by host plugin]
 *       → HRC_WA_Notifier::dispatch()  (this plugin, isolated, try/catch)
 *         → Provider (Click-to-Chat | Meta Cloud API)
 *
 * If the notifier throws, the lead is still saved — dispatch runs in a
 * shutdown-safe wrapper and never re-throws to the caller.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'HRC_WA_VERSION', '1.0.0' );
define( 'HRC_WA_PATH', plugin_dir_path( __FILE__ ) );
define( 'HRC_WA_URL', plugin_dir_url( __FILE__ ) );
define( 'HRC_WA_OPTION', 'hrc_wa_settings' );

require_once HRC_WA_PATH . 'includes/providers/interface-hrc-wa-provider.php';
require_once HRC_WA_PATH . 'includes/providers/class-hrc-wa-click-to-chat.php';
require_once HRC_WA_PATH . 'includes/providers/class-hrc-wa-cloud-api.php';
require_once HRC_WA_PATH . 'includes/class-hrc-wa-templates.php';
require_once HRC_WA_PATH . 'includes/class-hrc-wa-logger.php';
require_once HRC_WA_PATH . 'includes/class-hrc-wa-notifier.php';
require_once HRC_WA_PATH . 'admin/class-hrc-wa-settings.php';
require_once HRC_WA_PATH . 'admin/class-hrc-wa-leads-actions.php';

register_activation_hook( __FILE__, [ 'HRC_WA_Settings', 'install_defaults' ] );

add_action( 'plugins_loaded', function () {
	HRC_WA_Settings::init();
	HRC_WA_Leads_Actions::init();
	HRC_WA_Notifier::init();
} );
