/**
 * Applies pending drizzle migrations to the Turso database.
 * Idempotent — drizzle tracks applied migrations in __drizzle_migrations.
 * Runs automatically as a prebuild step on Vercel.
 *
 * Skip with SKIP_DB_MIGRATE=1 (e.g. for preview deploys without DB creds).
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { migrate } from "drizzle-orm/libsql/migrator";

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
  console.log("[migrate] applying migrations from ./drizzle …");
  await migrate(db, { migrationsFolder: "./drizzle" });
  console.log("[migrate] done.");
  client.close();
}

main().catch((err) => {
  console.error("[migrate] failed:", err);
  process.exit(1);
});
