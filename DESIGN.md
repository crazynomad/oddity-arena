# Oddity Arena - Design Document

> 这个文档是活的，我们在这里讨论和迭代设计。

---

## Core Concept: 三赛道竞技

Oddity Arena 不是单一维度的评测，而是从三个层面考察 AI 模型的真实能力：

```
┌─────────────────────────────────────────────────────────┐
│                    ODDITY ARENA                         │
│                    不 现 实 竞 技 场                      │
├───────────────┬───────────────┬─────────────────────────┤
│  🎨 CODING    │  🛠️ SKILLS    │  🤖 AGENT               │
│  写代码的能力   │  用工具的能力   │  做事情的能力             │
├───────────────┼───────────────┼─────────────────────────┤
│ 给一个 prompt  │ 给相同的 Skill │ 给一个目标               │
│ 生成完整代码    │ 不同模型执行    │ 自主规划 + 执行           │
│               │               │                         │
│ 评：代码质量    │ 评：指令理解    │ 评：自主决策              │
│ 评：创意表现    │ 评：工具调用    │ 评：错误恢复              │
│ 评：视觉效果    │ 评：任务完成度   │ 评：多步编排              │
├───────────────┼───────────────┼─────────────────────────┤
│ 来源:          │ 来源:          │ 来源:                    │
│ ai-coding-    │ skills/ repo  │ OpenClaw                │
│ arena         │ (8 个技能)     │ (live model testing)    │
└───────────────┴───────────────┴─────────────────────────┘
```

### Track 1: Coding — "写"

> 一个 prompt，一次生成，看谁写得好

- 继承自 [ai-coding-arena](https://github.com/crazynomad/ai-coding-arena)
- 挑战类型：前端重构、3D 模拟、游戏开发、动画叙事
- 所有模型拿到相同的 PROMPT.md，独立生成代码
- 结果直接部署为静态页面，肉眼可对比
- **核心指标**：代码质量、创意、视觉效果、可运行性

已有挑战（可迁移）：
1. 网页重构设计 (Easy)
2. 3D 太阳系沙盒 (Hard)
3. 愤怒的小鸟 (Medium)
4. Laravel → Next.js 迁移 (Hard)
5. 闵希豪森男爵动画 (Medium)
6. 梯云纵 (Medium)

### Track 2: Skills — "用"

> 相同的技能定义，不同的模型，谁用得好

- 基于 [skills/](https://github.com/crazynomad/skills) 仓库的 Claude Code Skills
- 给不同模型加载相同的 SKILL.md
- 通过 Claude Code 切换模型（`--model`）执行相同任务
- 观察：能否正确理解指令、调用正确的工具、处理边界情况

可用技能：
- **媒体类**: youtube-downloader, podcast-downloader, pdf-to-images, srt-title-generator
- **文件类**: disk-cleaner, file-organizer, doc-mindmap, file-master（编排技能）

评测维度：
- **指令理解**：是否正确解析 SKILL.md 中的步骤
- **工具调用**：命令参数是否正确，是否遗漏步骤
- **错误处理**：依赖缺失、文件不存在时的应对
- **编排能力**：file-master 这类多技能串联任务

### Track 3: Agent — "做"

> 给一个目标，看谁能自己搞定

- 基于 [OpenClaw](https://github.com/openclaw/openclaw) 的 agent 能力
- 真实的多步骤任务：不是写一段代码，而是完成一件事
- 涉及：规划、工具使用、错误恢复、上下文管理
- OpenClaw 已有 live model testing 基础设施（multi-provider, auth profiles）

可能的 Agent 挑战：
- 调试一个有 bug 的项目并修复
- 从零搭建一个小应用（需要多个文件、配置、测试）
- 基于现有代码库完成 feature request
- 多轮对话中保持上下文一致性

评测维度：
- **自主性**：能否独立完成，还是需要人工干预
- **决策质量**：选择的方案是否合理
- **错误恢复**：遇到问题能否自行解决
- **效率**：token 消耗、步骤数、完成时间

---

## 从 ai-coding-arena 继承的好东西

已验证的模式：
- **真实挑战** > 学术 benchmark
- **纯前端**，无构建工具，GitHub Pages 直接部署
- **结构清晰**：每个挑战独立目录，prompt + results 分离
- **可复现**：完整 prompt 公开

---

## 需要设计的部分

### 1. 品牌 & 体验
- [ ] "不现实" 品牌调性（与 Oddity Store 呼应）
- [ ] 首页设计：三赛道入口 + 最新对决
- [ ] 对比页面：同一挑战，多模型结果并排展示
- [ ] 可能的排行榜 / 战绩系统

### 2. 评测流程
- [ ] Coding Track：手动跑 prompt → 收集结果 → 部署展示
- [ ] Skills Track：Claude Code `--model` 切换 → 录制过程 → 对比结果
- [ ] Agent Track：设计标准化 agent 任务 → 多模型执行 → 量化评分
- [ ] 统一的元数据格式（模型版本、token 消耗、耗时、成功/失败）

### 3. 目录结构（草案）
```
oddity-arena/
├── coding/                    # Track 1: Coding 赛道
│   ├── challenges/
│   │   ├── 01-web-redesign/
│   │   │   ├── PROMPT.md
│   │   │   └── results/
│   │   │       ├── claude-opus-4.6/
│   │   │       ├── gpt-5/
│   │   │       └── gemini-3/
│   │   └── ...
│   └── index.html             # Coding 赛道首页
│
├── skills/                    # Track 2: Skills 赛道
│   ├── challenges/
│   │   ├── youtube-download/
│   │   │   ├── TASK.md        # 具体任务描述
│   │   │   ├── SKILL.md       # 技能定义（所有模型相同）
│   │   │   └── results/
│   │   │       ├── claude-opus-4.6/
│   │   │       │   ├── log.md    # 执行过程记录
│   │   │       │   └── output/   # 输出结果
│   │   │       └── ...
│   │   └── ...
│   └── index.html
│
├── agent/                     # Track 3: Agent 赛道
│   ├── challenges/
│   │   ├── 01-debug-fix/
│   │   │   ├── MISSION.md     # 任务目标
│   │   │   ├── starter/       # 初始代码/环境
│   │   │   └── results/
│   │   │       ├── claude-opus-4.6/
│   │   │       │   ├── transcript.md  # 完整执行记录
│   │   │       │   ├── diff.patch     # 代码变更
│   │   │       │   └── meta.json      # 元数据
│   │   │       └── ...
│   │   └── ...
│   └── index.html
│
├── index.html                 # 竞技场首页（三赛道入口）
├── DESIGN.md                  # 本文档
└── README.md
```

### 4. 技术选择
- [ ] 继续纯静态 GitHub Pages？（Coding Track 天然适合）
- [ ] Skills/Agent Track 的结果如何展示？（日志、diff、截图）
- [ ] 是否需要简单后端（投票系统）？
- [ ] 前端框架：保持原生 HTML/JS vs 轻量框架

---

## Open Questions

1. **定位**：纯技术评测 vs 娱乐化竞技 vs YouTube 频道内容素材？
2. **受众**：开发者社区 vs 普通观众 vs 两者兼顾？
3. **互动**：观众投票/评分？还是只展示？
4. **节奏**：定期发布新挑战（周更？月更？）？
5. **与 Oddity Store 的关系**：品牌联动？共享设计语言？
6. **模型范围**：初期先对比哪些模型？（Claude / GPT / Gemini / GLM？）
7. **自动化程度**：评测流程能自动化到什么程度？

---

## Ideas Parking Lot

> 随时往这里扔想法

- Skills Track 可以录屏 Claude Code 的执行过程，剪成对比视频
- Agent Track 的 transcript 可以做成可视化时间线
- 每个挑战配一个 "裁判 prompt"，让另一个 AI 打分（AI judges AI）
- 观众可以提交自己的挑战（community challenges）
- 与 OpenClaw 的 live test 基础设施复用
