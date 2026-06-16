/**
 * Compute pgvector embeddings for seeded content chunks, from the command line.
 *
 *   npm run embed     # run after `npm run seed`
 *
 * Safe to re-run: only processes chunks where embedding IS NULL. Requires
 * SUPABASE_SERVICE_ROLE_KEY + GEMINI_API_KEY in .env.local.
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { runEmbed } from "../src/lib/seed-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
if (!process.env.GEMINI_API_KEY) {
  console.error("Set GEMINI_API_KEY in .env.local (needed to compute embeddings)");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

async function main() {
  const { embed } = await import("../src/lib/gemini");
  const { embedded } = await runEmbed(db, embed);
  if (embedded === 0) console.log("Nothing to embed — every chunk already has an embedding. ✓");
  else console.log(`Done. Embedded ${embedded} chunk(s). ✓`);
}

main().catch((e) => {
  console.error("\nEmbed failed:", e);
  process.exit(1);
});
