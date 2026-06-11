import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import matter from 'gray-matter';

const IMAGES_DIR = 'public/images';
const BLOG_DIR = 'src/content/blog';
const AI_DIR = 'src/content/ai';
const DEFAULT_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// ---- pure helpers (unit-tested) ----

export function splitTitle(title) {
  const m = title.match(/^(.*?[.?!])\s+(.+)$/);
  if (m) return { head: m[1], accent: m[2] };
  return { head: title, accent: '' };
}

export function buildCardData(data, slug) {
  const tags = Array.isArray(data.tags) ? data.tags : [];
  const { head, accent } = splitTitle(String(data.title || ''));
  return {
    kicker: tags.slice(0, 3).join(' / ').toUpperCase(),
    titleHead: head,
    titleAccent: accent,
    tagline: data.heroTagline ? String(data.heroTagline) : null,
    brandName: 'Kiran Kumar',
    site: 'kirankbs.com',
    readTime: String(data.readTime || '').toUpperCase(),
    heroImagePath: `/images/${slug}-hero.png`,
  };
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function renderHtml(c) {
  const titleHtml = c.titleAccent
    ? `${escapeHtml(c.titleHead)}<br><span class="accent">${escapeHtml(c.titleAccent)}</span>`
    : escapeHtml(c.titleHead);
  const taglineHtml = c.tagline
    ? `<div class="snippet">${escapeHtml(c.tagline)}</div>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@500;600;700;800;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: 1200px; height: 630px; overflow: hidden; font-family: 'Inter Tight', -apple-system, sans-serif; }
    .card { position: relative; width: 1200px; height: 630px; background: #fafaf9; border: 1px solid #e7e5e4; overflow: hidden; padding: 76px 84px; display: flex; flex-direction: column; justify-content: space-between; }
    .rule { width: 64px; height: 4px; background: #d97706; margin-bottom: 28px; }
    .kicker { font-family: 'JetBrains Mono', monospace; font-size: 19px; font-weight: 500; letter-spacing: 0.18em; text-transform: uppercase; color: #78716c; }
    .title { margin-top: 22px; font-weight: 800; font-size: 80px; line-height: 1.04; letter-spacing: -0.02em; color: #1c1917; max-width: 1010px; }
    .title .accent { color: #d97706; }
    .snippet { margin-top: 26px; font-family: 'JetBrains Mono', monospace; font-size: 21px; font-weight: 400; color: #78716c; }
    .footer { display: flex; align-items: center; justify-content: space-between; padding-top: 26px; border-top: 1px solid #e7e5e4; }
    .brand { font-size: 0; }
    .brand-name { color: #1c1917; font-weight: 600; font-size: 22px; font-family: 'Inter Tight', sans-serif; }
    .brand-sep { color: #d6d3d1; font-size: 22px; margin: 0 12px; }
    .brand-site { color: #78716c; font-weight: 500; font-size: 18px; font-family: 'JetBrains Mono', monospace; }
    .read { color: #a8a29e; font-family: 'JetBrains Mono', monospace; font-size: 16px; letter-spacing: 0.05em; }
  </style>
</head>
<body>
  <div class="card">
    <div>
      <div class="rule"></div>
      <div class="kicker">${escapeHtml(c.kicker)}</div>
      <h1 class="title">${titleHtml}</h1>
      ${taglineHtml}
    </div>
    <div class="footer">
      <div class="brand"><span class="brand-name">${escapeHtml(c.brandName)}</span><span class="brand-sep">&mdash;</span><span class="brand-site">${escapeHtml(c.site)}</span></div>
      <div class="read">${escapeHtml(c.readTime)}</div>
    </div>
  </div>
</body>
</html>`;
}

export function insertHeroImage(raw, slug) {
  const m = raw.match(/^(---\r?\n)([\s\S]*?)(\r?\n---\r?\n)/);
  if (!m) return raw; // no frontmatter block; leave untouched
  const block = m[2];
  if (/^heroImage:/m.test(block)) return raw; // already set
  const line = `heroImage: "/images/${slug}-hero.png"`;
  const cut = m.index + m[1].length + m[2].length;
  return raw.slice(0, cut) + `\n${line}` + raw.slice(cut);
}

// ---- IO layer ----

function resolveChrome() {
  const p = process.env.CHROME_PATH || DEFAULT_CHROME;
  if (!existsSync(p)) {
    throw new Error(`Chrome not found at "${p}". Set CHROME_PATH to your Chrome binary.`);
  }
  return p;
}

function findPostFile(slug) {
  for (const dir of [BLOG_DIR, AI_DIR]) {
    const f = join(dir, `${slug}.md`);
    if (existsSync(f)) return f;
  }
  return null;
}

function listAllPosts() {
  const out = [];
  for (const dir of [BLOG_DIR, AI_DIR]) {
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (name.endsWith('.md')) out.push({ slug: name.replace(/\.md$/, ''), file: join(dir, name) });
    }
  }
  return out;
}

function renderToPng(html, outPath, chromePath) {
  return new Promise((resolve, reject) => {
    const dir = mkdtempSync(join(tmpdir(), 'hero-'));
    const htmlPath = join(dir, 'card.html');
    writeFileSync(htmlPath, html, 'utf8');
    const args = [
      '--headless=new', '--disable-gpu', '--hide-scrollbars',
      '--force-device-scale-factor=2', '--window-size=1200,630',
      '--virtual-time-budget=3500',
      `--screenshot=${outPath}`,
      `file://${htmlPath}`,
    ];
    const proc = spawn(chromePath, args, { stdio: 'ignore' });
    proc.on('error', (e) => { rmSync(dir, { recursive: true, force: true }); reject(e); });
    proc.on('exit', (code) => {
      rmSync(dir, { recursive: true, force: true });
      if (existsSync(outPath)) resolve();
      else reject(new Error(`Chrome exited (${code}) without writing ${outPath}`));
    });
  });
}

function setHeroImage(file, slug) {
  const raw = readFileSync(file, 'utf8');
  const next = insertHeroImage(raw, slug);
  if (next !== raw) writeFileSync(file, next, 'utf8');
  return next !== raw;
}

async function generateOne(slug, file, chromePath) {
  const { data } = matter(readFileSync(file, 'utf8'));
  const card = buildCardData(data, slug);
  const outPath = join(IMAGES_DIR, `${slug}-hero.png`);
  await renderToPng(renderHtml(card), outPath, chromePath);
  const wrote = setHeroImage(file, slug);
  console.log(`  ✓ ${slug} -> ${outPath}${wrote ? ' (heroImage set)' : ''}`);
}

async function main(argv) {
  if (argv.length === 0) {
    console.error('Usage: npm run hero <slug>   |   npm run hero --all');
    return 1;
  }
  let chromePath;
  try { chromePath = resolveChrome(); }
  catch (e) { console.error(e.message); return 1; }

  let targets;
  if (argv.includes('--all')) {
    targets = listAllPosts().filter(({ file }) => {
      const { data } = matter(readFileSync(file, 'utf8'));
      return !data.heroImage;
    });
    if (targets.length === 0) { console.log('All posts already have a heroImage. Nothing to do.'); return 0; }
    console.log(`Generating heroes for ${targets.length} post(s) missing one:`);
  } else {
    const slug = argv[0];
    const file = findPostFile(slug);
    if (!file) { console.error(`No post found for slug "${slug}" in ${BLOG_DIR} or ${AI_DIR}.`); return 1; }
    targets = [{ slug, file }];
    console.log(`Generating hero for ${slug}:`);
  }

  let failed = 0;
  for (const { slug, file } of targets) {
    try { await generateOne(slug, file, chromePath); }
    catch (e) { failed++; console.error(`  ✗ ${slug}: ${e.message}`); }
  }
  console.log(`Done. ${targets.length - failed} generated, ${failed} failed.`);
  return failed > 0 ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).then((code) => process.exit(code));
}
