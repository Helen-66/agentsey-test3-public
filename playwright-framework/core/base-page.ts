import { Page, BrowserContext, Locator, expect } from '@playwright/test';
import { PageLifecycleMonitor } from '../middlewares/lifecycle-monitor';
import { Logger } from '../utils/logger';

/**
 * 基础页面类 - 所有PageObject的父类
 * 封装通用操作，集成生命周期监控
 */
export abstract class BasePage {
  protected page: Page;
  protected context: BrowserContext;
  protected logger: Logger;
  protected monitor: PageLifecycleMonitor;

  abstract readonly pageName: string;
  abstract readonly pageURL: string;

  constructor(page: Page) {
    this.page = page;
    this.context = page.context();
    this.logger = new Logger(this.constructor.name);
    this.monitor = new PageLifecycleMonitor(page);
  }

  async navigate(): Promise<void> {
    this.logger.info(`Navigating to ${this.pageURL}`);
    await this.page.goto(this.pageURL, { waitUntil: 'domcontentloaded' });
    await this.waitForPageReady();
  }

  async waitForPageReady(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async click(locator: Locator, options?: { timeout?: number }): Promise<void> {
    await locator.waitFor({ state: 'visible', timeout: options?.timeout });
    await locator.click();
  }

  async fill(locator: Locator, value: string): Promise<void> {
    await locator.waitFor({ state: 'visible' });
    await locator.clear();
    await locator.fill(value);
  }

  async getText(locator: Locator): Promise<string> {
    await locator.waitFor({ state: 'visible' });
    return (await locator.textContent()) || '';
  }

  async isVisible(locator: Locator, timeout = 5000): Promise<boolean> {
    try {
      await locator.waitFor({ state: 'visible', timeout });
      return true;
    } catch {
      return false;
    }
  }

  async screenshot(name: string): Promise<Buffer> {
    return await this.page.screenshot({
      path: `reports/screenshots/${name}-${Date.now()}.png`,
      fullPage: true,
    });
  }

  async getPerformanceMetrics() {
    return await this.page.evaluate(() => {
      const timing = performance.timing;
      return {
        loadTime: timing.loadEventEnd - timing.navigationStart,
        domReady: timing.domContentLoadedEventEnd - timing.navigationStart,
        firstByte: timing.responseStart - timing.navigationStart,
        domInteractive: timing.domInteractive - timing.navigationStart,
      };
    });
  }

  getLifecycleReport() {
    return this.monitor.getReport();
  }
}
