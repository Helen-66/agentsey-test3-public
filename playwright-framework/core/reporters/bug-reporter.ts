import type { Reporter, TestCase, TestResult, FullResult } from '@playwright/test/reporter';
import { BugCollector } from '../bug-collector';

/**
 * 自定义Reporter - 测试结束后输出Bug沉淀报告
 */
class BugReporter implements Reporter {
  private bugCollector = BugCollector.getInstance();

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status === 'failed' || result.status === 'timedOut') {
      const error = result.errors[0];
      this.bugCollector.report({
        type: 'functional' as any,
        severity: 'high' as any,
        title: `Test Failed: ${test.title}`,
        detail: error?.message || 'Unknown failure',
        page: test.location.file,
        timestamp: Date.now(),
        steps: test.titlePath(),
      });
    }
  }

  onEnd(result: FullResult): void {
    this.bugCollector.flush();
    const summary = this.bugCollector.getSummary();
    console.log('\n========== Bug Summary ==========');
    console.log(`Total Bugs Found: ${summary.total}`);
    console.log(`  Critical: ${summary.bySeverity.critical}`);
    console.log(`  High: ${summary.bySeverity.high}`);
    console.log(`  Medium: ${summary.bySeverity.medium}`);
    console.log(`  Low: ${summary.bySeverity.low}`);
    console.log('=================================\n');
  }
}

export default BugReporter;
