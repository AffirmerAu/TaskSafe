import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

if (!process.env.NEON_DATABASE_URL) {
  throw new Error(
    "NEON_DATABASE_URL must be set. Did you forget to provision a Neon database?",
  );
}

export const pool = new Pool({ connectionString: process.env.NEON_DATABASE_URL });
export const db = drizzle({ client: pool, schema });