/**
 * Image source helpers — WordPress often returns `false` for missing images,
 * and gallery URLs may be a mix of strings and objects. Normalize to a plain
 * string | null so components don't have to.
 */

const FALLBACK_IMAGE =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'>
      <rect width='800' height='600' fill='#E9EEF7'/>
      <text x='50%' y='50%' fill='#5B6478' font-family='Manrope, sans-serif'
        font-size='18' text-anchor='middle' dominant-baseline='middle'>
        Image coming soon
      </text>
    </svg>`,
  );

export function imageSrc(
  value: string | false | null | undefined,
  fallback: string | null = FALLBACK_IMAGE,
): string {
  if (typeof value === "string" && value.length > 0) return value;
  return fallback ?? "";
}

export { FALLBACK_IMAGE };
