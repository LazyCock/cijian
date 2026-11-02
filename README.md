# 穹智 QIONGZHI

穹智是一个可运行的 AI 实践社区与任务协作网站。仓库从单文件视觉 demo 进化为真实的全栈应用：真实的账号体系、持久化数据、服务端渲染、API、缓存、限流和可横向扩展的部署配置。

## 已实现的核心闭环

- 邮箱密码注册 / 登录 / 退出，JWT HttpOnly Cookie
- 社区作品流、作品详情、点赞、收藏、评论
- 任务广场、搜索筛选、游标分页、任务详情
- 发布任务、申请任务、工作台查看接取/发布/收藏
- 个人主页、作品集合、关注 / 取关
- 发布作品，自动进入社区与个人主页
- 明暗双主题，跟随系统并记住用户选择
- 健康检查、输入校验、同源校验、登录/写入限流

演示账号：

```text
demo@qiongzhi.ai
Qiongzhi2026!
```

## 技术栈

- Next.js 16 App Router + React 19 + TypeScript
- PostgreSQL（生产）/ PGlite（本地零依赖开发）
- Redis（生产缓存、限流）/ 进程内 LRU（本地）
- JWT + bcryptjs + Zod
- Nginx + Docker Compose + Kubernetes HPA
- k6 压测脚本

## 目录

```text
app/                页面与 Route Handlers
components/         Header、作品流、互动、表单等客户端组件
lib/                auth、data、cache、rate-limit、validation
db/                 PostgreSQL schema 与 seed
scripts/            migrate、seed、本地 E2E 检查
nginx/              反向代理与限流配置
k8s/                Deployment、Service、Ingress、HPA、PDB
loadtest/           k6 高并发压测脚本
```

## 本地运行

要求 Node 24+、pnpm 11+。

```bash
pnpm install
cp .env.example .env.local
# 本地不填 DATABASE_URL，会使用 .data/pglite，并自动建表与 seed
pnpm dev
```

打开 `http://localhost:3000`。

本地 PGlite 仅用于开发与自动化测试，不适合作为高并发生产数据库。生产环境设置 `DATABASE_URL` 后会自动切换到 PostgreSQL + 连接池。

常用命令：

```bash
pnpm typecheck
pnpm build
pnpm db:migrate
pnpm db:seed
```

## 生产部署

### Docker Compose

```bash
cp .env.example .env
# 必须设置至少 32 字符的 AUTH_SECRET
# 首次演示可设置 SEED_DEMO=true；正式环境请设置 false
docker compose up -d --build --scale app=3
```

Nginx 监听 `HTTP_PORT`（默认 `8080`），反向代理到应用。

生产环境建议在扩容前单独执行一次迁移，并把应用 `AUTO_MIGRATE` 设为 `false`：

```bash
AUTO_MIGRATE=false pnpm db:migrate
```

### Kubernetes

```bash
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/ingress.yaml
kubectl -n qiongzhi rollout status deploy/qiongzhi-web
```

部署前替换镜像地址、域名、`DATABASE_URL`、`REDIS_URL` 与 `AUTH_SECRET`。生产数据库与 Redis 推荐使用托管服务，不要把数据库放进应用 Pod。

## 高并发设计

目标形态：**10,000 并发在线用户 / 1,500 RPS 读多写少工作负载**，应用无状态、可水平扩容。

### 请求链路

```text
CDN / Nginx / Ingress
        ↓
Next.js app replicas (3 → 30, HPA)
        ↓                 ↘
Postgres primary + read replica   Redis
        ↓
async jobs / outbox / notifications
```

### 已落地的关键措施

- **无状态应用**：登录态使用签名 JWT，不依赖单机内存会话；新增副本无需粘性会话。
- **热点缓存**：首页精选 20s、首页任务 15s，Redis 共享缓存；进程内 single-flight 防止缓存击穿。
- **精准失效**：发布、点赞、评论后删除 `home:featured:v1`；发布任务后删除 `home:tasks:v1`。
- **共享限流**：登录、注册、评论、申请、点赞通过 Redis 固定窗口限流；本地回退到进程内限流。
- **游标分页**：作品与任务接口使用 `(created_at, id)` keyset pagination，避免深分页扫描。
- **数据库索引**：feed、featured、作者、任务状态、分类、申请唯一键、未读通知均有索引。
- **原子计数**：点赞使用单条 CTE 完成插入/删除与计数增减；评论计数原子递增。
- **连接池**：生产 `pg.Pool` 限制单 Pod 连接数；扩容到 30 Pod 时配合 PgBouncer，避免连接数击穿 Postgres。
- **分层限流**：Nginx 在入口做 IP 级 `limit_req`，应用做用户级限流。
- **健康检查与滚动发布**：`/api/health` 检查数据库；K8s 配置 readiness/liveness、PDB、优雅终止与 HPA。
- **静态资源**：Next 静态 chunk 可被 CDN / Nginx 长缓存。
- **安全**：bcrypt 12 轮、HttpOnly/SameSite Cookie、同源校验、Zod 校验、参数化 SQL、安全响应头。

### PgBouncer / 连接预算

- Postgres `max_connections=300`（Compose）
- 应用 Pod `PG_POOL_MAX=20`
- HPA 到 30 Pod 时理论连接数 600 > 300，因此生产必须：
  - 将 `PG_POOL_MAX` 降到 5–8；或
  - 在应用与 Postgres 之间部署 PgBouncer transaction pooling；或
  - 使用托管数据库的 connection pooler。

K8s 配置默认 `PG_POOL_MAX=8`（30 副本约 240 连接），Compose 默认 `20`（3 副本约 60 连接）。请按实际副本上限调整。

### 压测

```bash
docker compose up -d --build --scale app=3
k6 run -e BASE_URL=http://127.0.0.1:8080 loadtest/k6.js
```

脚本会爬到 2,000 并发浏览用户，并叠加 2 次/秒已认证写入（对齐单用户点赞限流）。生产验收门槛：

- 失败率 `< 1%`
- SSR p95 `< 500ms`，p99 `< 1200ms`
- Redis 缓存命中率 `> 85%`
- Postgres CPU `< 70% @ 2x 峰值`
- 滚动发布期间无 5xx

### 继续扩容时

- 为读请求增加 `DATABASE_REPLICA_URL` 与读写分离路由
- 将通知/关注 fanout 放入 outbox + 独立 worker
- 引入 Meilisearch/OpenSearch 替代 `ILIKE` 搜索
- 增加 OpenTelemetry + Prometheus/Grafana 与慢查询告警
- 对热点帖子单独做分片缓存与请求合并

## 环境变量

| 变量 | 说明 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL 连接串；为空时使用本地 PGlite |
| `REDIS_URL` | Redis 连接串；为空时使用进程内回退 |
| `AUTH_SECRET` | JWT 签名密钥，生产必须 ≥ 32 字符 |
| `APP_URL` | 公开站点地址，用于同源校验 |
| `AUTO_MIGRATE` | 是否启动时执行 schema；生产建议 `false` |
| `SEED_DEMO` | 是否写入演示数据；生产建议 `false` |
| `PG_POOL_MAX` | 单进程 Postgres 连接池上限 |

## API

- `POST /api/auth/register|login|logout`
- `GET /api/auth/me`
- `GET /api/posts` / `POST /api/posts`
- `POST /api/posts/:id/like|save`
- `GET|POST /api/posts/:id/comments`
- `GET /api/tasks` / `POST /api/tasks`
- `POST /api/tasks/:id/apply`
- `POST /api/users/:handle/follow`
- `PATCH /api/profile`
- `GET /api/health`

## 当前边界

这是可部署的核心产品闭环，不是支付/内容审核的完整商业版本。尚未接入：

- 真实支付、赏金托管与出款（当前为站内状态）
- 邮箱验证、找回密码、OAuth
- 图片/视频对象存储与上传审核
- 管理后台、举报与内容审核
- WebSocket/SSE 实时通知 worker

数据库已预留 `outbox`、`audit_log` 与 `idempotency_keys`，可以在不改主链路的情况下接入这些能力。
