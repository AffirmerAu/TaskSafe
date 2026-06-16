/**
 * Seed the MVP from the command line.
 *
 *   npm run seed     # uses SEED_EMAIL (or worker@example.com)
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.
 * After seeding, run `npm run embed`. (If you're deploying to Vercel and don't
 * want to use a terminal at all, use the one-time /api/admin/seed endpoint
 * instead — see the README.)
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";
import { runSeed } from "../src/lib/seed-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const seedEmail = process.env.SEED_EMAIL || "worker@example.com";

if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

runSeed(db, { seedEmail })
  .then((r) => {
    console.log(`✓ Seeded course "${r.course}" with ${r.chunks} RAG chunks`);
    console.log(`✓ Demo worker: ${r.seedEmail} (module 1 unlocked)`);
    console.log("→ Now run:  npm run embed");
    console.log(`→ Sign in at /login with ${r.seedEmail} (request a magic link)`);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
