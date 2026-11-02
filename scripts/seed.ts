import { query, closeDb } from "../db";
import { seedDemo } from "../db/seed";

async function main() {
  const rows = await query<{ count: number }>("SELECT count(*)::int AS count FROM users");
  if (Number(rows[0]?.count ?? 0) > 0) {
    console.log("Seed skipped: users already exist.");
  } else {
    await seedDemo(query);
    console.log("Demo data seeded.");
  }
  await closeDb();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
