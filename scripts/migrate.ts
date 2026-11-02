export {};

process.env.AUTO_MIGRATE = "true";

async function main() {
  const { getDb, closeDb } = await import("../db");
  await getDb();
  console.log("QIONGZHI schema is up to date.");
  await closeDb();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
