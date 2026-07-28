# HRC Flat Admin API — Bulk Import

Adds a secure, authenticated WordPress REST endpoint that lets Lovable
create `hrc_flat` posts in bulk without WP-CLI or database access.

- **Route:** `POST /wp-json/hrc-admin/v1/flats/bulk-import`
- **Auth:** WordPress **Application Password** (HTTP Basic)
- **Capability required:** `manage_options` **or** `manage_hrc_flats`
- **Scope:** additive; the HRC plugin is not modified
- **Endpoints:** bulk-import only (no update / delete)

---

## 1. Create a dedicated WordPress integration user

Prefer a dedicated user over your personal admin so credentials can be
rotated or revoked independently.

1. In WP Admin → **Users → Add New**
2. Username: `lovable-integration`, role: **Administrator**
   (or a custom role that has `manage_hrc_flats`; see §7 below)
3. Set a strong password and save. This user does not need to log in
   interactively — the Application Password below is what Lovable uses.

## 2. Generate an Application Password

1. Edit the `lovable-integration` user
2. Scroll to **Application Passwords**
3. Name it `Lovable Bulk Import`, click **Add New Application Password**
4. WordPress shows the password **once** — copy it now, formatted like:
   `abcd EFGH ijkl MNOP qrst UVWX` (spaces are optional when sending)

Application Passwords require WordPress 5.6+ and HTTPS.

## 3. Test with curl (dry run)

Replace `USER` and `APP_PASS` with the values from step 2. Keep spaces
out of the password when placing it in the curl `-u` flag.

```bash
curl -sS -X POST \
  'https://cms.hyderabadrealtychoices.com/wp-json/hrc-admin/v1/flats/bulk-import' \
  -u 'lovable-integration:abcdEFGHijklMNOPqrstUVWX' \
  -H 'Content-Type: application/json' \
  -d '{
    "project_id": 13,
    "placeholder_attachment_id": 0,
    "dry_run": true,
    "flats": [
      {
        "title": "3565 sqft – East – Tower D – Lake View – ORR View",
        "bhk": "3 BHK",
        "size_sqft": 3565,
        "tower": "D",
        "facing": "East",
        "floor": null,
        "flat_number": "",
        "price": 0,
        "ribbon": "premium"
      }
    ]
  }'
```

Expected response (truncated):

```json
{
  "dry_run": true,
  "project_id": 13,
  "created": 1,
  "skipped": 0,
  "error_count": 0,
  "created_ids": [],
  "results": [
    { "index": 0, "title": "3565 sqft – East – Tower D – Lake View – ORR View", "action": "would_create" }
  ]
}
```

If you see `401 Unauthorized`, the Application Password is wrong or the
user was deleted. If you see `403`, the user lacks `manage_options` /
`manage_hrc_flats`.

## 4. Add credentials to Lovable secrets

Store credentials as Lovable runtime secrets so they never appear in the
React bundle. Recommended names:

- `HRC_WP_BASE_URL` — `https://cms.hyderabadrealtychoices.com`
- `HRC_WP_ADMIN_USER` — `lovable-integration`
- `HRC_WP_ADMIN_APP_PASSWORD` — the raw Application Password (no spaces)

Ask Lovable to add them; the agent opens the secure form and stores the
values as backend environment variables.

## 5. Call from a Lovable server-side function

Never call this endpoint from the browser — that would leak the
Application Password. Use a TanStack Start server function:

```ts
// src/lib/flats-import.functions.ts
import { createServerFn } from '@tanstack/react-start'

export const bulkImportFlats = createServerFn({ method: 'POST' })
  .inputValidator((input: {
    project_id: number
    placeholder_attachment_id?: number
    dry_run?: boolean
    flats: unknown[]
  }) => input)
  .handler(async ({ data }) => {
    const base = process.env.HRC_WP_BASE_URL!
    const user = process.env.HRC_WP_ADMIN_USER!
    const pass = process.env.HRC_WP_ADMIN_APP_PASSWORD!
    const auth = Buffer.from(`${user}:${pass}`).toString('base64')

    const res = await fetch(`${base}/wp-json/hrc-admin/v1/flats/bulk-import`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    const body = await res.text()
    if (!res.ok) throw new Error(`WP bulk import failed [${res.status}]: ${body}`)
    return JSON.parse(body)
  })
```

Gate this behind admin auth in the calling component — this endpoint
can create content and must not be reachable by end users.

## 6. Dry-run vs production

- **Dry run** (`"dry_run": true`) validates and reports `would_create` /
  `skipped_duplicate` without touching WordPress. Always run once first.
- **Production** (`"dry_run": false` or omitted) inserts posts, writes
  meta, and (when `placeholder_attachment_id > 0`) sets the featured
  image. The response includes `created_ids` for auditing.

Constraints:

- Maximum **50** flats per request (400 otherwise).
- Duplicate titles under the same project are skipped, not overwritten.
- Missing / empty `floor` and `flat_number` are stored as empty strings.
- `price = 0` is preserved; the frontend renders it as "Price on
  Request".
- Meta keys are auto-discovered once from reference flat **#63** and
  cached in the `hrc_flat_meta_key_map` option. Delete the option to
  force rediscovery.

## 7. Optional: least-privilege role

If you don't want the integration user to be a full administrator:

```php
// Run once in wp-cli or a mu-plugin snippet
add_role('hrc_flat_importer', 'HRC Flat Importer', array(
  'read'              => true,
  'manage_hrc_flats'  => true,
));
```

Assign that role to `lovable-integration` and remove the administrator
role. The endpoint accepts either capability.

## 8. Rollback

Every insert is a regular WordPress post, so rollback options are:

1. **Individual** — use `created_ids` from the response to trash posts:

   ```bash
   curl -X DELETE -u USER:APP_PASS \
     "https://cms.hyderabadrealtychoices.com/wp-json/wp/v2/hrc_flat/<ID>?force=false"
   ```

   `force=false` sends the post to the trash; `force=true` deletes it
   permanently. This uses the core WP endpoint — the HRC plugin exposes
   `hrc_flat` through its own routes but `wp/v2` may or may not be
   registered for it. If not, delete from WP Admin → Flats → Trash.

2. **From WP Admin** — sort Flats by date, select the newly imported
   entries, choose **Move to Trash**.

3. **Revoke access** — delete the Application Password from the user's
   profile; the endpoint immediately rejects further calls with 401.

## 9. Response schema

```jsonc
{
  "dry_run": false,
  "project_id": 13,
  "created": 12,
  "skipped": 2,
  "error_count": 0,
  "created_ids": [201, 202, 203, /* … */],
  "errors": [],
  "results": [
    { "index": 0, "title": "…", "action": "created",           "post_id": 201 },
    { "index": 1, "title": "…", "action": "skipped_duplicate", "post_id": 187 },
    { "index": 2, "title": "…", "action": "error",             "error": "…" }
  ],
  "meta_map": { /* discovered HRC meta keys, for debugging */ }
}
```

`action` is one of `created`, `would_create` (dry run),
`skipped_duplicate`, or `error`.
