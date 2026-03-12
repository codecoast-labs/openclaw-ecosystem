# OpenClaw Ecosystem Atlas

Minimal static site for the OpenClaw ecosystem map.

## What it is

A single-page ecosystem atlas designed to:

- show the category structure at a glance
- group projects by strategic lane instead of using a messy force graph
- provide detailed drill-down analysis with direct links
- stay visually aligned with the Lead It UI language

## Files

- `index.html` — page structure
- `styles.css` — visual system inspired by Lead It
- `app.js` — dataset + rendering logic

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

## Local preview

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deployment

This is a plain static site, so it can be deployed to:

- GitHub Pages
- Vercel
- Netlify
- Cloudflare Pages
- any static host behind a subdomain

## Notes

- Browser automation was unavailable on the host during build, so the UI direction was derived from direct HTML/CSS inspection of `lead-it.ai`.
- GitHub SSH auth is available on this machine.
