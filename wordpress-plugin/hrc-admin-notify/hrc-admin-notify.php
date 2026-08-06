<?php
/**
 * Plugin Name: HRC Admin Lead Notifications
 * Description: Emails every WordPress Administrator whenever a new HRC lead is saved. Companion plugin — does not modify the core HRC plugin.
 * Version:     1.0.0
 * Author:      Hyderabad Realty Choices
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Primary notification recipient for enquiry / contact form leads.
if ( ! defined( 'HRC_ADMIN_NOTIFY_EMAIL' ) ) {
	define( 'HRC_ADMIN_NOTIFY_EMAIL', 'bharathkukudala3009@gmail.com' );
}

/**
 * Collect all administrator email addresses dynamically.
 *
 * @return string[]
 */
function hrc_admin_notify_recipients() {
	// Primary recipient for all enquiry / contact notifications.
	$emails = [ HRC_ADMIN_NOTIFY_EMAIL ];
	$admins = get_users( [ 'role' => 'administrator', 'fields' => [ 'user_email' ] ] );
	foreach ( $admins as $admin ) {
		if ( ! empty( $admin->user_email ) && is_email( $admin->user_email ) ) {
			$emails[] = $admin->user_email;
		}
	}
	return array_values( array_unique( apply_filters( 'hrc_admin_notify_recipients', $emails ) ) );
}

/**
 * Read a lead value from the passed data array, falling back to post meta.
 */
function hrc_admin_notify_value( $lead_id, array $data, $key, array $meta_keys = [] ) {
	if ( ! empty( $data[ $key ] ) ) {
		return (string) $data[ $key ];
	}
	foreach ( $meta_keys as $meta_key ) {
		$value = get_post_meta( $lead_id, $meta_key, true );
		if ( ! empty( $value ) ) {
			return (string) $value;
		}
	}
	return '';
}

/**
 * Send the notification once a lead has been saved successfully.
 * Delivery failures are logged and never affect the stored lead.
 */
add_action( 'hrc_lead_saved', function ( $lead_id, $lead_data = [] ) {
	$lead_data = is_array( $lead_data ) ? $lead_data : [];

	$name    = hrc_admin_notify_value( $lead_id, $lead_data, 'name', [ '_hrc_lead_name' ] );
	$email   = hrc_admin_notify_value( $lead_id, $lead_data, 'email', [ '_hrc_lead_email' ] );
	$mobile  = hrc_admin_notify_value( $lead_id, $lead_data, 'mobile', [ '_hrc_lead_mobile', '_hrc_lead_phone' ] );
	$project = hrc_admin_notify_value( $lead_id, $lead_data, 'project', [ '_hrc_lead_project' ] );
	$source  = hrc_admin_notify_value( $lead_id, $lead_data, 'source', [ '_hrc_lead_source', '_hrc_lead_lead_source' ] );
	$page    = hrc_admin_notify_value( $lead_id, $lead_data, 'page_url', [ '_hrc_lead_page_url', '_hrc_lead_source_url' ] );
	$when    = hrc_admin_notify_value( $lead_id, $lead_data, 'submitted_at', [ '_hrc_lead_submitted_at' ] );

	if ( '' === $when ) {
		$when = get_the_date( 'Y-m-d H:i:s', $lead_id ) ?: current_time( 'mysql' );
	}

	$recipients = hrc_admin_notify_recipients();
	if ( empty( $recipients ) ) {
		error_log( '[HRC Admin Notify] No administrator email addresses found for lead #' . $lead_id );
		return;
	}

	$subject = sprintf( 'New Project Enquiry – %s', $project !== '' ? $project : 'Website' );

	$lines = [
		'A new project enquiry has been received.',
		'',
		'Name: ' . $name,
		'Email: ' . $email,
		'Mobile: ' . $mobile,
		'Project: ' . $project,
		'Lead Source: ' . ( $source !== '' ? $source : 'Website Project Enquiry' ),
		'Page URL: ' . $page,
		'Submitted: ' . $when,
		'',
		'View lead: ' . admin_url( 'post.php?post=' . (int) $lead_id . '&action=edit' ),
	];

	$body    = implode( "\n", $lines );
	$headers = [ 'Content-Type: text/plain; charset=UTF-8' ];

	$sent = wp_mail( $recipients, $subject, $body, $headers );

	if ( ! $sent ) {
		error_log( '[HRC Admin Notify] wp_mail() failed for lead #' . $lead_id . ' — lead remains saved.' );
	}
}, 10, 2 );
