import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // Persist session in localStorage so user stays logged in
        persistSession: true,
        // Auto refresh token before expiry
        autoRefreshToken: true,
        // Detect session from URL (needed for OAuth PKCE flow)
        detectSessionInUrl: true,
        // Storage key
        storageKey: "stonevision-auth-token",
      },
      cookieOptions: {
        name: "stonevision-session",
        lifetime: 60 * 60 * 24 * 7, // 7 days
        domain: "",
        path: "/",
        sameSite: "lax",
      },
    }
  );
}
