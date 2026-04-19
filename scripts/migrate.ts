/**
 * Applies pending drizzle migrations to the Turso database.
 * Idempotent — drizzle tracks applied migrations in __drizzle_migrations.
 * Runs automatically as a prebuild step on Vercel.
 *
 * Skip with SKIP_DB_MIGRATE=1 (e.g. for preview deploys without DB creds).
 *
 * Recovery mode: if app tables already exist but __drizzle_migrations is empty
 * (e.g. a previous deploy seeded the DB before we wired migrations, or a
 * tracking table was dropped), we backfill tracking rows for all known
 * migrations so migrate() skips them instead of re-running and crashing on
 * "table already exists".
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { sql } from "drizzle-orm";

const MIGRATIONS_FOLDER = "./drizzle";
const TRACKING_TABLE = "__drizzle_migrations";
// A table created by 0000_init. If it exists, the schema was already applied.
const SCHEMA_SENTINEL = "account";

async function backfillIfNeeded(db: ReturnType<typeof drizzle>) {
  const tables = await db.all<{ name: string }>(
    sql`SELECT name FROM sqlite_master WHERE type='table' AND name IN (${SCHEMA_SENTINEL}, ${TRACKING_TABLE})`,
  );
  const names = new Set(tables.map((r) => r.name));
  const schemaApplied = names.has(SCHEMA_SENTINEL);
  const trackingExists = names.has(TRACKING_TABLE);

  if (!schemaApplied) return; // fresh DB — let migrate() do its thing

  // Ensure tracking table exists (matches migrator's own DDL).
  await db.run(sql`
    CREATE TABLE IF NOT EXISTS ${sql.identifier(TRACKING_TABLE)} (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at numeric
    )
  `);

  if (trackingExists) {
    const [row] = await db.all<{ n: number }>(
      sql`SELECT count(*) as n FROM ${sql.identifier(TRACKING_TABLE)}`,
    );
    if ((row?.n ?? 0) > 0) return; // already tracked, migrator will handle incrementally
  }

  const metas = readMigrationFiles({ migrationsFolder: MIGRATIONS_FOLDER });
  if (metas.length === 0) return;

  console.log(`[migrate] schema present but no tracking rows — backfilling ${metas.length} entries`);
  for (const m of metas) {
    await db.run(
      sql`INSERT INTO ${sql.identifier(TRACKING_TABLE)} ("hash", "created_at") VALUES (${m.hash}, ${m.folderMillis})`,
    );
  }
}

async function main() {
  if (process.env.SKIP_DB_MIGRATE === "1") {
    console.log("[migrate] SKIP_DB_MIGRATE=1 — skipping");
    return;
  }
  const url = process.env.TURSO_DATABASE_URL;
  if (!url) {
    console.log("[migrate] TURSO_DATABASE_URL not set — skipping (set SKIP_DB_MIGRATE=1 to silence)");
    return;
  }

  const client = createClient({ url, authToken: process.env.TURSO_AUTH_TOKEN });
  const db = drizzle(client);

  await backfillIfNeeded(db);

  console.log("[migrate] applying migrations from ./drizzle …");
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
  console.log("[migrate] done.");
  client.close();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
