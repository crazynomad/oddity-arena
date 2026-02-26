# OpenClaw Track

这个目录存放由 **OpenClaw agent 驱动生成**的挑战作品，与 `coding/` 目录形成对比。

## 为什么要区分 `coding/` 和 `openclaw/`？

| 目录 | 生成方式 | 代表什么 |
|------|---------|---------|
| `coding/` | 直接调用模型 CLI / API（claude, codex, curl）| 模型的原始代码生成能力 |
| `openclaw/` | 由 OpenClaw agent 驱动完成 | AI agent 的实际工作产物 |

核心问题不是"哪个模型写代码更好"，而是：

> **当你把一个任务交给一个 AI agent，它能交出什么？**

## OpenClaw 驱动模式（三种）

### 1. 我直接生成（OpenClaw Agent 原生能力）

OpenClaw agent（就是我，Zeppelin）直接输出 HTML，不借助外部 coding agent。

代表：agent 的直接创作能力，受当前所用模型影响。

### 2. 调度 Coding Agent（codex / pi）

OpenClaw agent 作为编排者，调起 `codex` 或 `pi` 等 coding agent 在沙箱里跑任务：

- 有完整的 agent loop（读文件、迭代修改、自我纠错）
- 有工具调用权限（exec、文件系统）
- 结果由 coding agent 生产，由我验收

代表：agent 调度链路的端到端能力。

### 3. sessions_spawn 子 agent

OpenClaw agent spawn 一个独立 sub-agent session，指定模型和任务，等待结果回传：

- 完全隔离的上下文
- 可并行跑多个模型
- 结果统一汇总

代表：多 agent 协作编排能力。

## 目录结构

```
openclaw/
  challenges/
    <challenge-id>/
      results/
        <model-id>/
          index.html    # 作品（自包含 HTML）
  screenshots/
    <model-id>/
      <challenge-id>.png
```

## 当前状态

| 挑战 | 驱动模式 | 模型 |
|------|---------|------|
| 01-web-redesign | codex exec (mode 2) | claude-opus-4.6, gpt-5.3-codex |
| 02-3d-solar-system | codex exec (mode 2) | claude-opus-4.6, gpt-5.3-codex |
| 03-angry-birds | codex exec (mode 2) | claude-opus-4.6, gpt-5.3-codex |
| 04-pelican-bicycle | codex exec (mode 2) | claude-opus-4.6, gpt-5.3-codex |
| 05-munchausen | codex exec (mode 2) | claude-opus-4.6, gpt-5.3-codex |
| 06-tiyunzong | codex exec (mode 2) | claude-opus-4.6, gpt-5.3-codex |

> ⚠️ 注：`claude-opus-4.6` 的作品实际也是通过 codex exec 调度生成，并非 agent 原生输出。
> 后续 `claude-sonnet-4-6` 结果计划改用正确的驱动方式（mode 2 或 mode 3）重新生成。

## 与 arena.ai 的差异

arena.ai 的 Code 赛道本质是"对话式代码片段投票"。

Oddity Arena 的 OpenClaw Track 展示的是：**一个真实运行的 AI agent 系统，端到端完成一个完整任务的能力。**
