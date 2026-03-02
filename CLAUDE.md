# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal portfolio website for a Data Engineer, built as a static React SPA. No backend required — content is managed entirely in JavaScript/markdown.

## Development Commands

All commands run from the `frontend/` directory:

```bash
cd frontend
yarn install      # Install dependencies
yarn start        # Dev server at http://localhost:3000
yarn build        # Production build to frontend/build/
yarn test         # Run tests
```

Package manager: **Yarn 1.22.22** (do not use npm).

## Architecture

**Build tooling:** Create React App wrapped with Craco (`craco.config.js`) for Webpack customization. Tailwind CSS via PostCSS.

**Routing:** React Router v7 (`src/App.js`) — 10 routes, all client-side. `ThemeProvider` wraps the entire app for dark/light mode.

**Content management:** All blog posts and projects live as JavaScript objects with inline markdown in `src/utils/content.js`. This is the single source of truth for content — no CMS, no separate markdown files. New posts/projects go into the `blogPosts` or `projects` arrays.

**UI components:** shadcn/ui components (Radix UI primitives + Tailwind) in `src/components/ui/`. Theme colors use CSS HSL variables defined in `tailwind.config.js`.

**Theme:** Dark mode uses `next-themes` with localStorage persistence. CSS variables swap between light/dark values via Tailwind's `dark:` prefix.

## Key Files

| File | Purpose |
|------|---------|
| `frontend/src/utils/content.js` | All blog posts and projects (edit for content changes) |
| `frontend/src/App.js` | Route definitions |
| `frontend/src/pages/` | Page components (AboutPage, BlogPage, etc.) |
| `frontend/src/components/Header.js` | Navigation + dark mode toggle |
| `frontend/tailwind.config.js` | Color system and theme configuration |
| `frontend/public/index.html` | Meta tags, SEO, PostHog analytics script |

## Deployment

GitHub Actions workflow at `.github/workflows/deploy.yml` auto-deploys to GitHub Pages on push to `main`. Build output is `frontend/build/`.

Custom domain is configured via a `CNAME` file in `frontend/public/`.

## Content Structure

Blog posts and projects in `content.js` follow this shape:

```javascript
{
  slug: 'url-slug',
  title: 'Title',
  date: 'January 1, 2026',
  readTime: '5 min read',
  excerpt: 'Short description',
  tags: ['Tag1', 'Tag2'],
  content: `# Markdown content here`
}
```

The homepage (`HomePage.js`) automatically displays the first 3 blog posts and first 2 projects as featured items.