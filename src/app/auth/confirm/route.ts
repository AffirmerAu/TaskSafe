import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/**
 * Magic-link callback.
 *
 * The session cookie MUST be written onto the redirect Response directly —
 * using createClient() from supabase-server (which writes to next/headers)
 * doesn't work here because those cookies never get attached to a
 * NextResponse.redirect(). We create the response first, then hand it to
 * the Supabase client so it can set its cookies on it before we return it.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type       = searchParams.get("type") as EmailOtpType | null;

  // Build the two possible redirect responses up front.
  const successResponse = NextResponse.redirect(new URL("/welcome", request.url));
  const errorResponse   = NextResponse.redirect(new URL("/?error=link",  request.url));

  if (!token_hash || !type) return errorResponse;

  // Wire Supabase so it writes session cookies directly onto successResponse.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()                  { return request.cookies.getAll(); },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            successResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error, data } = await supabase.auth.verifyOtp({ type, token_hash });
  if (error || !data.user) return errorResponse;

  // Upsert the profile with the name the worker entered at sign-up.
  // Use the admin client so the insert isn't blocked by RLS before the
  // profile row exists.
  const { createAdminClient } = await import("@/lib/supabase-server");
  const admin = createAdminClient();
  const meta  = data.user.user_metadata ?? {};
  await admin.from("profiles").upsert(
    {
      id:         data.user.id,
      first_name: meta.first_name ?? null,
      last_name:  meta.last_name  ?? null,
      full_name:  meta.full_name  ?? meta.first_name ?? data.user.email ?? "Worker",
      language:   "en",
    },
    { onConflict: "id" }
  );

  // Return the redirect WITH the session cookies attached — the browser will
  // store them and the worker will be authenticated on /welcome.
  return successResponse;
}
