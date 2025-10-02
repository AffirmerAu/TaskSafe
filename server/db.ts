import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Force use of NEON_DATABASE_URL to ensure we connect to the correct database
const databaseUrl = process.env.NEON_DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "NEON_DATABASE_URL must be set. Please configure your Neon database connection.",
  );
}

// Log which database we're connecting to (for debugging)
console.log("🔗 Connecting to database: Neon PostgreSQL");
const hostname = databaseUrl.match(/@([^/]+)/)?.[1] || "unknown";
console.log(`🔗 Database host: ${hostname}`);

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });

export async function ensureDatabaseSchema(): Promise<void> {
  const client = await pool.connect();

  try {
    const { rows } = await client.query<{ column_name: string }>(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'company_tags' AND column_name = 'logo_url'",
    );

    if (rows.length === 0) {
      console.warn(
        "⚠️ Missing logo_url column on company_tags. Attempting to add it automatically...",
      );
      await client.query("ALTER TABLE company_tags ADD COLUMN logo_url text");
      console.log("✅ Added logo_url column to company_tags table");
    }
  } catch (error) {
    console.error("❌ Failed to ensure database schema:", error);
    throw error;
  } finally {
    client.release();
  }
}
