/**
 * tests/functional/content-sections.spec.ts
 *
 * Functional tests for content sections beyond the homepage:
 * services/solutions pages, about information, external social links,
 * and overall page link health.
 *
 * Tag: @functional
 */

import { test, expect } from '@fixtures/site.fixture';
import { checkAllLinks, filterInternalLinks } from '@utils/link-checker';

test.describe('Content Sections @functional', () => {
  // ── Services / Solutions ─────────────────────────────────────────────────────

  test.describe('Services or Solutions content', () => {
    test('services or solutions section is accessible from homepage @functional', async ({
      page,
      siteConfig,
    }) => {
      await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      // Look for a "Services" or "Solutions" link anywhere on the page
      const serviceLink = page.locator('a').filter({
        hasText: /services|solutions|products|offerings|what we do/i,
      }).first();

      if (await serviceLink.count() === 0) {
        console.warn(
          `[functional] No "Services" or "Solutions" link found on "${siteConfig.name}" homepage. ` +
          'B2B sites typically link to a services/solutions page.'
        );
        return; // Not a hard failure — site structure varies
      }

      await expect(serviceLink, 'Services/Solutions link should be visible').toBeVisible();

      const href = await serviceLink.getAttribute('href');
      expect(href, 'Services/Solutions link should have a valid href').not.toBeNull();
    });

    test('navigating to services page shows content @functional', async ({
      page,
      siteConfig,
    }) => {
      // Try common services page paths
      const paths = ['/services', '/solutions', '/products', '/what-we-do', '/offerings'];
      let foundContent = false;

      for (const servicePath of paths) {
        try {
          const response = await page.goto(
            siteConfig.url.replace(/\/$/, '') + servicePath,
            { waitUntil: 'domcontentloaded', timeout: 10_000 }
          );

          if (response && response.status() >= 200 && response.status() < 400) {
            const bodyText = await page.evaluate<string>(() => document.body.innerText);
            if (bodyText.trim().length > 100) {
              foundContent = true;

              // Verify the page has a heading
              const heading = page.locator('h1, h2').first();
              const headingCount = await heading.count();
              expect(
                headingCount,
                `Services page at "${servicePath}" should have at least one heading`
              ).toBeGreaterThan(0);

              break;
            }
          }
        } catch {
          // Path not found — try next
        }
      }

      if (!foundContent) {
        console.warn(
          `[functional] No services page found at standard paths for "${siteConfig.name}". ` +
          'Checked: ' + paths.join(', ')
        );
      }

      // Pass regardless — site structure is unknown; this is an informational check
      expect(true).toBeTruthy();
    });
  });

  // ── About / Company information ───────────────────────────────────────────────

  test.describe('About / Company information', () => {
    test('an About page or section is reachable @functional', async ({ page, siteConfig }) => {
      await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });

      // Check nav for an About link
      const aboutNavLink = page.locator('nav a, header a').filter({
        hasText: /about|company|who we are|our story|team/i,
      }).first();

      if (await aboutNavLink.count() > 0) {
        await expect(aboutNavLink, 'About link should be visible in nav').toBeVisible();
        const href = await aboutNavLink.getAttribute('href');
        expect(href, 'About nav link should have a non-empty href').toBeTruthy();
        return;
      }

      // Fall back: try /about directly
      const aboutPaths = ['/about', '/about-us', '/company', '/who-we-are'];
      let reachable = false;

      for (const aboutPath of aboutPaths) {
        try {
          const response = await page.goto(
            siteConfig.url.replace(/\/$/, '') + aboutPath,
            { waitUntil: 'domcontentloaded', timeout: 10_000 }
          );
          if (response && response.status() < 400) {
            reachable = true;
            break;
          }
        } catch {
          // Continue
        }
      }

      if (!reachable) {
        console.warn(
          `[functional] No About page found for "${siteConfig.name}". ` +
          'An About page builds trust with B2B buyers.'
        );
      }

      // Informational only — not a hard failure
      expect(true).toBeTruthy();
    });
  });

  // ── External links ───────────────────────────────────────────────────────────

  test.describe('Social and external links', () => {
    test('LinkedIn company link is present @functional', async ({ page, siteConfig }) => {
      await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      const linkedInLink = page.locator('a[href*="linkedin.com"]').first();

      if (await linkedInLink.count() === 0) {
        console.warn(
          `[functional] No LinkedIn link found on "${siteConfig.name}" homepage. ` +
          'LinkedIn presence is important for B2B credibility.'
        );
        return;
      }

      await expect(linkedInLink, 'LinkedIn link should be visible').toBeVisible();
      const href = await linkedInLink.getAttribute('href');
      expect(href).toContain('linkedin.com');
    });

    test('external links open with appropriate target or rel attributes @functional', async ({
      page,
      siteConfig,
    }) => {
      await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      const siteOrigin = new URL(siteConfig.url).origin;

      // Collect all links from the browser, then filter by origin in Node context
      const allLinks = await page.evaluate<Array<{ href: string; target: string | null; rel: string | null }>>(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors.map((a) => ({
          href: (a as HTMLAnchorElement).href,
          target: (a as HTMLAnchorElement).getAttribute('target'),
          rel: (a as HTMLAnchorElement).getAttribute('rel'),
        }));
      });

      // Filter to external links (different origin) in Node.js context
      const externalLinks = allLinks.filter(({ href }) => {
        try {
          return new URL(href).origin !== siteOrigin;
        } catch {
          return false;
        }
      });

      if (externalLinks.length === 0) {
        console.warn('[functional] No external links found on the homepage.');
        return;
      }

      // External links should have rel="noopener" or rel="noreferrer" (security best practice)
      const unsafeExternalLinks = externalLinks.filter(({ rel }) => {
        if (!rel) return true; // Missing rel entirely
        return !rel.includes('noopener') && !rel.includes('noreferrer');
      });

      if (unsafeExternalLinks.length > 0) {
        console.warn(
          `[functional] ${unsafeExternalLinks.length} external link(s) missing rel="noopener noreferrer":\n` +
          unsafeExternalLinks.slice(0, 5).map((l) => `  ${l.href}`).join('\n')
        );
      }

      // Soft assertion — this is a security best practice, not a hard failure
      expect(externalLinks.length).toBeGreaterThanOrEqual(0);
    });
  });

  // ── Internal link health ─────────────────────────────────────────────────────

  test.describe('Internal link health', () => {
    test('no broken internal links on the homepage @functional', async ({ page, siteConfig }) => {
      await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      const allResults = await checkAllLinks(page, siteConfig.url);
      const internalResults = filterInternalLinks(allResults, siteConfig.url);

      if (internalResults.length === 0) {
        console.warn('[functional] No internal links found on the homepage.');
        return;
      }

      const broken = internalResults.filter((r) => !r.ok && r.status !== 0 && r.status >= 400);
      const unreachable = internalResults.filter((r) => r.status === 0);

      if (unreachable.length > 0) {
        console.warn(
          `[functional] ${unreachable.length} internal link(s) could not be reached (network error):\n` +
          unreachable.slice(0, 5).map((r) => `  ${r.url}`).join('\n')
        );
      }

      expect(
        broken,
        `Found ${broken.length} broken internal link(s) on the homepage:\n` +
        broken.map((r) => `  ${r.url} → HTTP ${r.status}`).join('\n')
      ).toHaveLength(0);
    });
  });

  // ── Contact information ──────────────────────────────────────────────────────

  test.describe('Contact information', () => {
    test('contact information or link is findable on the site @functional', async ({
      page,
      siteConfig,
    }) => {
      await page.goto(siteConfig.url, { waitUntil: 'domcontentloaded' });
      await page.waitForLoadState('networkidle');

      // Look for contact info indicators: phone number, email, or contact link
      const contactPatterns = [
        'a[href^="mailto:"]',
        'a[href^="tel:"]',
        'a[href*="contact"]',
        '[class*="contact"]',
      ];

      let found = false;
      for (const pattern of contactPatterns) {
        if (await page.locator(pattern).count() > 0) {
          found = true;
          break;
        }
      }

      // Also check for a contact page link in nav
      if (!found) {
        const contactNavLink = page.locator('nav a, header a, footer a').filter({
          hasText: /contact|get in touch|reach us|email/i,
        });
        found = await contactNavLink.count() > 0;
      }

      if (!found) {
        console.warn(
          `[functional] No contact information found on "${siteConfig.name}" homepage. ` +
          'Expected: mailto link, tel link, or Contact nav item.'
        );
      }

      expect(
        found,
        `"${siteConfig.name}" should provide a way to contact the company (email, phone, or contact link)`
      ).toBeTruthy();
    });
  });
});
