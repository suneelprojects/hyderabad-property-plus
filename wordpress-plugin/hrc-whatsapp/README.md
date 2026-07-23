# HRC WhatsApp

Adds a floating WhatsApp CTA (frontend, in the Lovable app) and an isolated,
provider-based lead-notification system (this WordPress plugin) on top of the
existing HRC Leads workflow. The existing enquiry submission flow
(`admin-ajax.php` → `hrc_submit_lead`) is **not modified**.

## Requirements

The host HRC Leads plugin must emit **one** action right after a successful
lead insert:

```php
do_action( 'hrc_lead_saved', (int) $lead_id, (array) $lead_data );
```

Recommended `$lead_data` keys (all optional — meta fallbacks are used):
`name`, `phone`, `email`, `project`, `location`, `visit_date`, `message`,
`source`, `submitted_at`.

If you can't edit the host plugin, wire it up externally:

```php
add_action( 'save_post_hrc_lead', function ( $post_id, $post, $update ) {
    if ( $update ) return;
    do_action( 'hrc_lead_saved', $post_id, [] );
}, 20, 3 );
```

## Install

1. Copy this folder to `wp-content/plugins/hrc-whatsapp/`.
2. Activate "HRC WhatsApp" from Plugins.
3. Go to **Settings → HRC WhatsApp** and configure:
   - Provider (start with **Click-to-Chat**)
   - Sales WhatsApp number
   - Notification Email
   - (Later) Meta Cloud API credentials

For the Cloud API access token, prefer defining it in `wp-config.php`:

```php
define( 'HRC_WA_CLOUD_TOKEN', 'EA...your-permanent-token...' );
```

## Architecture

```
Lead save (existing)
   │
   ▼
do_action( 'hrc_lead_saved', $id, $data )   ← one-line change in host plugin
   │
   ▼
HRC_WA_Notifier::on_lead_saved()   (try/catch — never breaks lead save)
   │
   ▼
Provider (Click-to-Chat | Cloud API | 3rd-party)
   │
   ▼
HRC_WA_Logger  → post meta on the lead
```

## Extending

Add a custom provider (Twilio, Gupshup, AiSensy…):

```php
add_filter( 'hrc_wa_providers', function ( $providers ) {
    require_once __DIR__ . '/class-my-twilio-provider.php';
    $providers['twilio'] = new My_Twilio_Provider();
    return $providers;
} );
```

Defer sends to WP-Cron (e.g. behind a queue):

```php
add_filter( 'hrc_wa_defer', '__return_true' );
```

Change the lead post type:

```php
add_filter( 'hrc_wa_lead_post_type', fn () => 'my_lead_cpt' );
```

## Uninstall / rollback

Deactivate the plugin. The existing enquiry flow is untouched, so leads keep
saving normally. Delete the plugin folder to remove all code; delete the
`hrc_wa_settings` option to wipe config.
