# kirankbs.github.io

Personal portfolio and blog — live at [kirankbs.com](https://kirankbs.com)

Data Engineer specializing in Apache Spark, Delta Lake, and Databricks on Azure.

## Development

```bash
cd site
npm install
npm run dev      # http://localhost:4321
npm run build    # production build to site/dist/
```

## Adding Content

### New blog post

Create `site/src/content/blog/your-post-slug.md`:

```markdown
---
title: "Post Title"
date: "March 2, 2026"
readTime: "5 min read"
excerpt: "Short description shown in listings."
tags: ["Apache Spark", "Delta Lake"]
---

Your markdown content here...
```

### New project

Create `site/src/content/projects/your-project-slug.md` with the same frontmatter pattern (replace `readTime` with `githubUrl` if applicable).

### Other content

Static data lives in `site/src/data/`:

| File | Content |
|------|---------|
| `about.js` | Skills and timeline |
| `certifications.js` | Certifications list |
| `events.js` | Upcoming and past events |
| `resources.js` | Curated resources |

## Deployment

Pushing to `main` triggers GitHub Actions which builds and deploys to GitHub Pages automatically.
