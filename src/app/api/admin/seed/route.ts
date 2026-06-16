import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase-server";
import { runSeed, runEmbed } from "@/lib/seed-data";
import { embed } from "@/lib/gemini";

export const runtime = "nodejs";
export const maxDuration = 60; // seeding + a handful of embeddings finishes well within this

/**
 * One-time setup endpoint for Vercel-only deploys (no local terminal needed).
 * Seeds the course + demo worker, then computes the RAG embeddings.
 *
 * Guarded by SEED_SECRET — the request must supply the matching value via the
 * `key` query param or an `x-seed-secret` header. If SEED_SECRET is not set,
 * the endpoint refuses to run, so it's never open by accident.
 *
 * Trigger once after deploy:  https://your-app.vercel.app/api/admin/seed?key=YOUR_SECRET
 * It's idempotent — safe to hit again; re-running won't duplicate data.
 */
async function handle(req: Request) {
  const secret = process.env.SEED_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "SEED_SECRET is not configured. Set it in your environment, then retry." },
      { status: 503 }
    );
  }

  const url = new URL(req.url);
  const provided = url.searchParams.get("key") || req.headers.get("x-seed-secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const seedEmail = process.env.SEED_EMAIL || "worker@example.com";

  try {
    const db = createAdminClient();
    const seeded = await runSeed(db, { seedEmail });
    const { embedded } = await runEmbed(db, embed);

    return NextResponse.json({
      ok: true,
      course: seeded.course,
      seedEmail: seeded.seedEmail,
      chunks: seeded.chunks,
      embedded,
      next: `Request a magic link at /login using ${seeded.seedEmail}.`,
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

// Allow GET so you can trigger it from a browser, and POST for curl/scripts.
export const GET = handle;
export const POST = handle;
