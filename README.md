# kirankbs.github.io

Personal portfolio and blog — live at [kirankbs.com](https://kirankbs.com)

Data Engineer specializing in Apache Spark, Delta Lake, and Databricks on Azure.

## Development

```bash
cd frontend
yarn install
yarn start       # http://localhost:3000
yarn build       # production build
```

## Adding Content

All content lives in `frontend/src/data/`:

- **Blog posts** → `blog.js` — add to the `blogPosts` array
- **Projects** → `projects.js` — add to the `projects` array
- **Certifications** → `certifications.js`
- **Events** → `events.js`
- **Resources** → `resources.js`
- **About (skills/timeline)** → `about.js`

## Deployment

Pushing to `main` triggers GitHub Actions which builds and deploys to GitHub Pages automatically.
