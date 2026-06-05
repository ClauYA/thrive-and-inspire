// ── Database (Supabase / Postgres) ──
// Connects via a single DATABASE_URL connection string (copy it from your
// Supabase project: Settings → Database → Connection string → URI, and use the
// pooled "Transaction" connection on port 6543 for serverless-friendly hosts).
//
// The whole app degrades gracefully when DATABASE_URL is not set: blog routes
// return empty results and form submissions fall back to file + email only.
import pg from "pg";

const { Pool } = pg;

export const dbEnabled = Boolean(process.env.DATABASE_URL);

export const pool = dbEnabled
  ? new Pool({
      connectionString: process.env.DATABASE_URL,
      // Supabase enforces SSL; this accepts their managed certificate.
      ssl: { rejectUnauthorized: false },
      max: 5,
    })
  : null;

// Thin wrapper so callers don't each have to null-check the pool.
export async function query(text, params) {
  if (!pool) throw new Error("Database not configured — set DATABASE_URL.");
  return pool.query(text, params);
}
