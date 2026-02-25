# Oddity Arena — 执行计划

> Phase 1 MVP: Coding Track 上线

---

## Sprint 0: 基础设施（2 天）

- [ ] **目录结构搭建**
  - `coding/challenges/` — 挑战目录
  - `assets/` — 公共资源（CSS/JS/字体）
  - `api/` — Cloudflare Workers 投票（如选此方案）
- [ ] **设计系统确定**
  - 配色、字体、组件风格（水墨 or 科技 or 混合）
  - 响应式断点（桌面并排 iframe / 移动 Tab 切换）
- [ ] **域名 & 部署决策**
  - GitHub Pages or Cloudflare Pages
  - 自定义域名 or `crazynomad.github.io/oddity-arena`
- [ ] **投票方案决策 & 实现**
  - Cloudflare Workers KV（推荐）or GitHub Issues API

## Sprint 1: 首页 + Battle 页面（3 天）

- [ ] **首页** `index.html`
  - 品牌标语 + 三赛道入口（Coding 可点，其他 Coming Soon）
  - 热门挑战卡片（带预览截图）
  - "How it Works" 三步说明
- [ ] **Battle 页面模板** `coding/challenges/:id/battle.html`
  - 双 iframe 并排展示（匿名 Model A / Model B）
  - 投票按钮
  - 揭晓动画 + 投票比例
  - 分享按钮
- [ ] **Gallery 页面模板**（投票后或独立入口）
  - 所有模型作品并排，带名称和得分

## Sprint 2: 迁移旧挑战（2 天）

- [ ] 从 `ai-coding-arena` 迁移 6 个挑战
  1. 网页重构设计 (Easy)
  2. 3D 太阳系沙盒 (Hard)
  3. 愤怒的小鸟 (Medium)
  4. Laravel → Next.js 迁移 (Hard)
  5. 闵希豪森男爵动画 (Medium)
  6. 梯云纵 (Medium)
- [ ] 每个挑战补充 `meta.json`（难度/类型/模型版本/token）
- [ ] 作品在 iframe 中的兼容性测试

## Sprint 3: Leaderboard + 投票闭环（2 天）

- [ ] **投票后端** 上线（CF Workers or GitHub Issues）
- [ ] **Leaderboard 页面** `coding/leaderboard/`
  - ELO 排名 + 胜率 + 投票数
  - 按类型筛选
- [ ] **防刷机制**
  - 设备指纹（localStorage + canvas）
  - 同挑战同设备只投一次
- [ ] **投票数据 → ELO 计算**（前端 JSON 计算即可）

## Sprint 4: 社交传播 + 打磨（2 天）

- [ ] **Open Graph 卡片**（分享到 X/Twitter 时的预览图）
- [ ] **分享文案生成**（"我选了 Model A，你呢？来投票→"）
- [ ] **移动端适配**（Tab 切换模式）
- [ ] **SEO 基础**（title/description/canonical）
- [ ] **About / How it Works 页面**

## Sprint 5: 发布 🚀（1 天）

- [ ] 准备 2 个新挑战（提升首发内容量）
- [ ] 写首发推文 + 准备截图/GIF
- [ ] 发布到 X/Twitter、Hacker News、Reddit r/programming
- [ ] 在 ai-coding-arena README 里添加迁移公告

---

## 总计：~12 天

```
Week 1: Sprint 0 + 1 + 2（基础 + 页面 + 迁移）
Week 2: Sprint 3 + 4 + 5（投票 + 打磨 + 发布）
```

---

## 每日交付物

| 天 | 交付 |
|---|---|
| D1 | 目录结构 + 设计方案确定 + 部署 pipeline |
| D2 | 投票方案实现（API 可调用） |
| D3 | 首页上线（静态，可访问） |
| D4 | Battle 页面模板完成（含投票 + 揭晓） |
| D5 | Gallery 页面 + 移动端适配 |
| D6 | 6 个旧挑战全部迁移完成 |
| D7 | 作品兼容性测试 + meta.json 补全 |
| D8 | Leaderboard 上线 + ELO 计算 |
| D9 | 防刷 + 投票闭环测试 |
| D10 | OG 卡片 + 分享功能 + About 页面 |
| D11 | 2 个新挑战制作 |
| D12 | 发布！🚀 |

---

## Burn 需要做的决策（阻塞项）

> Sprint 0 开始前需要拍板

1. **域名**：GitHub Pages / 自定义域名？
2. **投票存储**：Cloudflare Workers KV / GitHub Issues / 其他？
3. **设计风格**：水墨 / 深色科技 / 混合？
4. **首发模型**：Claude Opus 4.6 / GPT-5.3 / Gemini 3 Pro / GLM-5，都上还是先上部分？
5. **语言**：英文优先？双语？

---

## 可以让 AI 代做的部分

| 任务 | 适合 Agent？ | 备注 |
|---|---|---|
| 首页 HTML/CSS | ✅ Coding Agent | 给设计稿 prompt |
| Battle 页面逻辑 | ✅ Coding Agent | iframe + 投票 + 揭晓 |
| CF Workers API | ✅ Coding Agent | 简单 KV 读写 |
| 迁移旧挑战 | ⚠️ 半手动 | 需要检查每个作品兼容性 |
| Leaderboard | ✅ Coding Agent | JSON 数据 + 排序渲染 |
| OG 卡片生成 | ✅ Coding Agent | HTML → 截图 |
| 新挑战制作 | ❌ Burn 设计 prompt | 核心创意需要人 |
| 推文文案 | ✅ 我来写 | 配合截图/GIF |
