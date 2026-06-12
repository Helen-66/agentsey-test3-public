import { Page } from '@playwright/test';
import { BasePage } from '../core/base-page';

/**
 * 首页 PageObject 示例
 */
export class HomePage extends BasePage {
  readonly pageName = 'Home';
  readonly pageURL = '/';

  private get navbar() {
    return this.page.locator('nav, [data-testid="navbar"]');
  }

  private get userAvatar() {
    return this.page.locator('[data-testid="user-avatar"], .user-avatar');
  }

  private get searchInput() {
    return this.page.locator('[data-testid="search"], input[type="search"]');
  }

  constructor(page: Page) {
    super(page);
  }

  async isLoggedIn(): Promise<boolean> {
    return await this.isVisible(this.userAvatar);
  }

  async search(keyword: string): Promise<void> {
    await this.fill(this.searchInput, keyword);
    await this.page.keyboard.press('Enter');
  }

  async hasNavbar(): Promise<boolean> {
    return await this.isVisible(this.navbar);
  }
}
