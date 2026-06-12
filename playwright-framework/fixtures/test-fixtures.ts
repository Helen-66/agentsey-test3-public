import { test as base, Page } from '@playwright/test';
import { PageLifecycleMonitor } from '../middlewares/lifecycle-monitor';
import { BugCollector } from '../core/bug-collector';

/**
 * 自定义Fixture - 为每个测试自动注入生命周期监控
 */
type CustomFixtures = {
  monitoredPage: Page;
  bugCollector: BugCollector;
};

export const test = base.extend<CustomFixtures>({
  monitoredPage: async ({ page }, use) => {
    // 每个测试自动启用生命周期监控
    new PageLifecycleMonitor(page);
    await use(page);
  },

  bugCollector: async ({}, use) => {
    const collector = BugCollector.getInstance();
    await use(collector);
  },
});

export { expect } from '@playwright/test';
