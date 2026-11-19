import type { CookieOptions } from "@supabase/ssr";

/** HTTP dev on LAN (IP) — cookies must not be Secure-only. */
export const supabaseCookieDefaults: CookieOptions = {
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};
