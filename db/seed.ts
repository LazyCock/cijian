import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import type { QueryFn } from "./index";

const now = Date.now();
const iso = (minutesAgo: number) => new Date(now - minutesAgo * 60_000).toISOString();
const uuid = () => randomUUID();

export async function seedDemo(query: QueryFn) {
  const password = await bcrypt.hash("Qiongzhi2026!", 12);
  const users = [
    {
      id: uuid(), email: "demo@qiongzhi.ai", name: "林深", handle: "linshen",
      avatar: "av-6", bio: "把 AI 放进真实工作流的人。关注 Agent、内容系统与一切能减少重复劳动的小工具。",
      location: "上海 · 徐汇", website: "linshen.works",
    },
    {
      id: uuid(), email: "ache@qiongzhi.ai", name: "阿澈", handle: "ache",
      avatar: "av-2", bio: "AI 短片导演，山海之间工作室主理人。相信镜头语言也可以被写成一套可复用的方法。",
      location: "杭州", website: "ache.film",
    },
    {
      id: uuid(), email: "xiaoman@qiongzhi.ai", name: "林小满", handle: "linxiaoman",
      avatar: "av-1", bio: "品牌设计师。把品味翻译成 AI 能理解的语言。",
      location: "上海", website: "xiaoman.design",
    },
    {
      id: uuid(), email: "luming@qiongzhi.ai", name: "鹿鸣", handle: "luming",
      avatar: "av-3", bio: "Agent 开发者，开源 contributor。结构化输出与工作流自动化。",
      location: "深圳", website: "luming.dev",
    },
    {
      id: uuid(), email: "peach@qiongzhi.ai", name: "一颗桃", handle: "peach",
      avatar: "av-5", bio: "视觉创作者，正在学习如何让角色在不同镜头里保持同一个人。",
      location: "成都", website: "",
    },
  ];
  for (const user of users) {
    await query(
      `INSERT INTO users (id,email,password_hash,name,handle,avatar_url,bio,location,website,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [user.id, user.email, password, user.name, user.handle, user.avatar, user.bio, user.location, user.website, iso(60 * 24 * 120)],
    );
  }
  const [demo, ache, xiaoman, luming, peach] = users;

  await query(
    `INSERT INTO follows (follower_id,following_id) VALUES ($1,$2),($1,$3),($1,$4),($5,$1),($3,$1)`,
    [demo.id, ache.id, xiaoman.id, luming.id, peach.id],
  );

  const posts = [
    {
      id: uuid(), author: ache.id, title: "AI 短片《山海之间》：从一张分镜到成片，我如何控制住每一次转场",
      body: "真正的难点从来不是“生成一个好看的镜头”，而是让 18 个镜头共享同一种呼吸。这个项目我把角色、光线、镜头运动都写进了同一套视觉语法里，成片只有 84 秒，但每一秒都在回答同一个问题。",
      type: "work", cover: "film", tags: ["AI 短片", "分镜设计", "Runway"], featured: true, likes: 512, comments: 83, at: iso(300),
    },
    {
      id: uuid(), author: xiaoman.id, title: "我把品牌提案流程拆成了 7 个 Prompt，交付周期从 5 天压到 6 小时",
      body: "不是让 AI 替我设计，而是让它接管“找参考—拆风格—出草图—写提案”里最耗时的信息整理。这次给「山止茶事」做的品牌提案，客户以为是熬了三个通宵，其实最关键的一步，是先把品味翻译成 AI 能理解的语言。",
      type: "work", cover: "brand", tags: ["提示词工程", "品牌视觉", "工作流"], featured: true, likes: 328, comments: 46, at: iso(120),
    },
    {
      id: uuid(), author: luming.id, title: "让模型稳定输出 JSON 的 4 段式 Prompt，我把它做成了一个可复用模板",
      body: "“请输出 JSON”大概率会失败。我的做法是把任务拆成角色、边界、结构、校验四段，并显式提供失败时的修正策略。过去两周在 3 个项目里跑了 2,400 次调用，结构性错误的概率从 17% 降到了 0.8%。",
      type: "note", cover: "prompt", tags: ["提示词工程", "Agent 工作流", "结构化输出"], featured: true, likes: 896, comments: 124, at: iso(60 * 26),
    },
    {
      id: uuid(), author: peach.id, title: "求助：如何让 ComfyUI 的角色在不同镜头里保持一致？",
      body: "在做一组 6 个镜头的角色短片，角色脸型和服装细节总是到第三个镜头就开始漂移。目前试过 IP-Adapter 和 ControlNet OpenPose，但两张脸还是会“各长各的”。想请教一下大家在长序列里是怎么锁定角色一致性的？",
      type: "question", cover: "question", tags: ["ComfyUI", "角色一致性", "求助"], featured: true, likes: 74, comments: 12, at: iso(180),
    },
    {
      id: uuid(), author: demo.id, title: "山止茶事 · 品牌提案：把东方茶的空间感做成一套视觉语法",
      body: "从品牌命名、字体系统到包装与社媒模板，一套用 AI 协作完成的东方茶品牌系统。",
      type: "work", cover: "brand", tags: ["品牌视觉", "提案"], featured: false, likes: 328, comments: 46, at: iso(60 * 24 * 3),
    },
    {
      id: uuid(), author: demo.id, title: "山海之间 · 18 个镜头的视觉语法拆解",
      body: "记录一次 AI 短片项目里的镜头规划、光线连续性与转场设计。",
      type: "work", cover: "film", tags: ["AI 短片", "导演笔记"], featured: false, likes: 512, comments: 83, at: iso(60 * 24 * 7),
    },
    {
      id: uuid(), author: demo.id, title: "JSON Pilot · 一个可复用的结构化输出模板",
      body: "把角色、边界、结构、校验四段固定下来，让模型输出可以直接进入下一道工序。",
      type: "work", cover: "prompt", tags: ["提示词工程", "模板"], featured: false, likes: 896, comments: 124, at: iso(60 * 24 * 11),
    },
  ];
  for (const post of posts) {
    await query(
      `INSERT INTO posts (id,author_id,title,body,type,cover,tags,featured,like_count,comment_count,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [post.id, post.author, post.title, post.body, post.type, post.cover, post.tags, post.featured, post.likes, post.comments, post.at],
    );
  }

  const comments: Array<[string, string, string, number, number]> = [
    [posts[0].id, xiaoman.id, "第三镜从水面切到山脊的那个转场太漂亮了。想知道这一段的 prompt 有没有刻意保留低对比度？", 26, 220],
    [posts[0].id, luming.id, "84 秒 18 个镜头，这个镜头密度控制得很克制。比起炫技，更难的是知道什么时候不切。", 19, 160],
    [posts[0].id, ache.id, "声音设计也帮了大忙。中间那段留白如果没做，整个短片会显得很满。", 31, 100],
    [posts[1].id, demo.id, "最值得借鉴的是“先固化判断标准，再生成”。很多人把 AI 当成抽卡，其实它更像一个需要被校准的协作者。", 38, 90],
    [posts[2].id, demo.id, "把失败样本也放进校验，这个细节很关键。我们线上也遇到过字段漂移。", 12, 70],
    [posts[3].id, ache.id, "把角色参考图做成一张“角色圣经”：正侧背三视图 + 固定 seed + 每个镜头只更换背景与动作描述；再用 ControlNet 的 reference-only 锁脸。", 38, 40],
  ];
  for (const [postId, authorId, body, likes, minutes] of comments) {
    await query(
      `INSERT INTO comments (id,post_id,author_id,body,created_at) VALUES ($1,$2,$3,$4,$5)`,
      [uuid(), postId, authorId, body, iso(minutes)],
    );
  }

  const tasks = [
    { publisher: ache.id, title: "为护肤品牌制作 15 秒 AI 概念广告片", category: "视频生成", budget: 3800_00, days: 4, status: "in_progress", slots: 1, tags: ["Runway", "分镜", "品牌短片"], desc: "为新品「晨露精华」制作 15 秒概念广告，风格参考东方极简，需包含产品特写与晨雾氛围镜头。", applicant: demo.id, appStatus: "accepted" },
    { publisher: xiaoman.id, title: "搭建一个品牌社媒内容自动分发 Agent", category: "Agent 开发", budget: 5200_00, days: 6, status: "open", slots: 1, tags: ["Code", "API", "自动化"], desc: "从选题池到多平台文案生成、配图建议与排期，打造内容团队每周重复 12 小时的工作流。", applicant: null, appStatus: null },
    { publisher: demo.id, title: "把 12 首独立音乐做成 AI 视觉封面合集", category: "视频生成", budget: 2400_00, days: 5, status: "in_progress", slots: 1, tags: ["Midjourney", "封面", "系列"], desc: "为独立音乐厂牌完成 12 首单曲的视觉封面，需要统一的色彩语言和可延展的版式系统。", applicant: demo.id, appStatus: "accepted" },
    { publisher: luming.id, title: "基于品牌语料微调一个文案风格模型", category: "模型微调", budget: 2600_00, days: 2, status: "open", slots: 1, tags: ["LoRA", "文案风格", "推理部署"], desc: "用 300 条历史高转化文案，训练一个能稳定模仿品牌语气的小型风格模型。", applicant: null, appStatus: null },
    { publisher: peach.id, title: "为独立咖啡品牌设计 6 张春季上新海报", category: "视觉设计", budget: 1800_00, days: 3, status: "open", slots: 1, tags: ["Midjourney", "版式", "品牌"], desc: "围绕「山野入杯」概念，做一组可贯穿门店、社媒与外卖平台的春季视觉海报。", applicant: null, appStatus: null },
    { publisher: xiaoman.id, title: "招募长期 AI 科技专栏作者（3 篇试稿）", category: "内容创作", budget: 1200_00, days: 1, status: "submitted", slots: 1, tags: ["科技写作", "AI 产品", "长期合作"], desc: "寻找能持续输出 AI 产品观察的作者，先以 3 篇试稿开始，长期按篇结算。", applicant: demo.id, appStatus: "accepted" },
    { publisher: demo.id, title: "把 200 条用户访谈整理成可检索洞察库", category: "数据服务", budget: 900_00, days: 5, status: "submitted", slots: 1, tags: ["访谈", "标签体系", "知识库"], desc: "将 200 条访谈记录做清洗、主题编码与结构化归档，交付可检索的洞察库。", applicant: null, appStatus: null },
    { publisher: ache.id, title: "为一支 AI 短片制作声音设计与配乐", category: "视频生成", budget: 1600_00, days: 4, status: "open", slots: 1, tags: ["声音设计", "配乐", "短片"], desc: "为 90 秒的东方科幻短片完成环境声、拟音与原创配乐，需要有留白感的处理。", applicant: null, appStatus: null },
  ];
  for (const task of tasks) {
    const id = uuid();
    const deadline = new Date(now + task.days * 86_400_000).toISOString().slice(0, 10);
    await query(
      `INSERT INTO tasks (id,publisher_id,title,description,category,budget_cents,deadline,status,slots,tags,created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [id, task.publisher, task.title, task.desc, task.category, task.budget, deadline, task.status, task.slots, task.tags, iso(Math.random() * 600 + 20)],
    );
    if (task.applicant) {
      await query(
        `INSERT INTO task_applications (id,task_id,applicant_id,message,status,created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [uuid(), id, task.applicant, "已看过需求说明，可以按这个方向先出第一版。", task.appStatus, iso(300)],
      );
    }
    if (task.publisher === demo.id) {
      await query(
        `INSERT INTO task_applications (id,task_id,applicant_id,message,status,created_at)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [uuid(), id, xiaoman.id, "我对这个方向很感兴趣，可以先聊一下具体交付标准。", "pending", iso(170)],
      );
    }
  }

  await query(
    `INSERT INTO notifications (id,user_id,type,payload,created_at) VALUES
     ($1,$2,'task_invite','{"title":"山止文化向你发出了合作邀请：15 秒 AI 概念广告片"}',$5),
     ($3,$2,'post_like','{"title":"鹿鸣和另外 12 人赞了你的动态《我的第一个 Agent 工作流》"}',$5),
     ($4,$2,'task_accepted','{"title":"你提交的任务成果已通过验收，¥1,800 已进入余额"}',$5)`,
    [uuid(), demo.id, uuid(), uuid(), iso(12)],
  );

  await query(
    `INSERT INTO post_saves (post_id,user_id) VALUES ($1,$2),($3,$2)`,
    [posts[1].id, demo.id, posts[2].id],
  );
}
