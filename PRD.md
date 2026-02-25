# Oddity Arena — Product Requirements Document

> 不现实竞技场：世界上第一个"可玩的" AI 模型竞技场

**Version:** 1.0 Draft
**Date:** 2026-02-25
**Author:** Burn + Zeppelin

---

## 1. Vision

> 别人让你读两段文字选一个。我们让你玩两个游戏选一个。

Oddity Arena 是全球首个**体验式** AI 模型竞技平台。用户不是对比文字输出，而是直接体验 AI 生成的完整应用——玩游戏、操作 3D 模拟器、浏览网页——然后投票选出更好的那个。

**一句话定位：** Arena.ai 是统计学评测，Oddity Arena 是实战展示赛。

---

## 2. Problem Statement

### 现有方案的问题

| 平台 | 方式 | 问题 |
|---|---|---|
| Arena.ai (LMArena) | 盲测投票（读文字选一个） | 只评"对话能力"，不评"造东西的能力" |
| SWE-bench | 自动化代码评测 | 只评"修 bug"，不评创意和产品力 |
| HumanEval | 代码片段正确率 | 脱离真实场景，不可体验 |
| LiveCodeBench | 竞赛题解 | 算法能力 ≠ 工程能力 |

**核心空白：** 没有人在系统性地评测 AI 模型"造完整产品"的能力，也没有人让普通用户直接体验 AI 的作品来投票。

### 我们的机会

1. **可见性**——AI 生成的作品直接部署可玩，截图即传播
2. **低门槛**——不需要懂技术也能参与投票，受众面远大于开发者社区
3. **蓝海赛道**——Skills（用工具的能力）和 Agent（自主做事的能力）目前零竞争
4. **内容即营销**——每个挑战天然是一篇推文/视频素材

---

## 3. Target Users

### P0: 开发者 & AI 从业者
- 想知道"哪个模型写代码最强"
- 会深度体验作品，关注代码质量、性能、创意
- 传播渠道：X/Twitter、Hacker News、Reddit、开发者社区

### P1: AI 爱好者 & 科技媒体
- 对 AI 能力边界好奇
- 被"来玩两个 AI 做的愤怒的小鸟"这种标题吸引
- 传播渠道：X/Twitter、YouTube、微信公众号

### P2: 模型厂商
- 想在 Oddity Arena 上展示自家模型实力
- 可能赞助特定挑战或提交模型参赛
- 长期商业化可能

---

## 4. Product Architecture

### 4.1 三赛道竞技

```
┌─────────────────────────────────────────────────────────────┐
│                      ODDITY ARENA                           │
│                      不 现 实 竞 技 场                        │
├───────────────┬───────────────────┬─────────────────────────┤
│  🎨 CODING    │  🛠️ SKILLS         │  🤖 AGENT               │
│  写代码的能力   │  用工具的能力       │  做事情的能力             │
│               │                   │                         │
│  体验 + 投票   │  过程回放 + 评分    │  任务记录 + 评分          │
│  (Phase 1)    │  (Phase 2)        │  (Phase 3)              │
└───────────────┴───────────────────┴─────────────────────────┘
```

### 4.2 核心体验循环（Coding Track）

```
用户进入挑战页
     │
     ▼
看到两个匿名作品（Model A / Model B）
     │
     ▼
直接体验/玩两个版本（iframe 并排 or 切换）
     │
     ▼
投票选出更好的那个
     │
     ▼
揭晓模型身份 + 显示社区投票比例
     │
     ▼
分享结果 → 社交传播 → 新用户进入
```

---

## 5. Feature Specification

### Phase 1: Coding Track（MVP）

> 目标：让人看到 AI 模型的代码能力差异，并产生投票和传播的欲望

#### F1.1 首页
- **三赛道入口**（Coding 可点，Skills/Agent 显示 "Coming Soon"）
- **最新 / 热门挑战** 展示（卡片形式，带预览截图）
- **总体 Leaderboard** 概览
- **品牌标语 + 简要说明**

#### F1.2 挑战列表页
- 按难度 / 类型筛选（Easy/Medium/Hard, 前端/游戏/3D/动画）
- 每个挑战卡片：标题、难度标签、参赛模型数、投票数、预览图
- 排序：最新 / 最热 / 随机

#### F1.3 挑战详情页（Battle 页）—— **核心页面**
- **Battle Mode（默认）：**
  - 随机分配两个模型作品到 A/B 位（匿名）
  - 并排 iframe 展示两个作品（桌面端），或 Tab 切换（移动端）
  - 每个作品下方有"选这个"投票按钮
  - 投票后：
    - 揭晓模型身份（动画效果）
    - 显示社区投票比例（饼图/进度条）
    - "换一对" 按钮（从其他模型组合中随机）
    - 分享按钮（生成带结果的分享卡片）
  
- **Gallery Mode（投票后解锁 or 独立入口）：**
  - 所有参赛模型的作品并排展示
  - 每个作品带模型名称、投票得分
  - 可展开查看完整 Prompt

- **信息区：**
  - 挑战描述 + 完整 PROMPT.md
  - 参赛模型列表 + 版本信息
  - 评测元数据（token 消耗、生成时间）

#### F1.4 Leaderboard
- **总榜**：所有挑战的综合 ELO / 胜率排名
- **分类榜**：按挑战类型（游戏/3D/网页/动画）
- 每个模型可点击查看详细战绩
- 胜率、投票数、参赛挑战数

#### F1.5 投票系统
- **匿名投票**：不需要登录（降低门槛）
- **防刷**：
  - 设备指纹（localStorage + canvas fingerprint）
  - 同一挑战同一设备只能投一次
  - 可选：GitHub OAuth 登录获得"认证投票"权重更高
- **存储方案（轻量优先）**：
  - **方案 A（推荐）：** Cloudflare Workers KV — 免费额度足够起步，全球 CDN
  - **方案 B：** GitHub Issues API — 每个挑战一个 Issue，投票作为 reaction
  - **方案 C：** Supabase / Firebase — 如果需要更复杂的查询

#### F1.6 社交分享
- 投票结果生成 Open Graph 卡片（带截图 + 投票比例）
- 一键分享到 X/Twitter
- "我选了 Model A，你呢？" 的传播语

### Phase 2: Skills Track

> 目标：展示 AI 模型"用工具做事"的能力差异

#### F2.1 技能挑战
- 每个挑战基于一个 SKILL.md（来自 skills 仓库）
- 给不同模型加载相同技能定义，执行相同任务
- 结果展示：执行过程录屏 / 终端回放 + 输出文件对比

#### F2.2 评测维度
- 指令理解准确度
- 工具调用正确性
- 错误处理能力
- 任务完成度
- Token 效率

#### F2.3 展示形式
- **终端回放**：asciinema 风格的执行过程回放
- **Diff 对比**：输出文件的差异对比
- **评分卡**：多维雷达图
- 用户可以对各维度打分

### Phase 3: Agent Track

> 目标：展示 AI 模型"自主完成复杂任务"的能力

#### F3.1 任务设计
- 多步骤、需要规划、涉及错误恢复的真实任务
- 例：调试修复一个有 bug 的项目、从零搭建一个小应用
- 基于 OpenClaw 的 agent 基础设施执行

#### F3.2 展示形式
- **时间线视图**：Agent 的决策过程可视化
- **代码 Diff**：最终代码变更
- **成本对比**：Token 消耗、步骤数、总耗时
- **人工干预次数**：越少越好

---

## 6. Information Architecture

```
oddity-arena.com (or GitHub Pages)
│
├── /                          # 首页（三赛道入口 + 热门挑战）
├── /coding/                   # Coding Track 列表
│   ├── /coding/:challenge/    # 挑战详情（Battle + Gallery）
│   └── /coding/leaderboard/   # Coding 排行榜
├── /skills/                   # Skills Track（Phase 2）
├── /agent/                    # Agent Track（Phase 3）
├── /leaderboard/              # 总排行榜
└── /about/                    # 关于 + How it Works
```

---

## 7. Design Principles

### 7.1 品牌调性："不现实"

- **名字含义**：Oddity = 奇异、不寻常。"不现实竞技场"——这些 AI 做的事情，放在几年前不现实
- **视觉风格**：水墨 + 赛博朋克。东方底蕴 + 未来感（延续 ai-coding-arena 的水墨风）
- **语气**：不严肃、不学术。有点玩世不恭，但底子扎实
- **核心感受**：来这里不是做研究，是来看热闹 + 投票 + 分享的

### 7.2 设计原则

1. **Show, Don't Tell** — 让用户直接体验，不要用文字解释"这个模型更好"
2. **One Click to Fun** — 进入页面就能开始体验，不要注册/登录墙
3. **Share-First** — 每个交互点都考虑"用户会想截图/分享吗？"
4. **Static-First** — 能用静态页面解决的不引入后端
5. **Mobile-Friendly** — 投票和分享主要发生在手机上

---

## 8. Technical Architecture

### 8.1 整体方案：Static-First

```
┌─────────────────────────────────────────────┐
│              GitHub Pages / Cloudflare Pages │
│                                             │
│  HTML + CSS + JS（纯静态）                    │
│  ├── 首页 / 列表页 / 排行榜                   │
│  ├── 挑战页（Battle iframe 容器）             │
│  └── 各模型作品（独立 HTML，iframe 加载）       │
│                                             │
│  投票数据 → Cloudflare Workers KV            │
│  （或 GitHub Issues API）                     │
└─────────────────────────────────────────────┘
```

### 8.2 挑战作品格式

每个模型的作品是**自包含的单个 HTML 文件**（延续 ai-coding-arena 的成功模式）：

```
coding/challenges/angry-birds/
├── PROMPT.md                    # 完整 prompt（公开）
├── meta.json                    # 挑战元数据
│   {
│     "id": "angry-birds",
│     "title": "Angry Birds Clone",
│     "difficulty": "medium",
│     "category": "game",
│     "created": "2026-01-15",
│     "models": ["claude-opus-4.6", "gpt-5.3", "gemini-3-pro", "glm-5"]
│   }
├── results/
│   ├── claude-opus-4.6/
│   │   ├── index.html           # 自包含作品（可直接浏览器打开）
│   │   └── meta.json            # { tokens: 12500, time: "45s", attempts: 1 }
│   ├── gpt-5.3/
│   │   ├── index.html
│   │   └── meta.json
│   └── ...
└── battle.html                  # Battle 页面（加载两个随机作品的 iframe）
```

### 8.3 投票 API

**Cloudflare Workers（推荐方案）：**

```
POST /api/vote
{
  "challenge": "angry-birds",
  "winner": "a",          // "a" or "b"（匿名位置，不是模型名）
  "models": ["claude-opus-4.6", "gpt-5.3"],  // 揭晓后记录
  "fingerprint": "abc123"  // 设备指纹
}

GET /api/results/:challenge
→ { "claude-opus-4.6": 156, "gpt-5.3": 203, "gemini-3-pro": 89, ... }

GET /api/leaderboard
→ [{ model: "claude-opus-4.6", elo: 1847, wins: 342, losses: 156 }, ...]
```

**最小化方案（纯前端，零后端）：**

用 GitHub Issues 存储投票：每个挑战一个 Issue，用 Reactions（👍/❤️/🎉/🚀）代表不同模型的票数。前端直接调 GitHub API 读取。

### 8.4 Battle 配对算法

```
1. 从挑战的所有模型中随机抽两个
2. 随机分配到 A/B 位
3. 优先展示投票数少的配对（让所有配对都有足够票数）
4. 同一用户看过的配对不重复展示
```

### 8.5 ELO 评分

采用标准 ELO 算法（与 Arena.ai 兼容）：

```
新 ELO = 旧 ELO + K × (实际结果 - 预期结果)
K = 32（初期，模型少时用较大 K 加快收敛）
初始 ELO = 1500
```

每次投票 = 一次对局。ELO 可以在前端计算（基于所有投票数据的 JSON）。

---

## 9. Content Strategy

### 9.1 挑战设计原则

1. **视觉冲击力**——结果要"看得出差异"（游戏 > 算法题）
2. **可传播性**——标题要让人想点（"让 5 个 AI 写愤怒的小鸟"）
3. **难度梯度**——Easy/Medium/Hard 混合，覆盖不同技能
4. **话题性**——蹭热点、有争议、有惊喜（"没想到 XXX 模型竟然..."）

### 9.2 首批挑战（从 ai-coding-arena 迁移 + 新增）

| # | 挑战 | 难度 | 类型 | 传播力 |
|---|---|---|---|---|
| 1 | 愤怒的小鸟 | Medium | 游戏 | ⭐⭐⭐⭐⭐ |
| 2 | 3D 太阳系沙盒 | Hard | 3D | ⭐⭐⭐⭐ |
| 3 | 梯云纵（武侠动画） | Medium | 动画 | ⭐⭐⭐⭐ |
| 4 | 网页重构设计 | Easy | 前端 | ⭐⭐⭐ |
| 5 | 闵希豪森男爵动画 | Medium | 动画 | ⭐⭐⭐ |
| 6 | Laravel→Next.js 迁移 | Hard | 工程 | ⭐⭐ |
| 7 | **[新] 2048 游戏** | Easy | 游戏 | ⭐⭐⭐⭐ |
| 8 | **[新] 粒子物理模拟器** | Hard | 3D | ⭐⭐⭐⭐ |
| 9 | **[新] Markdown 编辑器** | Medium | 工具 | ⭐⭐⭐ |
| 10 | **[新] 音乐可视化器** | Medium | 创意 | ⭐⭐⭐⭐⭐ |

### 9.3 发布节奏

- **启动期**：一次性发布 6 个迁移挑战 + 2 个新挑战
- **稳定期**：每 2 周发布 1 个新挑战
- **每个挑战配套**：
  - 1 条 X/Twitter 推文（带对比截图/GIF）
  - 1 个 YouTube Shorts（30 秒对比视频）
  - 投票链接

---

## 10. Metrics & Success Criteria

### MVP（Phase 1 上线后 1 个月）

| 指标 | 目标 |
|---|---|
| 总投票数 | 1,000+ |
| 独立访客 | 5,000+ |
| 社交分享次数 | 500+ |
| X/Twitter 相关推文 | 50+ |
| GitHub Stars | 200+ |

### Growth（上线后 3 个月）

| 指标 | 目标 |
|---|---|
| 总投票数 | 10,000+ |
| 月活跃访客 | 20,000+ |
| 挑战数 | 15+ |
| 社区提交的挑战 | 5+ |
| 媒体报道 | 3+ |

---

## 11. Risks & Mitigations

| 风险 | 影响 | 缓解方案 |
|---|---|---|
| 投票刷票 | 排名失真 | 设备指纹 + 可选 GitHub OAuth + 异常检测 |
| 模型更新导致结果过时 | 内容陈旧 | 标注模型版本，定期用新版本重跑经典挑战 |
| 作品运行卡顿/崩溃 | 用户体验差 | iframe 沙箱 + 错误边界 + "报告问题"按钮 |
| 法律/版权问题 | 挑战涉及已有 IP（如愤怒的小鸟） | 标注"AI 生成的致敬/学习作品"，非商业用途 |
| 冷启动无人投票 | 排名无意义 | 先在 X/Twitter 社区推广，邀请 KOL 体验 |

---

## 12. Roadmap

```
2026 Q1（现在）
├── ✅ DESIGN.md 完成
├── ✅ PRD 完成
├── 🔲 首页 + Battle 页面原型
├── 🔲 迁移 6 个 ai-coding-arena 挑战
├── 🔲 投票系统（Cloudflare Workers or GitHub Issues）
└── 🔲 Phase 1 MVP 上线

2026 Q2
├── 🔲 新增 4+ 挑战
├── 🔲 Leaderboard + ELO 评分
├── 🔲 社交分享卡片
├── 🔲 Skills Track 设计 + 首批技能挑战
└── 🔲 内容营销启动（X/Twitter + YouTube Shorts）

2026 Q3
├── 🔲 Skills Track 上线
├── 🔲 Agent Track 设计
├── 🔲 社区提交挑战功能
├── 🔲 模型厂商合作探索
└── 🔲 国际化（中英双语）

2026 Q4
├── 🔲 Agent Track 上线
├── 🔲 API 开放（让其他人嵌入 Battle 页面）
├── 🔲 年度 AI 模型排名报告
└── 🔲 商业化探索
```

---

## 13. Open Decisions

> 需要 Burn 拍板的问题

1. **域名**：用 GitHub Pages（`crazynomad.github.io/oddity-arena`）还是买域名（`oddity-arena.com`）？
2. **投票方案**：Cloudflare Workers KV（需要 CF 账号）vs GitHub Issues（零成本但限制多）vs 其他？
3. **首页风格**：继续水墨风 vs 更现代的深色科技风 vs 混合？
4. **Phase 1 模型范围**：Claude Opus 4.6 / GPT-5.3 / Gemini 3 Pro / GLM-5，还要加别的吗？
5. **内容语言**：纯英文 / 纯中文 / 双语？
6. **是否开放社区提交挑战**：Phase 1 就开放还是先自己控制质量？

---

## Appendix A: Competitive Analysis

| | Arena.ai | SWE-bench | Oddity Arena |
|---|---|---|---|
| 评测方式 | 盲测投票（读文字） | 自动化代码测试 | 盲测投票（玩作品） |
| 评测维度 | 单一偏好 | Pass/Fail | 多维（创意/质量/可玩性） |
| 内容类型 | 对话片段 | Bug 修复 | 完整应用/游戏 |
| 受众 | 开发者 | 研究者 | 开发者 + 普通用户 |
| 参与门槛 | 低（打字即可） | 高（需要跑测试） | 极低（玩就行） |
| 传播性 | 中（文字截图） | 低（数据表格） | 极高（游戏/动画截图/视频） |
| 独特赛道 | 无 | 无 | Skills + Agent |
| 规模 | 170K+ 投票 | 2K+ 评测 | 从零开始 |

## Appendix B: Naming

- **Oddity Arena** — 正式名
- **不现实竞技场** — 中文名
- **OA** — 内部简称
- **Tagline (EN):** "AI models enter. You experience. You decide."
- **Tagline (CN):** "AI 进场，你来体验，你来裁判。"
