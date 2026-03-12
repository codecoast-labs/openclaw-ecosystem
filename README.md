# OpenClaw Ecosystem Atlas

Minimal static site for the OpenClaw ecosystem map.

## Architecture

This site is now **data-driven**.

### Canonical source of truth

The canonical research dataset lives in the Luna workspace at:

- `research/openclaw-ecosystem/ecosystem.json`

That file is the structured source for:

- lanes
- projects
- tiers
- differentiators
- strategic thesis
- day-level changes
- links and deployment notes

### Published site bundle

The hosted site does **not** depend on Luna's filesystem at runtime.
Instead, the workspace exports a deployable JSON bundle into:

- `openclaw-ecosystem-site/data/summary.json`
- `openclaw-ecosystem-site/data/lanes.json`
- `openclaw-ecosystem-site/data/projects.json`
- `openclaw-ecosystem-site/data/today.json`
- `openclaw-ecosystem-site/data/ecosystem.json`

The frontend loads those files via `fetch()`.

## Export flow

Generate the site data bundle from the canonical dataset:

```bash
node /home/jp/.openclaw-client-b/workspace/scripts/export-openclaw-ecosystem-site-data.mjs
```

Publish the site repo after export:

```bash
/home/jp/.openclaw-client-b/workspace/scripts/publish-openclaw-ecosystem-site.sh
```

## What it is

A single-page ecosystem atlas designed to:

- show the category structure at a glance
- group projects by strategic lane instead of using a messy force graph
- provide detailed drill-down analysis with direct links
- stay visually aligned with the Lead It UI language

## Design choices

### Why an atlas instead of a graph

A force-directed graph looks flashy but gets unreadable fast.
This atlas uses strategic lanes instead:

- Core reference
- Lightweight / low-resource
- Security-first
- Multi-agent / orchestration
- Adjacent benchmarks
- Long-tail derivatives

That makes it much easier to scan and compare.

## Local development

Install dependencies:

```bash
npm install
```

Run the Vite dev server:

```bash
npm run dev
```

Default local URL:

```text
http://localhost:4173
```

## Production build

```bash
npm run build
npm run preview
```

## Docker

Build the image:

```bash
docker build -t openclaw-ecosystem-atlas .
```

Run it:

```bash
docker run --rm -p 8080:8080 openclaw-ecosystem-atlas
```

Then open:

```text
http://localhost:8080
```

Or use Docker Compose:

```bash
docker compose up --build
```

## Deployment

This site can now be deployed as:

- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages
- a plain Docker container on any VPS
- any static host behind a subdomain

## Notes

- Browser automation was unavailable on the host during build, so the UI direction was derived from direct HTML/CSS inspection of `lead-it.ai`.
- GitHub SSH auth is available on this machine.
