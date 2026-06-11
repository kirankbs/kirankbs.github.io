import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitTitle,
  buildCardData,
  renderHtml,
  escapeHtml,
  insertHeroImage,
} from './generate-hero.mjs';

test('splitTitle: two sentences -> head + accent', () => {
  const r = splitTitle("Your Spark Tests Aren't Flaky. They're Starving.");
  assert.equal(r.head, "Your Spark Tests Aren't Flaky.");
  assert.equal(r.accent, "They're Starving.");
});

test('splitTitle: single sentence (no internal period) -> all head', () => {
  const r = splitTitle("Don't Decouple Unity Catalog Table Names from Physical Paths");
  assert.equal(r.head, "Don't Decouple Unity Catalog Table Names from Physical Paths");
  assert.equal(r.accent, '');
});

test('splitTitle: colon title stays single', () => {
  const r = splitTitle("logRetentionDuration vs VACUUM: The Delta Retention Knob");
  assert.equal(r.accent, '');
});

const SAMPLE = {
  title: "Your Spark Tests Aren't Flaky. They're Starving.",
  tags: ['PySpark', 'Testing', 'CI/CD', 'Apache Spark'],
  readTime: '7 min read',
  heroTagline: 'ConnectionRefusedError -> real OOM -> a two-line fix',
};

test('buildCardData: kicker is first 3 tags, uppercased, slash-joined', () => {
  const d = buildCardData(SAMPLE, 'my-slug');
  assert.equal(d.kicker, 'PYSPARK / TESTING / CI/CD');
});

test('buildCardData: title split + uppercased readTime + paths', () => {
  const d = buildCardData(SAMPLE, 'my-slug');
  assert.equal(d.titleHead, "Your Spark Tests Aren't Flaky.");
  assert.equal(d.titleAccent, "They're Starving.");
  assert.equal(d.readTime, '7 MIN READ');
  assert.equal(d.heroImagePath, '/images/my-slug-hero.png');
});

test('buildCardData: tagline null when heroTagline absent', () => {
  const { heroTagline, ...noTagline } = SAMPLE;
  const d = buildCardData(noTagline, 'my-slug');
  assert.equal(d.tagline, null);
});

test('buildCardData: fewer than 3 tags still works', () => {
  const d = buildCardData({ ...SAMPLE, tags: ['LLM'] }, 's');
  assert.equal(d.kicker, 'LLM');
});

test('escapeHtml: escapes angle brackets and ampersand', () => {
  assert.equal(escapeHtml('a & b < c > d'), 'a &amp; b &lt; c &gt; d');
});

test('renderHtml: includes title parts, kicker, footer, fonts', () => {
  const html = renderHtml(buildCardData(SAMPLE, 'my-slug'));
  assert.match(html, /Inter\+Tight/);
  assert.match(html, /PYSPARK \/ TESTING \/ CI\/CD/);
  assert.match(html, /Your Spark Tests Aren't Flaky\./);
  assert.match(html, /class="accent">They're Starving\./);
  assert.match(html, /7 MIN READ/);
  assert.match(html, /kirankbs\.com/);
  assert.match(html, /ConnectionRefusedError/);
});

test('renderHtml: omits tagline element when tagline is null', () => {
  const { heroTagline, ...noTagline } = SAMPLE;
  const html = renderHtml(buildCardData(noTagline, 'my-slug'));
  assert.doesNotMatch(html, /class="snippet"/);
});

test('renderHtml: single-sentence title has no accent span', () => {
  const html = renderHtml(buildCardData({ ...SAMPLE, title: 'One Line Only' }, 's'));
  assert.doesNotMatch(html, /class="accent"/);
});

const RAW = `---\ntitle: "X"\ntags: ["A"]\nreadTime: "5 min read"\n---\n\nBody text.\n`;

test('insertHeroImage: inserts heroImage before closing fence', () => {
  const out = insertHeroImage(RAW, 'my-slug');
  assert.match(out, /heroImage: "\/images\/my-slug-hero\.png"/);
  assert.ok(out.indexOf('heroImage') < out.indexOf('Body text'));
  assert.match(out, /\nBody text\.\n/);
});

test('insertHeroImage: no-op when heroImage already present', () => {
  const withHero = `---\ntitle: "X"\nheroImage: "/images/x.png"\n---\nBody.\n`;
  assert.equal(insertHeroImage(withHero, 'my-slug'), withHero);
});
