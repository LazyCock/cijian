import http from "k6/http";
import { check, sleep } from "k6";
import { randomIntBetween } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

const BASE = __ENV.BASE_URL || "http://127.0.0.1:8080";
const EMAIL = __ENV.LOAD_EMAIL || "demo@qiongzhi.ai";
const PASSWORD = __ENV.LOAD_PASSWORD || "Qiongzhi2026!";

export const options = {
  scenarios: {
    browse: {
      executor: "ramping-vus",
      exec: "browse",
      startVUs: 10,
      stages: [
        { duration: "1m", target: 500 },
        { duration: "2m", target: 2000 },
        { duration: "5m", target: 2000 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "20s",
    },
    write: {
      executor: "constant-arrival-rate",
      exec: "write",
      rate: 2,
      timeUnit: "1s",
      duration: "8m",
      preAllocatedVUs: 10,
      maxVUs: 80,
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<500", "p(99)<1200"],
    checks: ["rate>0.99"],
  },
  summaryTrendStats: ["avg", "min", "med", "p(90)", "p(95)", "p(99)", "max"],
};

export function setup() {
  const login = http.post(`${BASE}/api/auth/login`, JSON.stringify({ email: EMAIL, password: PASSWORD }), {
    headers: { "Content-Type": "application/json" },
    tags: { name: "login" },
  });
  check(login, { "login 200": (r) => r.status === 200 });
  const posts = http.get(`${BASE}/api/posts?limit=12`, { tags: { name: "setup-posts" } });
  const body = posts.json();
  const ids = (body.items || []).map((post) => post.id);
  const cookies = http.cookieJar().cookiesForURL(BASE);
  return { postIds: ids, session: cookies.qz_session?.[0] || "" };
}

export function browse() {
  const paths = ["/", "/tasks", "/learn", "/community", "/api/health"];
  const path = paths[randomIntBetween(0, paths.length - 1)];
  const res = http.get(`${BASE}${path}`, { tags: { name: path } });
  check(res, { "status 2xx/3xx": (r) => r.status >= 200 && r.status < 400 });
  sleep(randomIntBetween(1, 4));
}

export function write(data) {
  const ids = data.postIds || [];
  if (!ids.length) return;
  const id = ids[randomIntBetween(0, ids.length - 1)];
  const res = http.post(`${BASE}/api/posts/${id}/like`, null, {
    headers: data.session ? { Cookie: `qz_session=${data.session}` } : {},
    tags: { name: "post-like" },
  });
  check(res, { "like accepted": (r) => r.status === 200 || r.status === 401 || r.status === 429 });
  sleep(randomIntBetween(1, 5));
}
