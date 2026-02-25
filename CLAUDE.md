# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Oddity Arena (不现实竞技场) is a platform where AI coding models compete on real-world programming challenges. It evolved from [ai-coding-arena](https://github.com/crazynomad/ai-coding-arena). Currently in planning phase — see DESIGN.md for the three-track architecture (Coding / Skills / Agent).

The repo currently hosts a bilingual translation of Paul Graham's "Taste for Makers" essay as the first published content.

## Architecture

**Pure static site** — no build tools, no package manager, no framework. All pages are self-contained HTML files with inline CSS/JS.

- `taste.html` — bilingual (Chinese + English) edition
- `taste-en.html` — English-only edition
- `taste-cn.html` — Chinese-only edition
- `images/` — ink-wash style JPEG illustrations

## Deployment

GitHub Pages auto-deploys from `main` branch on push (`.github/workflows/deploy.yml`). The entire repo root is published as-is — every HTML file at root is a live page.

## Development

No build or install step. Open HTML files directly in a browser to preview. Since the site is pure static HTML, just edit and commit.

## Conventions

- **Bilingual content**: Chinese is the primary language, English is secondary. The bilingual edition (`taste.html`) shows both side-by-side.
- **Images**: Use JPEG format for web performance (converted from PNG). Store in `images/` directory.
- **Design aesthetic**: Paper-texture backgrounds, serif typography (Noto Serif SC for Chinese, Cormorant Garamond / EB Garamond for English), ink-wash illustration style.
- **Self-contained pages**: Each HTML file includes all its own styles and scripts inline — no shared CSS/JS files.
