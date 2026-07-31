/**
 * WhatsApp click-to-chat helpers.
 *
 * Pure utilities — no React, no side effects. Used by the floating CTA and
 * anywhere else we need a wa.me link.
 */

export const DEFAULT_SALES_WHATSAPP = "919000000000"; // fallback if /meta has none

/** Single sales WhatsApp number used by every click-to-chat CTA. */
export const SALES_WHATSAPP_NUMBER = "918247766377";

/**
 * Normalize a phone number to E.164-digits for wa.me (no `+`, no spaces).
 * Accepts inputs like "+91 90000 00000", "090000-00000", "9000000000".
 * Defaults country code to India (91) when a bare 10-digit number is given.
 */
export function normalizeWhatsAppNumber(raw: string | undefined | null): string {
  if (!raw) return DEFAULT_SALES_WHATSAPP;
  const digits = String(raw).replace(/\D+/g, "");
  if (!digits) return DEFAULT_SALES_WHATSAPP;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

export interface BuildWaLinkArgs {
  phone: string;
  text: string;
}

export function buildWaLink({ phone, text }: BuildWaLinkArgs): string {
  const number = normalizeWhatsAppNumber(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

// ---------------------------------------------------------------------------
// Message templates

export const WA_MESSAGES = {
  home: () =>
    `Hi,\n\nI'm looking for a premium property in Hyderabad. Can someone assist me?`,

  project: (name: string) =>
    `Hi,\n\nI'm interested in ${name}. Can you please share:\n• Brochure\n• Pricing\n• Floor Plans\n• Availability`,

  location: (name: string) =>
    `Hi,\n\nI'm looking for properties in ${name}. Can someone assist me?`,
} as const;
