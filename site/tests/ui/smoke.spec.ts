import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('loads with critical elements', async ({ page }) => {
    const response = await page.goto('/');
    expect(response?.status()).toBe(200);

    // Header nav — scope to header element to avoid footer link duplicates
    const header = page.locator('header');
    await expect(header).toBeVisible();
    await expect(header.getByRole('link', { name: 'Blog' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'eBook' })).toBeVisible();

    // Footer
    await expect(page.locator('footer')).toBeVisible();
  });

  test('visual regression', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('homepage.png', { fullPage: true });
  });
});

test.describe('Blog index', () => {
  test('loads with post list', async ({ page }) => {
    const response = await page.goto('/blog');
    expect(response?.status()).toBe(200);

    // At least one blog post link
    await expect(page.locator('a[href*="/blog/"]').first()).toBeVisible();
  });

  test('visual regression', async ({ page }) => {
    await page.goto('/blog');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('blog-index.png', { fullPage: true });
  });
});

test.describe('Blog post', () => {
  const slug = '/blog/llm-hallucinations-databricks-job-id';

  test('loads with article and CTAs', async ({ page }) => {
    const response = await page.goto(slug);
    expect(response?.status()).toBe(200);

    // Article content
    await expect(page.locator('article')).toBeVisible();
    await expect(page.locator('.prose')).toBeVisible();

    // Inline subscribe CTA — text from SubscribeCTA variant="inline"
    const inlineCta = page.locator('text=Enjoyed this?');
    await expect(inlineCta).toBeVisible();

    // Card subscribe CTA — h3 text from SubscribeCTA variant="card"
    const cardCta = page.locator('text=Stay in the loop');
    await expect(cardCta).toBeVisible();

    // Both CTAs link to newsletter
    const ctaLinks = page.locator('a[href="https://newsletter.kirankbs.com/"]');
    expect(await ctaLinks.count()).toBeGreaterThanOrEqual(2);

    // Share button
    await expect(page.locator('#copy-link-btn')).toBeVisible();
  });

  test('visual regression', async ({ page }) => {
    await page.goto(slug);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('blog-post.png', { fullPage: true });
  });
});

test.describe('Ebook index', () => {
  test('loads with progress bar and TOC', async ({ page }) => {
    const response = await page.goto('/ebook');
    expect(response?.status()).toBe(200);

    // Progress bar label
    await expect(page.locator('text=Book Progress')).toBeVisible();

    // At least one published chapter link in the progress bar area
    const progressLink = page.locator('a[href^="/ebook/"]').first();
    await expect(progressLink).toBeVisible();

    // Table of contents has parts — "Part 1" appears in the TOC section
    await expect(page.locator('text=Part 1').first()).toBeVisible();

    // Recently published section
    await expect(page.locator('text=Recently Published')).toBeVisible();
  });

  test('visual regression', async ({ page }) => {
    await page.goto('/ebook');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('ebook-index.png', { fullPage: true });
  });
});

test.describe('Ebook chapter (free)', () => {
  const slug = '/ebook/part-2--delta-lake-in-production/09-merge-at-scale';

  test('loads with content and newsletter CTA', async ({ page }) => {
    const response = await page.goto(slug);
    expect(response?.status()).toBe(200);

    // Chapter content is visible (not "Coming Soon" draft placeholder)
    await expect(page.locator('text=Coming Soon').first()).not.toBeVisible();

    // Article prose exists — free chapters render directly into .prose.prose-ebook
    const prose = page.locator('.prose');
    await expect(prose).toBeVisible();

    // Newsletter CTA for free chapters
    const cta = page.locator('text=Enjoying the book?');
    await expect(cta).toBeVisible();

    // CTA links to newsletter
    const ctaLink = page.locator('a[href="https://newsletter.kirankbs.com/"]');
    expect(await ctaLink.count()).toBeGreaterThanOrEqual(1);

    // Chapter navigation — EbookLayout footer renders section-label spans inside nav links
    // Use .section-label to scope away from prose content that also contains "Previous"/"Next"
    await expect(page.locator('.section-label', { hasText: 'Previous' }).first()).toBeVisible();
    await expect(page.locator('.section-label', { hasText: 'Next' }).first()).toBeVisible();
  });

  test('visual regression', async ({ page }) => {
    await page.goto(slug);
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveScreenshot('ebook-chapter.png', { fullPage: true });
  });
});
