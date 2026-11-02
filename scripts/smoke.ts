export {};

const base = (process.env.SMOKE_BASE_URL || process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

async function check(path: string) {
  const response = await fetch(`${base}${path}`, { headers: { accept: "application/json" } });
  const type = response.headers.get("content-type") || "";
  const body = type.includes("application/json") ? await response.json() : await response.text();
  console.log(`${response.status} ${path}`);
  if (!response.ok) {
    console.error(body);
    throw new Error(`Smoke check failed: ${path}`);
  }
  return body;
}

async function main() {
  await check("/api/health");
  await check("/api/posts?limit=3");
  await check("/api/tasks?limit=3");
  await check("/");
  console.log("smoke ok");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
