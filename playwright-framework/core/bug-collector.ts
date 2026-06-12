import * as fs from 'fs';
import * as path from 'path';

export enum BugType {
  CONSOLE_ERROR = 'console_error',
  JS_ERROR = 'js_error',
  NETWORK_ERROR = 'network_error',
  PERFORMANCE = 'performance',
  UI_DEFECT = 'ui_defect',
  FUNCTIONAL = 'functional',
  ACCESSIBILITY = 'accessibility',
}

export enum BugSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum BugStatus {
  OPEN = 'open',
  CONFIRMED = 'confirmed',
  FIXED = 'fixed',
  WONT_FIX = 'wont_fix',
}

export interface BugRecord {
  id?: string;
  type: BugType;
  severity: BugSeverity;
  status?: BugStatus;
  title: string;
  detail: string;
  page: string;
  timestamp: number;
  screenshot?: string;
  steps?: string[];
  environment?: string;
}

/**
 * Bug收集器 - 单例模式
 * 负责收集、去重、持久化所有发现的缺陷
 */
export class BugCollector {
  private static instance: BugCollector;
  private bugs: BugRecord[] = [];
  private bugSetKeys = new Set<string>();
  private readonly outputDir: string;

  private constructor() {
    this.outputDir = path.resolve(process.cwd(), 'bugs');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  static getInstance(): BugCollector {
    if (!BugCollector.instance) {
      BugCollector.instance = new BugCollector();
    }
    return BugCollector.instance;
  }

  report(bug: BugRecord): void {
    const key = `${bug.type}:${bug.title}:${bug.page}`;
    if (this.bugSetKeys.has(key)) {
      return; // 去重
    }
    this.bugSetKeys.add(key);

    bug.id = this.generateId();
    bug.status = BugStatus.OPEN;
    bug.environment = process.env.TEST_ENV || 'dev';
    this.bugs.push(bug);
  }

  getAll(): BugRecord[] {
    return [...this.bugs];
  }

  getBySeverity(severity: BugSeverity): BugRecord[] {
    return this.bugs.filter((b) => b.severity === severity);
  }

  getByType(type: BugType): BugRecord[] {
    return this.bugs.filter((b) => b.type === type);
  }

  getSummary() {
    return {
      total: this.bugs.length,
      bySeverity: {
        critical: this.getBySeverity(BugSeverity.CRITICAL).length,
        high: this.getBySeverity(BugSeverity.HIGH).length,
        medium: this.getBySeverity(BugSeverity.MEDIUM).length,
        low: this.getBySeverity(BugSeverity.LOW).length,
      },
      byType: {
        consoleError: this.getByType(BugType.CONSOLE_ERROR).length,
        jsError: this.getByType(BugType.JS_ERROR).length,
        networkError: this.getByType(BugType.NETWORK_ERROR).length,
        performance: this.getByType(BugType.PERFORMANCE).length,
        uiDefect: this.getByType(BugType.UI_DEFECT).length,
        functional: this.getByType(BugType.FUNCTIONAL).length,
      },
    };
  }

  flush(): void {
    if (this.bugs.length === 0) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filePath = path.join(this.outputDir, `bugs-${timestamp}.json`);

    const report = {
      generatedAt: new Date().toISOString(),
      summary: this.getSummary(),
      bugs: this.bugs,
    };

    fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');
  }

  clear(): void {
    this.bugs = [];
    this.bugSetKeys.clear();
  }

  private generateId(): string {
    return `BUG-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  }
}
