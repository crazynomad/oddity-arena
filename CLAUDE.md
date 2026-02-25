# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this repository.

## Project Overview

**Oddity Arena (不现实竞技场)** — AI model blind A/B competition platform. Users see two anonymous outputs side-by-side, vote for the better one, then models are revealed with ELO ratings.

- **Live**: https://arena.boing.work (also https://oddity-arena.pages.dev)
- **Repo**: https://github.com/crazynomad/oddity-arena
- **Part of**: [Oddity (不现实)](https://github.com/crazynomad) universe

## Architecture

**Pure static site** — no framework, no build tools, no package manager. HTML + CSS + vanilla JS only.

### Frontend
```
index.html                    # Homepage — hero, tracks, challenge grid
templates/battle.html         # Master battle template (copy to each challenge)
assets/
  style.css                   # FBI Classified Dossier design system
  arcade.css                  # Arcade/gamification styles (VS splash, combos, particles)
  arcade.js                   # Arcade engine (shake, KO, confetti, health bars, etc.)
  i18n.js                     # Bilingual i18n system (zh/en, default Chinese)
coding/challenges/
  {id}/
    meta.json                 # Challenge metadata (id, title, models[], difficulty)
    prompt.md                 # The prompt given to each model
    battle.html               # Copy of templates/battle.html
    results/{model}/index.html  # Each model's output (self-contained HTML)
```

### Backend (Cloudflare)
```
wrangler.toml                 # Cloudflare Pages config with D1 binding
schema.sql                    # D1 schema (votes + elo_ratings tables)
functions/
  api/vote.js                 # POST /api/vote — ELO calculation, fingerprint dedup
  api/leaderboard/[challenge].js  # GET /api/leaderboard/:challenge
```

- **D1 Database**: `oddity-arena-db` (ID: `e15b802d-8e35-4a3b-be2b-b4d913e04fe4`)
- **ELO**: K-factor 32, starting rating 1200
- **Dedup**: SHA-256(IP + User-Agent) fingerprint, one vote per pair per fingerprint
- **Turnstile**: Ready but not yet enabled

## Design System

**Theme: FBI Classified Dossier** (matches [oddity-store](https://github.com/crazynomad/oddity-store))

| Token | Value | Usage |
|-------|-------|-------|
| `--paper` | `#F5F0E1` | Background |
| `--ink` | `#1A1A1A` | Text, borders |
| `--brand-yellow` | `#FFE500` | CTAs, highlights |
| `--stamp-red` | `#C41E3A` | Accent, stamps |
| `--paper-dark` | `#E8E3D4` | Surface/cards |

**Fonts**: Special Elite (typewriter), Black Ops One (headings), Courier Prime (mono), Noto Serif SC / Noto Sans SC (Chinese)

**Visual effects**: Paper noise texture overlay, vignette, card hover with 4px box-shadow

## i18n

- Default language: **Chinese (zh)**
- Toggle stored in `localStorage('oddity-lang')`
- Translation keys in `assets/i18n.js` as `{ key: { zh, en } }` object
- HTML elements use `data-i18n="key"` attribute
- JS uses `i18n.t('key', { var: value })` with `{var}` interpolation
- **Important**: Call `i18n.apply()` after dynamically showing/creating DOM elements

## Arcade Mode

Gamification layer inspired by Street Fighter:

- **VS Splash**: Full-screen VS animation when new pair loads
- **Screen Shake**: On vote submission
- **KO/VOTED/BOOM**: Random slam text overlay
- **Combo Counter**: Tracks consecutive votes (3x/5x/7x/10x milestones with titles)
- **Confetti**: Triggers every 3-combo milestone
- **Winner Crown**: 👑 on the voted side
- **Health Bars**: Visual vote comparison
- **Auto-advance**: 8-second countdown to next challenge after voting
- **Progress Dots**: Shows current position in challenge sequence

All in `assets/arcade.js` — call `arcade.onVote()`, `arcade.showVS()`, etc.

## Challenges

Current challenge sequence (arcade mode order):
1. `03-angry-birds` — Angry Birds clone (game)
2. `06-tiyunzong` — 梯云纵 wuxia animation (creative)
3. `05-munchausen` — Baron Munchausen visualization (creative)
4. `01-web-redesign` — Web page redesign (frontend)
5. `04-pelican-bicycle` — Pelican riding bicycle SVG (the legendary AI benchmark)
6. `02-3d-solar-system` — 3D solar system (3D/WebGL)

## Competing Models

| Model | API / Tool | Notes |
|-------|-----------|-------|
| Claude Opus 4.6 | `claude --model claude-opus-4-6 --print` | Very slow (~10min), buffer output |
| Claude Sonnet 4 | `claude --model claude-sonnet-4-6 --print` | Slow, strip preamble before `<!DOCTYPE` |
| Claude Sonnet 4.6 | `claude --model claude-sonnet-4-6 --print` | Same as above |
| GPT-5.3 Codex | `codex exec --config model="gpt-5.3-codex" --config sandbox_mode="workspace-write"` | Must `cd` into output dir first |
| Gemini 3.1 Pro | `gemini --model gemini-3.1-pro-preview` | Capacity-limited, frequent 429s |
| GLM-5 | OpenAI-compat API at `open.bigmodel.cn` | Reliable |
| Kimi K2.5 | OpenAI-compat API at `api.moonshot.cn` | Reliable |
| Qwen 3.5-Plus | OpenAI-compat API at `dashscope.aliyuncs.com` | Key prefix `sk-` |
| MiniMax M2.5 | OpenAI-compat API at `api.minimaxi.com` | Anthropic-compat |

## Deployment

```bash
# Deploy to Cloudflare Pages
wrangler pages deploy . --project-name oddity-arena --commit-dirty=true

# Custom domain: arena.boing.work (CNAME → oddity-arena.pages.dev)
# DNS managed in Cloudflare dashboard (wrangler OAuth lacks zone:write)
```

## Development Workflow

```bash
# Generate results for a new model (API example)
curl -s "https://open.bigmodel.cn/api/paas/v4/chat/completions" \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"glm-5","messages":[{"role":"user","content":"..."}],"max_tokens":16000}' \
  | jq -r '.choices[0].message.content' > results/glm-5/index.html

# After adding results, update meta.json models array
# Then copy battle template to all challenges
for ch in coding/challenges/*/; do cp templates/battle.html "$ch/battle.html"; done

# Commit, push, deploy
git add -A && git commit -m "..." && git push
wrangler pages deploy . --project-name oddity-arena --commit-dirty=true
```

## Versioning

`X.Y.Z` — Z ranges 0-9, then Y increments. Current: **v0.1.0**

## Lessons Learned

1. **No frameworks**: Pure HTML/CSS/JS keeps deployment trivial and Pages-compatible
2. **Relative paths**: All asset references must be relative for Cloudflare Pages
3. **i18n.apply() timing**: Must re-call after dynamically showing elements — biggest gotcha
4. **Battle template duplication**: `templates/battle.html` is the source of truth; copy to all challenges after edits
5. **Claude --print is slow**: 10+ minutes per challenge; use `nohup` for batch generation
6. **Gemini 429s**: Capacity-limited; retry with backoff or skip and come back later
7. **Codex needs workspace-write**: `sandbox_mode="workspace-write"` + explicit `cd` into target dir
8. **Strip preamble**: Claude often outputs text before `<!DOCTYPE`; always `sed -n '/<!DOCTYPE/,$p'`
9. **Serial API calls**: Parallel requests trigger rate limits on GLM-5 and others
10. **D1 binding**: Must set via Cloudflare API `PATCH` on pages project, not wrangler CLI
11. **Fingerprint dedup**: SHA-256(IP+UA) is good enough for casual anti-fraud; Turnstile for serious protection
12. **Arcade effects**: Screen shake + particles + combo = surprisingly engaging for a static site
13. **Auto-advance countdown**: Always provide a cancel mechanism (clicking other buttons cancels timer)
