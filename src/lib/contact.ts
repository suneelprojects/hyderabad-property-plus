/**
 * Single source of truth for the company contact email.
 *
 * Every mailto link and displayed email address across the site reads from
 * here so the address only ever has to change in one place.
 */

export const CONTACT_EMAIL = "bharathkukudala3009@gmail.com";
export const CONTACT_EMAIL_HREF = `mailto:${CONTACT_EMAIL}`;
