import { Page, ConsoleMessage, Request, Response } from '@playwright/test';
import { BugCollector, BugSeverity, BugType } from '../core/bug-collector';

export interface LifecycleEvent {
  timestamp: number;
  type: string;
  detail: string;
  severity: 'info' | 'warning' | 'error';
}

/**
 * 页面全生命周期监控中间件
 * 监控：控制台错误、网络异常、JS异常、资源加载、性能问题
 */
export class PageLifecycleMonitor {
  private page: Page;
  private events: LifecycleEvent[] = [];
  private bugCollector: BugCollector;
  private consoleErrors: string[] = [];
  private networkErrors: { url: string; status: number; method: string }[] = [];
  private jsErrors: string[] = [];
  private slowRequests: { url: string; duration: number }[] = [];

  constructor(page: Page) {
    this.page = page;
    this.bugCollector = BugCollector.getInstance();
    this.setupListeners();
  }

  private setupListeners(): void {
    // 监控控制台错误
    this.page.on('console', (msg: ConsoleMessage) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        this.consoleErrors.push(text);
        this.addEvent('console_error', text, 'error');
        this.bugCollector.report({
          type: BugType.CONSOLE_ERROR,
          severity: BugSeverity.MEDIUM,
          title: `Console Error: ${text.substring(0, 100)}`,
          detail: text,
          page: this.page.url(),
          timestamp: Date.now(),
        });
      }
    });

    // 监控JS未捕获异常
    this.page.on('pageerror', (error: Error) => {
      this.jsErrors.push(error.message);
      this.addEvent('js_error', error.message, 'error');
      this.bugCollector.report({
        type: BugType.JS_ERROR,
        severity: BugSeverity.HIGH,
        title: `Uncaught JS Error: ${error.message.substring(0, 100)}`,
        detail: error.stack || error.message,
        page: this.page.url(),
        timestamp: Date.now(),
      });
    });

    // 监控网络请求失败
    this.page.on('response', (response: Response) => {
      const status = response.status();
      if (status >= 400) {
        const entry = {
          url: response.url(),
          status,
          method: response.request().method(),
        };
        this.networkErrors.push(entry);
        this.addEvent('network_error', `${entry.method} ${entry.url} -> ${status}`, 'error');
        this.bugCollector.report({
          type: BugType.NETWORK_ERROR,
          severity: status >= 500 ? BugSeverity.HIGH : BugSeverity.MEDIUM,
          title: `HTTP ${status}: ${entry.method} ${entry.url}`,
          detail: JSON.stringify(entry),
          page: this.page.url(),
          timestamp: Date.now(),
        });
      }
    });

    // 监控请求超时/慢请求
    const requestTimings = new Map<Request, number>();
    this.page.on('request', (request: Request) => {
      requestTimings.set(request, Date.now());
    });

    this.page.on('requestfinished', (request: Request) => {
      const start = requestTimings.get(request);
      if (start) {
        const duration = Date.now() - start;
        if (duration > 3000) {
          this.slowRequests.push({ url: request.url(), duration });
          this.addEvent('slow_request', `${request.url()} took ${duration}ms`, 'warning');
          this.bugCollector.report({
            type: BugType.PERFORMANCE,
            severity: BugSeverity.LOW,
            title: `Slow Request: ${request.url()} (${duration}ms)`,
            detail: `Request took ${duration}ms, threshold is 3000ms`,
            page: this.page.url(),
            timestamp: Date.now(),
          });
        }
        requestTimings.delete(request);
      }
    });

    // 监控请求失败
    this.page.on('requestfailed', (request: Request) => {
      const failure = request.failure();
      this.addEvent('request_failed', `${request.url()} - ${failure?.errorText}`, 'error');
      this.bugCollector.report({
        type: BugType.NETWORK_ERROR,
        severity: BugSeverity.HIGH,
        title: `Request Failed: ${request.url()}`,
        detail: failure?.errorText || 'Unknown error',
        page: this.page.url(),
        timestamp: Date.now(),
      });
    });
  }

  private addEvent(type: string, detail: string, severity: LifecycleEvent['severity']): void {
    this.events.push({ timestamp: Date.now(), type, detail, severity });
  }

  getReport() {
    return {
      events: this.events,
      summary: {
        consoleErrors: this.consoleErrors.length,
        networkErrors: this.networkErrors.length,
        jsErrors: this.jsErrors.length,
        slowRequests: this.slowRequests.length,
        totalIssues:
          this.consoleErrors.length +
          this.networkErrors.length +
          this.jsErrors.length +
          this.slowRequests.length,
      },
      details: {
        consoleErrors: this.consoleErrors,
        networkErrors: this.networkErrors,
        jsErrors: this.jsErrors,
        slowRequests: this.slowRequests,
      },
    };
  }
}
