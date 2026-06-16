import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { runSeed, runEmbed } from "@/lib/seed-data";
import { embed } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60; // seeding + a handful of embeddings finishes well within this

/**
 * One-time setup endpoint, normally called by the friendly /setup page.
 * Seeds the course + demo worker, then computes the RAG embeddings.
 *
 * Security model (designed to need zero secret-juggling for non-technical users):
 *  - If SEED_SECRET is set, the request MUST supply the matching value
 *    (?key=... or x-seed-secret header). Use this to re-run setup later.
 *  - If SEED_SECRET is NOT set, setup is allowed ONLY while the app is not yet
 *    seeded. After the first successful run it locks itself automatically.
 * Either way it's idempotent and can only ever insert demo content.
 */
async function handle(req: Request) {
  let db;
  try {
    db = createAdminClient();
  } catch {
    return NextResponse.json(
      { ok: false, stage: "env", error: "Supabase keys are missing. Add them in your Vercel environment variables, then redeploy." },
      { status: 503 }
    );
  }

  // Is the app already seeded?
  let alreadySeeded = false;
  let schemaMissing = false;
  {
    const { data, error } = await db.from("courses").select("id").eq("slug", "site-safety-essentials").maybeSingle();
    if (error && /relation|does not exist|find the table|schema cache/i.test(error.message)) schemaMissing = true;
    alreadySeeded = !!data;
  }

  if (schemaMissing) {
    return NextResponse.json(
      { ok: false, stage: "schema", error: "The database tables aren't there yet. Open the Supabase SQL Editor, paste the contents of setup.sql, and click Run — then try again." },
      { status: 409 }
    );
  }

  // Auth
  const secret = process.env.SEED_SECRET;
  const url = new URL(req.url);
  const provided = url.searchParams.get("key") || req.headers.get("x-seed-secret");
  if (secret) {
    if (provided !== secret) {
      return NextResponse.json({ ok: false, stage: "auth", error: "Wrong setup password." }, { status: 403 });
    }
  } else if (alreadySeeded) {
    return NextResponse.json(
      { ok: false, stage: "locked", error: "This app is already set up, so first-run setup is locked. To re-run it, set a SEED_SECRET environment variable in Vercel and use it as the password." },
      { status: 423 }
    );
  }

  // Email to log in with: from the page (body/query), else env, else a default.
  let bodyEmail: string | undefined;
  try {
    const body = await req.json();
    if (body && typeof body.email === "string") bodyEmail = body.email.trim();
  } catch {
    /* no JSON body (e.g. GET) — fine */
  }
  const seedEmail = bodyEmail || url.searchParams.get("email") || process.env.SEED_EMAIL || "worker@example.com";

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(seedEmail)) {
    return NextResponse.json({ ok: false, stage: "email", error: "Please enter a valid email address to log in with." }, { status: 400 });
  }

  try {
    const seeded = await runSeed(db, { seedEmail });
    const { embedded } = await runEmbed(db, embed);
    return NextResponse.json({
      ok: true,
      course: seeded.course,
      seedEmail: seeded.seedEmail,
      chunks: seeded.chunks,
      embedded,
      next: `All set. Go to the login page and sign in with ${seeded.seedEmail}.`,
    });
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    const stage = /embed|GEMINI|API key/i.test(msg) ? "embed" : "seed";
    return NextResponse.json({ ok: false, stage, error: msg }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
