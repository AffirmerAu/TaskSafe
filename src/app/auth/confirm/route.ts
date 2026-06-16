import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code       = searchParams.get("code");        // PKCE flow (newer Supabase)
  const token_hash = searchParams.get("token_hash");  // OTP flow  (older Supabase)
  const type       = searchParams.get("type") as EmailOtpType | null;

  const successUrl = new URL("/welcome", request.url);
  const errorUrl   = new URL("/auth/error", request.url);

  const successResponse = NextResponse.redirect(successUrl);

  // Wire Supabase to write session cookies directly onto the redirect response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll()                         { return request.cookies.getAll(); },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            successResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let userId: string | undefined;
  let userMeta: Record<string, string> = {};

  if (code) {
    // ── PKCE flow ────────────────────────────────────────────────
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      errorUrl.searchParams.set("reason", error?.message ?? "code_exchange_failed");
      return NextResponse.redirect(errorUrl);
    }
    userId   = data.user.id;
    userMeta = (data.user.user_metadata ?? {}) as Record<string, string>;

  } else if (token_hash && type) {
    // ── OTP / token_hash flow ────────────────────────────────────
    const { error, data } = await supabase.auth.verifyOtp({ type, token_hash });
    if (error || !data.user) {
      errorUrl.searchParams.set("reason", error?.message ?? "otp_verify_failed");
      return NextResponse.redirect(errorUrl);
    }
    userId   = data.user.id;
    userMeta = (data.user.user_metadata ?? {}) as Record<string, string>;

  } else {
    errorUrl.searchParams.set("reason", "missing_params");
    return NextResponse.redirect(errorUrl);
  }

  // Upsert profile using service-role key so RLS can't block a new user.
  const { createAdminClient } = await import("@/lib/supabase-server");
  const admin = createAdminClient();
  await admin.from("profiles").upsert(
    {
      id:         userId,
      first_name: userMeta.first_name ?? null,
      last_name:  userMeta.last_name  ?? null,
      full_name:  userMeta.full_name  ?? userMeta.first_name ?? null,
      language:   "en",
    },
    { onConflict: "id" }
  );

  return successResponse;
}
