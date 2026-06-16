import { NextResponse, type NextRequest } from "next/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase-server";

/**
 * Magic-link callback. Verifies the token, upserts the worker's profile with
 * their name (stored in user_metadata during sign-up), then sends them to /welcome.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = createClient();
    const { error, data } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error && data.user) {
      const user = data.user;
      const meta = user.user_metadata ?? {};
      // Upsert profile with name captured at sign-up time
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          first_name: meta.first_name ?? null,
          last_name: meta.last_name ?? null,
          full_name: meta.full_name ?? meta.first_name ?? user.email ?? "Worker",
          language: "en",
        },
        { onConflict: "id" }
      );
      return NextResponse.redirect(new URL("/welcome", request.url));
    }
  }
  return NextResponse.redirect(new URL("/?error=link", request.url));
}
