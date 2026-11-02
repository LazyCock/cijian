import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import type { PGlite } from "@electric-sql/pglite";

export type QueryFn = <T = Record<string, unknown>>(
  text: string,
  params?: unknown[],
) => Promise<T[]>;

type DbState = {
  pool?: Pool;
  pglite?: PGlite;
  init?: Promise<void>;
};

const globalForDb = globalThis as unknown as { __qiongzhiDb?: DbState };

function state(): DbState {
  if (!globalForDb.__qiongzhiDb) globalForDb.__qiongzhiDb = {};
  return globalForDb.__qiongzhiDb;
}

async function runSchema() {
  const file = path.join(process.cwd(), "db", "schema.sql");
  const schema = fs.readFileSync(file, "utf8");
  const s = state();
  if (s.pool) {
    await s.pool.query(schema);
    return;
  }
  if (!s.pglite) throw new Error("Database has not been initialized");
  await s.pglite.exec(schema);
}

export async function getDb(): Promise<void> {
  const s = state();
  if (s.init) return s.init;
  s.init = (async () => {
    const databaseUrl = process.env.DATABASE_URL?.trim();
    if (databaseUrl) {
      s.pool = new Pool({
        connectionString: databaseUrl,
        max: Number(process.env.PG_POOL_MAX ?? 20),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
        statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT ?? 10_000),
      });
    } else {
      const dataDir = process.env.PGLITE_DIR
        ? path.resolve(process.env.PGLITE_DIR)
        : path.join(process.cwd(), ".data", "pglite");
      fs.mkdirSync(path.dirname(dataDir), { recursive: true });
      const { PGlite: EmbeddedPostgres } = await import("@electric-sql/pglite");
      s.pglite = new EmbeddedPostgres(dataDir);
    }

    // In production, run migrations as a deploy step and set AUTO_MIGRATE=false.
    // The schema is idempotent, so local first-run and single-node installs can
    // initialize themselves without a separate migration container.
    if (!databaseUrl || process.env.AUTO_MIGRATE !== "false") {
      await runSchema();
    }

    if (process.env.SEED_DEMO === "true") {
      const { seedDemo } = await import("./seed");
      if (s.pool) {
        // Serialize first-run seeding across replicas. The advisory lock is
        // held by one connection while the other replicas wait, then see a
        // populated users table and skip.
        const client = await s.pool.connect();
        try {
          await client.query("SELECT pg_advisory_lock(918273645)");
          const result = await client.query("SELECT count(*)::int AS count FROM users");
          if (Number(result.rows[0]?.count ?? 0) === 0) {
            const clientQuery: QueryFn = async <T = Record<string, unknown>>(text: string, params: unknown[] = []) => {
              const response = await client.query(text, params as never[]);
              return response.rows as T[];
            };
            await seedDemo(clientQuery);
          }
        } finally {
          await client.query("SELECT pg_advisory_unlock(918273645)").catch(() => undefined);
          client.release();
        }
      } else {
        const [{ count }] = await rawQuery<{ count: string | number }>(
          "SELECT count(*)::int AS count FROM users",
        );
        if (Number(count) === 0) {
          await seedDemo(rawQuery);
        }
      }
    }
  })();
  return s.init;
}

async function rawQuery<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const s = state();
  if (s.pool) {
    const result = await s.pool.query(text, params as never[]);
    return result.rows as T[];
  }
  if (!s.pglite) throw new Error("Database has not been initialized");
  const result = await s.pglite.query<T>(text, params as never[]);
  return result.rows as T[];
}

export const query: QueryFn = async <T = Record<string, unknown>>(
  text: string,
  params: unknown[] = [],
) => {
  await getDb();
  return rawQuery<T>(text, params);
};

export async function closeDb() {
  const s = state();
  if (s.pool) await s.pool.end();
  if (s.pglite) await s.pglite.close();
  globalForDb.__qiongzhiDb = {};
}
