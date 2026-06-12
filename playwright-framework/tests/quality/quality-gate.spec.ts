import { test, expect } from '../../fixtures/test-fixtures';
import { AccessibilityChecker } from '../../utils/accessibility-checker';
import { PageHealthChecker } from '../../utils/page-health-checker';

/**
 * 通用页面质量检查套件
 * 可对任意页面执行，只需配置URL列表
 */
const pagesToCheck = [
  { name: '首页', url: '/' },
  { name: '登录页', url: '/login' },
  // 新增页面只需在此添加即可
];

for (const pageConfig of pagesToCheck) {
  test.describe(`[质量检查] ${pageConfig.name}`, () => {
    test(`可访问性检查 - ${pageConfig.name}`, async ({ monitoredPage }) => {
      await monitoredPage.goto(pageConfig.url);
      const checker = new AccessibilityChecker(monitoredPage);
      const result = await checker.checkPage();
      // 记录问题但不阻断，可根据严格程度调整
      if (result.issues.length > 0) {
        console.warn(`[A11y] ${pageConfig.name}: ${result.issues.join(', ')}`);
      }
    });

    test(`页面健康检查 - ${pageConfig.name}`, async ({ monitoredPage }) => {
      await monitoredPage.goto(pageConfig.url);
      const checker = new PageHealthChecker(monitoredPage);
      const health = await checker.fullCheck();
      expect(health.score).toBeGreaterThan(60);
    });

    test(`性能基线检查 - ${pageConfig.name}`, async ({ monitoredPage }) => {
      await monitoredPage.goto(pageConfig.url, { waitUntil: 'load' });
      const metrics = await monitoredPage.evaluate(() => ({
        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
        domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart,
      }));
      expect(metrics.loadTime).toBeLessThan(8000);
      expect(metrics.domReady).toBeLessThan(5000);
    });
  });
}
