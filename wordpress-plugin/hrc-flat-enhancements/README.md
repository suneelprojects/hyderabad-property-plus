# HRC Flat Enhancements

A tiny companion plugin that adds two optional, additive fields to the
`hrc_flat` custom post type — without touching the core HRC plugin.

## What it adds

1. **Ribbon dropdown** (meta box on the flat editor sidebar) with values:
   None, Featured, Premium, Best Value, Limited Availability,
   Ready to Move, Hot Deal. Stored in post meta `_hrc_flat_ribbon`.
2. **Ribbon + Featured Image** exposed on every item returned by the
   existing `/hrc/v1/flats` REST route as `ribbon` and `featured_image`
   (only added when missing — never overwritten).

## Safety

- Zero edits to the HRC plugin.
- No database schema changes.
- Independently activatable and removable.
- Missing / empty ribbon always returns `"none"` so the frontend simply
  hides the badge.
- Ensures `hrc_flat` supports post thumbnails (no-op if already enabled).

## Admin — set a flat image

1. WP Admin → **Flats** → open the flat.
2. In the sidebar, use **Featured image → Set featured image** and pick
   an image from the Media library.
3. **Update** the post.

## Admin — select a ribbon

1. WP Admin → **Flats** → open the flat.
2. Sidebar → **Flat Ribbon** meta box → choose a value (or **None** to
   hide it).
3. **Update** the post.

## Deploy

1. Upload the `hrc-flat-enhancements/` folder to `wp-content/plugins/`.
2. WP Admin → **Plugins** → **Activate** _HRC Flat Enhancements_.
3. Hard-refresh any cached REST responses if caching is in use.

## Rollback

- WP Admin → **Plugins** → **Deactivate** the plugin. The `ribbon` and
  extra `featured_image` values disappear from the API; frontend falls
  back to the project image and hides the badge automatically.
- To remove stored ribbon values, delete post meta `_hrc_flat_ribbon`
  (optional).
