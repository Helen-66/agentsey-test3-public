import { test, expect } from '../../fixtures/test-fixtures';
import { LoginPage } from '../../pages/login.page';

test.describe('登录页面测试', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ monitoredPage }) => {
    loginPage = new LoginPage(monitoredPage);
    await loginPage.navigate();
  });

  test('页面加载正常，表单元素完整', async () => {
    const isReady = await loginPage.isLoginFormReady();
    expect(isReady).toBeTruthy();
  });

  test('空用户名登录应提示错误', async () => {
    await loginPage.login('', 'password123');
    const hasError = await loginPage.isErrorVisible();
    expect(hasError).toBeTruthy();
  });

  test('无效凭证登录应提示错误', async () => {
    await loginPage.login('invalid_user', 'wrong_pass');
    const hasError = await loginPage.isErrorVisible();
    expect(hasError).toBeTruthy();
  });

  test('页面性能指标检查', async () => {
    const metrics = await loginPage.getPerformanceMetrics();
    expect(metrics.loadTime).toBeLessThan(5000);
    expect(metrics.firstByte).toBeLessThan(1000);
  });

  test('页面生命周期无严重错误', async () => {
    const report = loginPage.getLifecycleReport();
    expect(report.summary.jsErrors).toBe(0);
    expect(report.summary.networkErrors).toBe(0);
  });
});
