/**
 * src/pages/navigation.page.ts
 *
 * NavigationPage models the site's primary navigation.
 *
 * Strategy: tries semantic HTML5 selectors first (nav, [role="navigation"]),
 * then falls back to heuristics for table-layout / font-tag sites that have
 * no semantic nav element (e.g. the Eco-Edge site uses <span><font><a> links).
 */

import { type Locator } from '@playwright/test';
import { BasePage } from '@pages/base.page';

export interface NavLinkInfo {
  text: string;
  href: string;
}

export interface LinkCheckResult {
  url: string;
  status: number;
  ok: boolean;
}

export class NavigationPage extends BasePage {
  // ── Nav detection ────────────────────────────────────────────────────────────

  /**
   * Return the primary navigation locator.
   * Prefers semantic HTML5 nav; falls back to the first table row or div
   * that contains multiple anchor elements (common in table-layout sites).
   *
   * NOTE: This returns a Locator object regardless of whether the element
   * exists — callers must await .count() before using it.
   */
  private getNavLocator(): Locator {
    return this.page.locator('nav, [role="navigation"]').first();
  }

  /**
   * Return true if navigation links are present and visible on the page.
   *
   * For sites with semantic <nav> elements, checks that element's visibility.
   * For table-layout sites (no <nav>), considers nav "visible" when 3+
   * internal links with text are present — which is the practical definition
   * of a navigable site regardless of markup.
   */
  async isNavVisible(): Promise<boolean> {
    // 1. Semantic nav
    const semanticNav = this.page.locator('nav, [role="navigation"]');
    if (await semanticNav.count() > 0) {
      return semanticNav.first().isVisible();
    }

    // 2. Fallback: 3+ visible links with text = navigable site (handles relative hrefs)
    const visibleTextLinks = this.page.locator('a[href]').filter({ hasText: /\S/ });
    return (await visibleTextLinks.count()) >= 3;
  }

  // ── Nav links ────────────────────────────────────────────────────────────────

  /**
   * Return all navigation links with their text and href.
   *
   * For semantic sites: scoped to <nav> / [role="navigation"].
   * For non-semantic sites (no <nav>): collects all internal links with
   * visible text, deduplicating by resolved URL.
   */
  async getNavLinks(): Promise<NavLinkInfo[]> {
    const baseUrl = new URL(this.config.url);
    const results: NavLinkInfo[] = [];
    const seen = new Set<string>();

    // Determine whether a semantic nav container exists
    const semanticNav = this.page.locator('nav, [role="navigation"]');
    const hasSemanticNav = (await semanticNav.count()) > 0;

    const linkLocator = hasSemanticNav
      ? semanticNav.first().locator('a[href]')
      : this.page.locator('a[href]'); // full-page fallback

    const count = await linkLocator.count();

    for (let i = 0; i < count; i++) {
      const link = linkLocator.nth(i);
      const text = ((await link.textContent()) ?? '').trim();
      const href = (await link.getAttribute('href')) ?? '';

      // Skip empty, anchor-only, or script links
      if (!href || href === '#' || href.startsWith('javascript:')) continue;
      // Skip links with no visible text (image-only links)
      if (!text) continue;
      // Skip non-navigable schemes
      if (href.startsWith('mailto:') || href.startsWith('tel:')) continue;

      // In fallback mode, restrict to same-hostname links only
      if (!hasSemanticNav) {
        try {
          const resolved = new URL(href, baseUrl);
          if (resolved.hostname !== baseUrl.hostname) continue;
        } catch {
          continue;
        }
      }

      // Deduplicate by resolved absolute URL
      let resolvedKey: string;
      try {
        resolvedKey = new URL(href, baseUrl).href;
      } catch {
        resolvedKey = href;
      }
      if (seen.has(resolvedKey)) continue;
      seen.add(resolvedKey);

      results.push({ text, href });
    }

    return results;
  }

  /**
   * Click a navigation item by its visible text.
   * Uses a case-insensitive partial match.
   */
  async clickNavItem(text: string): Promise<void> {
    // Try semantic nav first
    const semanticNav = this.page.locator('nav, [role="navigation"]');
    if (await semanticNav.count() > 0) {
      const link = semanticNav.first().getByRole('link', { name: text });
      await link.first().click();
    } else {
      // Fallback: click any visible link matching the text
      await this.page.getByRole('link', { name: new RegExp(text, 'i') }).first().click();
    }
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ── Mobile menu ──────────────────────────────────────────────────────────────

  /**
   * Return the mobile hamburger / menu toggle locator, or null if not found.
   * Non-semantic / table-layout sites typically have no hamburger toggle —
   * returning null causes the test to check isNavVisible() instead.
   */
  async getMobileMenuToggle(): Promise<Locator | null> {
    const candidates = [
      this.page.getByRole('button', { name: /menu|navigation|toggle|hamburger/i }),
      this.page.locator('[class*="hamburger"], [class*="menu-toggle"], [class*="nav-toggle"]'),
      this.page.locator('[aria-label*="menu" i], [aria-label*="navigation" i]').filter({ hasNotText: /^\s*$/ }),
      this.page.locator('button[aria-expanded]').first(),
    ];

    for (const candidate of candidates) {
      if (await candidate.count() > 0 && await candidate.first().isVisible()) {
        return candidate.first();
      }
    }

    return null;
  }

  /**
   * Open the mobile navigation menu if a toggle exists and is currently closed.
   * No-op if no toggle is found (desktop layout or non-responsive site).
   */
  async openMobileMenu(): Promise<void> {
    const toggle = await this.getMobileMenuToggle();
    if (!toggle) return;

    const isExpanded = await toggle.getAttribute('aria-expanded');
    if (isExpanded === 'true') return;

    await toggle.click();
    await this.page.waitForTimeout(400);
  }

  // ── Link reachability ────────────────────────────────────────────────────────

  /**
   * Check all nav links are reachable by issuing HEAD requests.
   * Returns an array of results with URL, HTTP status, and ok flag.
   */
  async checkAllNavLinksReachable(): Promise<LinkCheckResult[]> {
    const navLinks = await this.getNavLinks();
    const baseUrl = new URL(this.config.url);
    const results: LinkCheckResult[] = [];

    for (const link of navLinks) {
      let absoluteUrl: string;
      try {
        absoluteUrl = new URL(link.href, baseUrl).toString();
      } catch {
        results.push({ url: link.href, status: 0, ok: false });
        continue;
      }

      try {
        const response = await this.page.request.head(absoluteUrl, {
          timeout: 10_000,
        });
        results.push({
          url: absoluteUrl,
          status: response.status(),
          ok: response.ok(),
        });
      } catch {
        results.push({ url: absoluteUrl, status: 0, ok: false });
      }
    }

    return results;
  }
}
