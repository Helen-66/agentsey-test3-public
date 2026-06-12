import { Page } from '@playwright/test';
import { BasePage } from '../core/base-page';

/**
 * 登录页面 PageObject 示例
 * 演示如何快速接入一个新页面
 */
export class LoginPage extends BasePage {
  readonly pageName = 'Login';
  readonly pageURL = '/login';

  // 元素定位器 - 集中管理
  private get usernameInput() {
    return this.page.locator('#username, [name="username"], [data-testid="username"]');
  }

  private get passwordInput() {
    return this.page.locator('#password, [name="password"], [data-testid="password"]');
  }

  private get submitButton() {
    return this.page.locator('button[type="submit"], [data-testid="login-btn"]');
  }

  private get errorMessage() {
    return this.page.locator('.error-message, [data-testid="error-msg"], [role="alert"]');
  }

  constructor(page: Page) {
    super(page);
  }

  async login(username: string, password: string): Promise<void> {
    this.logger.info(`Attempting login with user: ${username}`);
    await this.fill(this.usernameInput, username);
    await this.fill(this.passwordInput, password);
    await this.click(this.submitButton);
  }

  async getErrorText(): Promise<string> {
    return await this.getText(this.errorMessage);
  }

  async isErrorVisible(): Promise<boolean> {
    return await this.isVisible(this.errorMessage);
  }

  async isLoginFormReady(): Promise<boolean> {
    const usernameVisible = await this.isVisible(this.usernameInput);
    const passwordVisible = await this.isVisible(this.passwordInput);
    const buttonVisible = await this.isVisible(this.submitButton);
    return usernameVisible && passwordVisible && buttonVisible;
  }
}
