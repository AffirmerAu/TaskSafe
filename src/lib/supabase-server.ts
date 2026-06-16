import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient as createSbClient } from "@supabase/supabase-js";

type CookieToSet = { name: string; value: string; options: CookieOptions };
import { cookies } from "next/headers";

/**
 * Request-scoped server client. Reads the user's session from cookies,
 * so all queries run as the signed-in user and respect RLS.
 */
export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // called from a Server Component — safe to ignore, middleware refreshes the session
          }
        },
      },
    }
  );
}

/**
 * Service-role client. Bypasses RLS — use ONLY in trusted server code
 * (seed/embed scripts, admin tasks). Never import into client bundles.
 */
export function createAdminClient() {
  return createSbClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
