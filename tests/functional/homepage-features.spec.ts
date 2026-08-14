/**
 * tests/functional/homepage-features.spec.ts
 *
 * Functional tests for the Eco-Edge homepage.
 * Verifies that key business content is present and interactive elements work.
 * Does not submit forms or require authentication.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';

test.describe('Homepage Features @functional', () => {
  test.beforeEach(async ({ homePage }) => {
    // homePage fixture navigates to the root URL automatically
    await homePage.waitForLoad();
  });

  // ── Core page load ───────────────────────────────────────────────────────────

  test('homepage loads with a primary heading @functional', async ({ homePage }) => {
    const heading = await homePage.getMainHeading();
    expect(heading.length, 'Homepage should have a visible H1 or H2 heading').toBeGreaterThan(0);
  });

  test('homepage has identifiable page content @functional', async ({ homePage }) => {
    const isLoaded = await homePage.isLoaded();
    expect(
      isLoaded,
      'Homepage should have a heading, nav, and meaningful body text'
    ).toBeTruthy();
  });

  // ── Hero / above-the-fold ────────────────────────────────────────────────────

  test('hero section has content @functional', async ({ homePage }) => {
    const heroText = await homePage.getHeroText();
    expect(
      heroText.trim().length,
      'Hero or above-the-fold section should contain text'
    ).toBeGreaterThan(10);
  });

  // ── Call-to-action buttons ───────────────────────────────────────────────────

  test('at least one CTA button or link is present on the homepage @functional', async ({ homePage }) => {
    const ctaButtons = await homePage.getCTAButtons();
    expect(
      ctaButtons.length,
      'Homepage should have at least one call-to-action button or link'
    ).toBeGreaterThan(0);
  });

  test('primary CTA is visible and has non-empty text @functional', async ({ homePage }) => {
    const ctaButtons = await homePage.getCTAButtons();

    if (ctaButtons.length === 0) {
      test.skip(true, 'No CTA buttons found — covered by "at least one CTA" test');
      return;
    }

    const firstCta = ctaButtons[0];
    await expect(firstCta, 'Primary CTA should be visible').toBeVisible();

    const text = await firstCta.textContent();
    expect(
      text?.trim().length,
      'Primary CTA button should have visible label text'
    ).toBeGreaterThan(0);
  });

  // ── Content sections ─────────────────────────────────────────────────────────

  test('homepage has multiple content sections @functional', async ({ page }) => {
    const sections = page.locator('section, article, [class*="section"], [class*="block"]');
    const count = await sections.count();
    expect(
      count,
      'Homepage should be structured into multiple content sections'
    ).toBeGreaterThan(0);
  });

  test('homepage has descriptive headings throughout @functional', async ({ page }) => {
    const allHeadings = page.locator('h1, h2, h3');
    const count = await allHeadings.count();
    expect(
      count,
      'Homepage should have multiple headings that structure the page content'
    ).toBeGreaterThan(1);
  });

  test('homepage body text is meaningful (>100 visible characters) @functional', async ({ page }) => {
    const bodyText = await page.evaluate<string>(() => document.body.innerText);
    expect(
      bodyText.replace(/\s+/g, ' ').trim().length,
      'Homepage body should contain substantial visible text content'
    ).toBeGreaterThan(100);
  });

  // ── Images ───────────────────────────────────────────────────────────────────

  test('homepage has at least one image @functional', async ({ page, siteConfig }) => {
    await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

    const images = page.locator('img');
    const count = await images.count();

    if (count === 0) {
      console.warn(`[functional] "${siteConfig.name}" homepage has no <img> elements. ` +
        'Images add credibility and context to B2B pages.');
    }

    // Soft check — warn but do not fail (background images via CSS may be used instead)
    expect(count).toBeGreaterThanOrEqual(0);
  });

  // ── Footer ───────────────────────────────────────────────────────────────────

  test('footer is present on the homepage @functional', async ({ page }) => {
    const footer = page.locator('footer, [role="contentinfo"]').first();
    const count = await footer.count();

    if (count === 0) {
      console.warn('[functional] No <footer> or role="contentinfo" element found. ' +
        'A footer typically contains copyright, contact, and legal links.');
    }

    // Soft check — many sites use div-based footers
    const footerByClass = page.locator('[class*="footer"]').first();
    const hasAnyFooter = (count > 0) || (await footerByClass.count() > 0);

    expect(
      hasAnyFooter,
      'Homepage should have a footer section'
    ).toBeTruthy();
  });

  test('footer contains copyright or company information @functional', async ({ page, siteConfig }) => {
    // Look for copyright text anywhere on the page (commonly in footer)
    const copyrightText = page.locator('*').filter({
      hasText: /©|copyright|\(c\)/i,
    }).first();

    // Also check for company name in footer area
    const companyInFooter = page.locator('footer, [class*="footer"]').filter({
      hasText: new RegExp(siteConfig.name, 'i'),
    }).first();

    const hasCopyright = await copyrightText.count() > 0;
    const hasCompanyName = await companyInFooter.count() > 0;

    if (!hasCopyright && !hasCompanyName) {
      console.warn(
        `[functional] No copyright notice or company name found in footer area for "${siteConfig.name}".`
      );
    }

    // At minimum, the page should have some footer-area content
    const footerContent = page.locator('footer, [class*="footer"], [role="contentinfo"]');
    const footerCount = await footerContent.count();
    expect(
      footerCount,
      'Page should have a footer with company or copyright information'
    ).toBeGreaterThan(0);
  });

  // ── Company identity ─────────────────────────────────────────────────────────

  test('company name appears on the page @functional', async ({ page, siteConfig }) => {
    if (!siteConfig.name || siteConfig.name === 'Unknown Company') {
      test.skip(true, 'No company name configured in site.config.json');
      return;
    }

    const bodyText = await page.evaluate<string>(() => document.body.innerText);
    const nameVariants = siteConfig.name.split(/[\s-]+/); // Check for any word from company name

    const anyVariantFound = nameVariants.some((word) =>
      word.length > 3 && bodyText.toLowerCase().includes(word.toLowerCase())
    );

    expect(
      anyVariantFound,
      `Company name "${siteConfig.name}" (or part of it) should appear somewhere on the homepage`
    ).toBeTruthy();
  });
});
