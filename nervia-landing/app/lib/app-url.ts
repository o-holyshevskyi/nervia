/**
 * Main Nervia app URL (sign-in, demo iframe, etc.).
 * Set NEXT_PUBLIC_APP_URL in .env.local for local dev (e.g. http://localhost:3000).
 */
export const APP_URL =
  typeof process.env.NEXT_PUBLIC_APP_URL === "string" &&
  process.env.NEXT_PUBLIC_APP_URL.trim() !== ""
    ? process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")
    : "https://synapse-bookmark-ten.vercel.app";
