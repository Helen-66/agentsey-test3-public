import { test, expect } from '../../fixtures/test-fixtures';
import { HomePage } from '../../pages/home.page';

test.describe('首页测试', () => {
  let homePage: HomePage;

  test.beforeEach(async ({ monitoredPage }) => {
    homePage = new HomePage(monitoredPage);
    await homePage.navigate();
  });

  test('首页加载正常', async () => {
    const hasNav = await homePage.hasNavbar();
    expect(hasNav).toBeTruthy();
  });

  test('首页性能指标检查', async () => {
    const metrics = await homePage.getPerformanceMetrics();
    expect(metrics.loadTime).toBeLessThan(5000);
    expect(metrics.domReady).toBeLessThan(3000);
  });

  test('首页无JS错误和网络异常', async () => {
    const report = homePage.getLifecycleReport();
    expect(report.summary.jsErrors).toBe(0);
    expect(report.summary.consoleErrors).toBe(0);
  });
});
