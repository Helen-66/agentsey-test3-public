import { Page } from '@playwright/test';
import { BugCollector, BugType, BugSeverity } from '../core/bug-collector';

/**
 * 可访问性检查工具
 * 检测常见的无障碍问题
 */
export class AccessibilityChecker {
  private page: Page;
  private bugCollector: BugCollector;

  constructor(page: Page) {
    this.page = page;
    this.bugCollector = BugCollector.getInstance();
  }

  async checkPage(): Promise<{ issues: string[] }> {
    const issues: string[] = [];

    // 检查图片alt属性
    const imagesWithoutAlt = await this.page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      const msg = `Found ${imagesWithoutAlt} images without alt attribute`;
      issues.push(msg);
      this.bugCollector.report({
        type: BugType.ACCESSIBILITY,
        severity: BugSeverity.MEDIUM,
        title: msg,
        detail: msg,
        page: this.page.url(),
        timestamp: Date.now(),
      });
    }

    // 检查表单label关联
    const inputsWithoutLabel = await this.page.evaluate(() => {
      const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"])');
      let count = 0;
      inputs.forEach((input) => {
        const id = input.getAttribute('id');
        const ariaLabel = input.getAttribute('aria-label');
        const ariaLabelledBy = input.getAttribute('aria-labelledby');
        const hasLabel = id && document.querySelector(`label[for="${id}"]`);
        if (!hasLabel && !ariaLabel && !ariaLabelledBy) {
          count++;
        }
      });
      return count;
    });

    if (inputsWithoutLabel > 0) {
      const msg = `Found ${inputsWithoutLabel} inputs without associated labels`;
      issues.push(msg);
      this.bugCollector.report({
        type: BugType.ACCESSIBILITY,
        severity: BugSeverity.MEDIUM,
        title: msg,
        detail: msg,
        page: this.page.url(),
        timestamp: Date.now(),
      });
    }

    // 检查颜色对比度（简化版，检查是否有过小字体）
    const smallTextCount = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('body *');
      let count = 0;
      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 12 && el.textContent?.trim()) {
          count++;
        }
      });
      return count;
    });

    if (smallTextCount > 0) {
      const msg = `Found ${smallTextCount} elements with font-size < 12px`;
      issues.push(msg);
      this.bugCollector.report({
        type: BugType.ACCESSIBILITY,
        severity: BugSeverity.LOW,
        title: msg,
        detail: msg,
        page: this.page.url(),
        timestamp: Date.now(),
      });
    }

    return { issues };
  }
}
