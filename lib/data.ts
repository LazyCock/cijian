import { randomUUID } from "node:crypto";
import { query } from "@/db";
import { cached, invalidate } from "./cache";

export type Post = {
  id: string;
  title: string;
  body: string;
  type: "work" | "note" | "question";
  cover: "film" | "brand" | "prompt" | "question";
  tags: string[];
  featured: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string | null;
    bio: string;
  };
  liked?: boolean;
  saved?: boolean;
};

export type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string; handle: string; avatarUrl: string | null };
};

export type Task = {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetCents: number;
  deadline: string;
  status: "open" | "in_progress" | "submitted" | "completed" | "cancelled";
  slots: number;
  tags: string[];
  createdAt: string;
  applicantCount: number;
  publisher: {
    id: string;
    name: string;
    handle: string;
    avatarUrl: string | null;
  };
  applicationStatus?: string | null;
};

export type Profile = {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
  bio: string;
  location: string;
  website: string;
  createdAt: string;
  posts: Post[];
  stats: { posts: number; likes: number; followers: number; following: number };
  following: boolean;
};

const POST_COLUMNS = `
  p.id, p.title, p.body, p.type, p.cover, p.tags, p.featured,
  p.like_count, p.comment_count, p.created_at,
  u.id AS author_id, u.name AS author_name, u.handle AS author_handle,
  u.avatar_url AS author_avatar, u.bio AS author_bio
`;

type PostRow = {
  id: string;
  title: string;
  body: string;
  type: Post["type"];
  cover: Post["cover"];
  tags: string[];
  featured: boolean;
  like_count: number;
  comment_count: number;
  created_at: string | Date;
  author_id: string;
  author_name: string;
  author_handle: string;
  author_avatar: string | null;
  author_bio: string;
};

function mapPost(row: PostRow): Post {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    type: row.type,
    cover: row.cover,
    tags: row.tags ?? [],
    featured: row.featured,
    likeCount: Number(row.like_count),
    commentCount: Number(row.comment_count),
    createdAt: new Date(row.created_at).toISOString(),
    author: {
      id: row.author_id,
      name: row.author_name,
      handle: row.author_handle,
      avatarUrl: row.author_avatar,
      bio: row.author_bio,
    },
  };
}

async function annotateViewer(posts: Post[], viewerId?: string | null): Promise<Post[]> {
  if (!viewerId || !posts.length) return posts.map((post) => ({ ...post, liked: false, saved: false }));
  const ids = posts.map((post) => post.id);
  const [likes, saves] = await Promise.all([
    query<{ post_id: string }>(
      "SELECT post_id FROM post_likes WHERE user_id = $1::uuid AND post_id = ANY($2::uuid[])",
      [viewerId, ids],
    ),
    query<{ post_id: string }>(
      "SELECT post_id FROM post_saves WHERE user_id = $1::uuid AND post_id = ANY($2::uuid[])",
      [viewerId, ids],
    ),
  ]);
  const liked = new Set(likes.map((item) => item.post_id));
  const saved = new Set(saves.map((item) => item.post_id));
  return posts.map((post) => ({ ...post, liked: liked.has(post.id), saved: saved.has(post.id) }));
}

export async function getFeaturedPosts(viewerId?: string | null): Promise<Post[]> {
  const base = await cached("home:featured:v1", 20, async () => {
    const rows = await query<PostRow>(
      `SELECT ${POST_COLUMNS} FROM posts p JOIN users u ON u.id = p.author_id
       WHERE p.featured = true ORDER BY p.created_at DESC LIMIT 4`,
    );
    return rows.map(mapPost);
  });
  return annotateViewer(base, viewerId);
}

export async function getLatestPosts(viewerId?: string | null, limit = 4): Promise<Post[]> {
  const rows = await query<PostRow>(
    `SELECT ${POST_COLUMNS} FROM posts p JOIN users u ON u.id = p.author_id
     WHERE p.featured = false ORDER BY p.created_at DESC LIMIT $1`,
    [limit],
  );
  return annotateViewer(rows.map(mapPost), viewerId);
}

export async function listPosts(options: { viewerId?: string | null; limit?: number; cursor?: string | null; authorId?: string }) {
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 30);
  const params: unknown[] = [];
  let where = "WHERE 1=1";
  if (options.authorId) {
    params.push(options.authorId);
    where += ` AND p.author_id = $${params.length}::uuid`;
  }
  if (options.cursor) {
    const [createdAt, id] = Buffer.from(options.cursor, "base64url").toString().split("|");
    if (createdAt && id) {
      params.push(createdAt, id);
      where += ` AND (p.created_at, p.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`;
    }
  }
  params.push(limit + 1);
  const rows = await query<PostRow>(
    `SELECT ${POST_COLUMNS} FROM posts p JOIN users u ON u.id = p.author_id
     ${where} ORDER BY p.created_at DESC, p.id DESC LIMIT $${params.length}`,
    params,
  );
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit).map(mapPost);
  return {
    items: await annotateViewer(page, options.viewerId),
    nextCursor: hasMore
      ? Buffer.from(`${page[page.length - 1].createdAt}|${page[page.length - 1].id}`).toString("base64url")
      : null,
  };
}

export async function getPost(id: string, viewerId?: string | null): Promise<Post | null> {
  const rows = await query<PostRow>(
    `SELECT ${POST_COLUMNS} FROM posts p JOIN users u ON u.id = p.author_id
     WHERE p.id = $1::uuid LIMIT 1`,
    [id],
  );
  if (!rows[0]) return null;
  const [post] = await annotateViewer([mapPost(rows[0])], viewerId);
  return post;
}

export async function getComments(postId: string, limit = 50): Promise<Comment[]> {
  const rows = await query<{
    id: string; body: string; created_at: string | Date; author_id: string;
    author_name: string; author_handle: string; author_avatar: string | null;
  }>(
    `SELECT c.id, c.body, c.created_at, u.id AS author_id, u.name AS author_name,
            u.handle AS author_handle, u.avatar_url AS author_avatar
     FROM comments c JOIN users u ON u.id = c.author_id
     WHERE c.post_id = $1::uuid ORDER BY c.created_at ASC LIMIT $2`,
    [postId, limit],
  );
  return rows.map((row) => ({
    id: row.id,
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
    author: { id: row.author_id, name: row.author_name, handle: row.author_handle, avatarUrl: row.author_avatar },
  }));
}

export async function searchPosts(search: string, limit = 12): Promise<Post[]> {
  const rows = await query<PostRow>(
    `SELECT ${POST_COLUMNS} FROM posts p JOIN users u ON u.id = p.author_id
     WHERE p.title ILIKE $1 OR p.body ILIKE $1 OR EXISTS (SELECT 1 FROM unnest(p.tags) tag WHERE tag ILIKE $1)
     ORDER BY p.created_at DESC LIMIT $2`,
    [`%${search}%`, limit],
  );
  return rows.map(mapPost);
}

export async function toggleLike(postId: string, userId: string) {
  const rows = await query<{ liked: boolean; like_count: number }>(
    `WITH removed AS (
       DELETE FROM post_likes WHERE post_id = $1::uuid AND user_id = $2::uuid RETURNING 1
     ), added AS (
       INSERT INTO post_likes (post_id, user_id)
       SELECT $1::uuid, $2::uuid WHERE NOT EXISTS (SELECT 1 FROM removed)
       ON CONFLICT DO NOTHING RETURNING 1
     ), updated AS (
       UPDATE posts SET like_count = GREATEST(0, like_count + (SELECT count(*) FROM added) - (SELECT count(*) FROM removed))
       WHERE id = $1::uuid RETURNING like_count
     )
     SELECT EXISTS(SELECT 1 FROM added) AS liked, like_count FROM updated`,
    [postId, userId],
  );
  await invalidate("home:featured:v1");
  return { liked: Boolean(rows[0]?.liked), likeCount: Number(rows[0]?.like_count ?? 0) };
}

export async function toggleSave(postId: string, userId: string) {
  const rows = await query<{ saved: boolean }>(
    `WITH removed AS (
       DELETE FROM post_saves WHERE post_id = $1::uuid AND user_id = $2::uuid RETURNING 1
     ), added AS (
       INSERT INTO post_saves (post_id, user_id)
       SELECT $1::uuid, $2::uuid WHERE NOT EXISTS (SELECT 1 FROM removed)
       ON CONFLICT DO NOTHING RETURNING 1
     )
     SELECT EXISTS(SELECT 1 FROM added) AS saved`,
    [postId, userId],
  );
  return { saved: Boolean(rows[0]?.saved) };
}

export async function addComment(postId: string, userId: string, body: string) {
  const id = randomUUID();
  const rows = await query<{ comment_count: number }>(
    `WITH inserted AS (
       INSERT INTO comments (id,post_id,author_id,body) VALUES ($1,$2,$3,$4) RETURNING id
     ), updated AS (
       UPDATE posts SET comment_count = comment_count + 1 WHERE id = $2::uuid RETURNING comment_count
     )
     SELECT comment_count FROM updated`,
    [id, postId, userId, body],
  );
  const [row] = await query<{
    id: string; body: string; created_at: string | Date; author_id: string;
    author_name: string; author_handle: string; author_avatar: string | null;
  }>(
    `SELECT c.id, c.body, c.created_at, u.id AS author_id, u.name AS author_name,
            u.handle AS author_handle, u.avatar_url AS author_avatar
     FROM comments c JOIN users u ON u.id = c.author_id WHERE c.id = $1::uuid`,
    [id],
  );
  if (!row) throw new Error("Comment insert did not return a row");
  await invalidate("home:featured:v1");
  return {
    comment: {
      id: row.id,
      body: row.body,
      createdAt: new Date(row.created_at).toISOString(),
      author: { id: row.author_id, name: row.author_name, handle: row.author_handle, avatarUrl: row.author_avatar },
    } satisfies Comment,
    commentCount: Number(rows[0]?.comment_count ?? 0),
  };
}

export async function createPost(input: {
  authorId: string; title: string; body: string; type: Post["type"]; cover: Post["cover"]; tags: string[]; featured?: boolean;
}) {
  const id = randomUUID();
  await query(
    `INSERT INTO posts (id,author_id,title,body,type,cover,tags,featured)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, input.authorId, input.title, input.body, input.type, input.cover, input.tags, input.featured ?? false],
  );
  await invalidate("home:featured:v1");
  return getPost(id, input.authorId);
}

const TASK_COLUMNS = `
  t.id, t.title, t.description, t.category, t.budget_cents, t.deadline, t.status,
  t.slots, t.tags, t.created_at,
  u.id AS publisher_id, u.name AS publisher_name, u.handle AS publisher_handle, u.avatar_url AS publisher_avatar,
  (SELECT count(*)::int FROM task_applications a WHERE a.task_id = t.id AND a.status <> 'withdrawn') AS applicant_count
`;

type TaskRow = {
  id: string; title: string; description: string; category: string; budget_cents: number;
  deadline: string | Date; status: Task["status"]; slots: number; tags: string[]; created_at: string | Date;
  publisher_id: string; publisher_name: string; publisher_handle: string; publisher_avatar: string | null;
  applicant_count: number;
};

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    budgetCents: Number(row.budget_cents),
    deadline: new Date(row.deadline).toISOString().slice(0, 10),
    status: row.status,
    slots: Number(row.slots),
    tags: row.tags ?? [],
    createdAt: new Date(row.created_at).toISOString(),
    applicantCount: Number(row.applicant_count ?? 0),
    publisher: {
      id: row.publisher_id,
      name: row.publisher_name,
      handle: row.publisher_handle,
      avatarUrl: row.publisher_avatar,
    },
  };
}

export async function listTasks(options: { category?: string; search?: string; limit?: number; cursor?: string | null; status?: string } = {}) {
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 50);
  const params: unknown[] = [];
  let where = "WHERE t.status = $1";
  params.push(options.status ?? "open");
  if (options.category && options.category !== "全部") {
    params.push(options.category);
    where += ` AND t.category = $${params.length}`;
  }
  if (options.search) {
    params.push(`%${options.search}%`);
    where += ` AND (t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`;
  }
  if (options.cursor) {
    const [createdAt, id] = Buffer.from(options.cursor, "base64url").toString().split("|");
    if (createdAt && id) {
      params.push(createdAt, id);
      where += ` AND (t.created_at, t.id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`;
    }
  }
  params.push(limit + 1);
  const rows = await query<TaskRow>(
    `SELECT ${TASK_COLUMNS} FROM tasks t JOIN users u ON u.id = t.publisher_id
     ${where} ORDER BY t.created_at DESC, t.id DESC LIMIT $${params.length}`,
    params,
  );
  const hasMore = rows.length > limit;
  const page = rows.slice(0, limit).map(mapTask);
  return {
    items: page,
    nextCursor: hasMore ? Buffer.from(`${page[page.length - 1].createdAt}|${page[page.length - 1].id}`).toString("base64url") : null,
  };
}

export async function getTask(id: string): Promise<Task | null> {
  const rows = await query<TaskRow>(
    `SELECT ${TASK_COLUMNS} FROM tasks t JOIN users u ON u.id = t.publisher_id
     WHERE t.id = $1::uuid LIMIT 1`,
    [id],
  );
  return rows[0] ? mapTask(rows[0]) : null;
}

export async function getTaskStats() {
  const rows = await query<{ open: number; budget: number }>(
    `SELECT count(*)::int AS open, coalesce(sum(budget_cents),0)::int AS budget
     FROM tasks WHERE status = 'open'`,
  );
  return { open: Number(rows[0]?.open ?? 0), budget: Number(rows[0]?.budget ?? 0) };
}

export async function getHomeTasks(): Promise<Task[]> {
  return cached("home:tasks:v1", 15, async () => {
    const rows = await query<TaskRow>(
      `SELECT ${TASK_COLUMNS} FROM tasks t JOIN users u ON u.id = t.publisher_id
       WHERE t.status = 'open' ORDER BY t.created_at DESC LIMIT 3`,
    );
    return rows.map(mapTask);
  });
}

export async function createTask(input: {
  publisherId: string; title: string; description: string; category: string;
  budget: number; deadline: string; slots: number; tags: string[];
}) {
  const id = randomUUID();
  await query(
    `INSERT INTO tasks (id,publisher_id,title,description,category,budget_cents,deadline,slots,tags)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [id, input.publisherId, input.title, input.description, input.category, input.budget * 100, input.deadline, input.slots, input.tags],
  );
  await invalidate("home:tasks:v1");
  return getTask(id);
}

export async function applyToTask(taskId: string, userId: string, message: string) {
  const existing = await query<{ id: string; status: string }>(
    "SELECT id,status FROM task_applications WHERE task_id=$1::uuid AND applicant_id=$2::uuid",
    [taskId, userId],
  );
  if (existing[0]) {
    if (existing[0].status === "withdrawn" || existing[0].status === "rejected") {
      await query(
        "UPDATE task_applications SET message=$3,status='pending',created_at=now() WHERE id=$1 AND applicant_id=$2",
        [existing[0].id, userId, message],
      );
      return { id: existing[0].id, status: "pending" };
    }
    return { id: existing[0].id, status: existing[0].status };
  }
  const id = randomUUID();
  await query(
    "INSERT INTO task_applications (id,task_id,applicant_id,message) VALUES ($1,$2,$3,$4)",
    [id, taskId, userId, message],
  );
  return { id, status: "pending" };
}

export async function getApplicationForTask(taskId: string, userId: string) {
  const rows = await query<{ status: string }>(
    "SELECT status FROM task_applications WHERE task_id=$1::uuid AND applicant_id=$2::uuid LIMIT 1",
    [taskId, userId],
  );
  return rows[0]?.status ?? null;
}

export async function getProfile(handle: string, viewerId?: string | null): Promise<Profile | null> {
  const users = await query<{
    id: string; name: string; handle: string; avatar_url: string | null; bio: string;
    location: string; website: string; created_at: string | Date;
  }>(
    `SELECT id,name,handle,avatar_url,bio,location,website,created_at FROM users WHERE handle = $1 LIMIT 1`,
    [handle],
  );
  const user = users[0];
  if (!user) return null;
  const [posts, stats, following] = await Promise.all([
    query<PostRow>(
      `SELECT ${POST_COLUMNS} FROM posts p JOIN users u ON u.id = p.author_id
       WHERE p.author_id = $1::uuid ORDER BY p.created_at DESC LIMIT 12`,
      [user.id],
    ),
    query<{ posts: number; likes: number; followers: number; following: number }>(
      `SELECT
        (SELECT count(*)::int FROM posts WHERE author_id = $1::uuid) AS posts,
        (SELECT coalesce(sum(like_count),0)::int FROM posts WHERE author_id = $1::uuid) AS likes,
        (SELECT count(*)::int FROM follows WHERE following_id = $1::uuid) AS followers,
        (SELECT count(*)::int FROM follows WHERE follower_id = $1::uuid) AS following`,
      [user.id],
    ),
    viewerId
      ? query<{ exists: boolean }>("SELECT EXISTS(SELECT 1 FROM follows WHERE follower_id=$1::uuid AND following_id=$2::uuid) AS exists", [viewerId, user.id])
      : Promise.resolve([{ exists: false }]),
  ]);
  return {
    id: user.id,
    name: user.name,
    handle: user.handle,
    avatarUrl: user.avatar_url,
    bio: user.bio,
    location: user.location,
    website: user.website,
    createdAt: new Date(user.created_at).toISOString(),
    posts: await annotateViewer(posts.map(mapPost), viewerId),
    stats: {
      posts: Number(stats[0]?.posts ?? 0),
      likes: Number(stats[0]?.likes ?? 0),
      followers: Number(stats[0]?.followers ?? 0),
      following: Number(stats[0]?.following ?? 0),
    },
    following: Boolean(following[0]?.exists),
  };
}

export async function getWorkspace(userId: string) {
  const [assigned, published, saved] = await Promise.all([
    query<TaskRow & { application_status: string; application_created_at: string | Date }>(
      `SELECT ${TASK_COLUMNS}, a.status AS application_status, a.created_at AS application_created_at
       FROM task_applications a
       JOIN tasks t ON t.id = a.task_id
       JOIN users u ON u.id = t.publisher_id
       WHERE a.applicant_id = $1::uuid AND a.status = 'accepted'
       ORDER BY t.created_at DESC`,
      [userId],
    ),
    query<TaskRow>(
      `SELECT ${TASK_COLUMNS} FROM tasks t JOIN users u ON u.id = t.publisher_id
       WHERE t.publisher_id = $1::uuid ORDER BY t.created_at DESC`,
      [userId],
    ),
    query<PostRow>(
      `SELECT ${POST_COLUMNS} FROM post_saves s
       JOIN posts p ON p.id = s.post_id JOIN users u ON u.id = p.author_id
       WHERE s.user_id = $1::uuid ORDER BY s.created_at DESC LIMIT 12`,
      [userId],
    ),
  ]);
  return {
    assigned: assigned.map((row) => ({ ...mapTask(row), applicationStatus: row.application_status })),
    published: published.map(mapTask),
    saved: await annotateViewer(saved.map(mapPost), userId),
  };
}

export async function toggleFollow(handle: string, viewerId: string) {
  const target = await query<{ id: string }>("SELECT id FROM users WHERE handle=$1 LIMIT 1", [handle]);
  if (!target[0]) return { ok: false, following: false };
  if (target[0].id === viewerId) return { ok: false, following: false, self: true };
  const rows = await query<{ following: boolean }>(
    `WITH removed AS (
       DELETE FROM follows WHERE follower_id=$1::uuid AND following_id=$2::uuid RETURNING 1
     ), added AS (
       INSERT INTO follows (follower_id, following_id)
       SELECT $1::uuid,$2::uuid WHERE NOT EXISTS (SELECT 1 FROM removed)
       ON CONFLICT DO NOTHING RETURNING 1
     )
     SELECT EXISTS(SELECT 1 FROM added) AS following`,
    [viewerId, target[0].id],
  );
  return { ok: true, following: Boolean(rows[0]?.following) };
}

export async function updateProfile(
  userId: string,
  input: { name: string; bio: string; location: string; website: string },
) {
  await query(
    "UPDATE users SET name=$2,bio=$3,location=$4,website=$5 WHERE id=$1::uuid",
    [userId, input.name, input.bio, input.location, input.website],
  );
}

export async function getNotifications(userId: string) {
  return query<{ id: string; type: string; payload: { title?: string }; read_at: string | null; created_at: string | Date }>(
    "SELECT id,type,payload,read_at,created_at FROM notifications WHERE user_id=$1::uuid ORDER BY created_at DESC LIMIT 20",
    [userId],
  );
}

export async function markNotificationsRead(userId: string) {
  await query("UPDATE notifications SET read_at = now() WHERE user_id=$1::uuid AND read_at IS NULL", [userId]);
}

export async function searchAll(search: string, limit = 8) {
  const [posts, tasks] = await Promise.all([
    searchPosts(search, limit),
    listTasks({ search, limit }).then((result) => result.items),
  ]);
  return { posts, tasks };
}
