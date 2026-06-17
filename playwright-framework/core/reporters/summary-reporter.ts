import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';
import { BugCollector } from '../bug-collector';

class SummaryReporter implements Reporter {
  private passed = 0;
  private failed = 0;
  private skipped = 0;
  private failedTests: { title: string; file: string; line: number }[] = [];
  private startTime = 0;

  onBegin(config: FullConfig, suite: Suite): void {
    this.startTime = Date.now();
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    switch (result.status) {
      case 'passed':
        this.passed++;
        break;
      case 'failed':
      case 'timedOut':
        this.failed++;
        this.failedTests.push({
          title: test.title,
          file: test.location.file,
          line: test.location.line,
        });
        break;
      case 'skipped':
        this.skipped++;
        break;
    }
  }

  onEnd(result: FullResult): void {
    const duration = ((Date.now() - this.startTime) / 1000).toFixed(1);
    const total = this.passed + this.failed + this.skipped;
    const status = this.failed > 0 ? 'FAILED' : 'PASSED';

    // Console summary
    console.log('\n========== Test Run Summary ==========');
    console.log(`Status: ${status}`);
    console.log(`Total tests: ${total} | Passed: ${this.passed} | Failed: ${this.failed} | Skipped: ${this.skipped}`);
    console.log(`Duration: ${duration}s`);

    if (this.failedTests.length > 0) {
      console.log('\nTop failed tests:');
      this.failedTests.slice(0, 3).forEach((t) => {
        console.log(`  - ${t.title} (${t.file}:${t.line})`);
      });
    }

    console.log(`\nHTML Report: playwright-report/index.html`);
    console.log('=======================================\n');

    // Generate markdown summary
    this.writeSummaryMarkdown(status, total, duration);
  }

  private writeSummaryMarkdown(status: string, total: number, duration: string): void {
    const reportsDir = path.resolve(process.cwd(), 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const date = now.toISOString().replace('T', ' ').substring(0, 19);

    const bugCollector = BugCollector.getInstance();
    const bugSummary = bugCollector.getSummary();

    const lines: string[] = [
      `# Test Run Summary — ${date}`,
      `- Status: ${status}`,
      `- Total: ${total} | Passed: ${this.passed} | Failed: ${this.failed} | Skipped: ${this.skipped}`,
      `- Duration: ${duration}s`,
      '',
      '## Failed Tests',
    ];

    if (this.failedTests.length > 0) {
      this.failedTests.forEach((t) => {
        lines.push(`- ${t.title} (${t.file}:${t.line})`);
      });
    } else {
      lines.push('- None');
    }

    lines.push('');
    lines.push('## Bug Report');
    lines.push(
      `- Critical: ${bugSummary.bySeverity.critical} | High: ${bugSummary.bySeverity.high} | Medium: ${bugSummary.bySeverity.medium} | Low: ${bugSummary.bySeverity.low}`
    );
    lines.push('');

    const filePath = path.join(reportsDir, `summary-${timestamp}.md`);
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
  }
}

export default SummaryReporter;
