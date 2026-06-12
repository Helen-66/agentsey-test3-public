import { Page } from '@playwright/test';
import { BugCollector, BugType, BugSeverity } from '../core/bug-collector';

/**
 * 页面健康检查工具
 * 综合检查页面各维度的健康状况
 */
export class PageHealthChecker {
  private page: Page;
  private bugCollector: BugCollector;

  constructor(page: Page) {
    this.page = page;
    this.bugCollector = BugCollector.getInstance();
  }

  /** 检查死链 */
  async checkBrokenLinks(): Promise<string[]> {
    const brokenLinks: string[] = [];
    const links = await this.page.locator('a[href]').all();

    for (const link of links) {
      const href = await link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;

      try {
        const url = new URL(href, this.page.url());
        const response = await this.page.request.head(url.toString());
        if (response.status() >= 400) {
          brokenLinks.push(href);
          this.bugCollector.report({
            type: BugType.UI_DEFECT,
            severity: BugSeverity.MEDIUM,
            title: `Broken Link: ${href} (status: ${response.status()})`,
            detail: `Link returns HTTP ${response.status()}`,
            page: this.page.url(),
            timestamp: Date.now(),
          });
        }
      } catch {
        // 外部链接或网络问题，跳过
      }
    }
    return brokenLinks;
  }

  /** 检查页面是否有重叠元素 */
  async checkOverlappingElements(): Promise<number> {
    return await this.page.evaluate(() => {
      const elements = document.querySelectorAll('button, a, input, select, textarea');
      let overlaps = 0;
      const rects = Array.from(elements).map((el) => ({
        el,
        rect: el.getBoundingClientRect(),
      }));

      for (let i = 0; i < rects.length; i++) {
        for (let j = i + 1; j < rects.length; j++) {
          const r1 = rects[i].rect;
          const r2 = rects[j].rect;
          if (r1.width === 0 || r1.height === 0 || r2.width === 0 || r2.height === 0) continue;
          const overlap =
            r1.left < r2.right && r1.right > r2.left && r1.top < r2.bottom && r1.bottom > r2.top;
          if (overlap) overlaps++;
        }
      }
      return overlaps;
    });
  }

  /** 检查控制台是否有废弃API警告 */
  async checkDeprecationWarnings(): Promise<string[]> {
    const warnings: string[] = [];
    this.page.on('console', (msg) => {
      if (msg.type() === 'warning' && msg.text().toLowerCase().includes('deprecated')) {
        warnings.push(msg.text());
      }
    });
    return warnings;
  }

  /** 综合健康检查 */
  async fullCheck(): Promise<{
    brokenLinks: string[];
    overlappingElements: number;
    score: number;
  }> {
    const brokenLinks = await this.checkBrokenLinks();
    const overlappingElements = await this.checkOverlappingElements();

    let score = 100;
    score -= brokenLinks.length * 5;
    score -= overlappingElements * 3;
    score = Math.max(0, score);

    return { brokenLinks, overlappingElements, score };
  }
}
