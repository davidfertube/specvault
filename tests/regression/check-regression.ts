/**
 * Regression Check Script
 *
 * Compares current stress test metrics with baseline to detect regressions.
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

const REGRESSION_THRESHOLD = 10; // 10% regression triggers failure

interface MetricComparison {
  metric: string;
  baseline: number;
  current: number;
  change_percent: number;
  regressed: boolean;
}

function compareMetrics(baselineDb: string, currentDb: string): MetricComparison[] {
  if (!fs.existsSync(baselineDb)) {
    console.log('⚠️  No baseline found. Run stress tests and save baseline:');
    console.log('   cp tests/stress/metrics/stress-test.db tests/stress/metrics/baseline.db');
    process.exit(0);
  }

  const baseline = new Database(baselineDb);
  const current = new Database(currentDb);

  const comparisons: MetricComparison[] = [];

  // Compare P95 latencies for /api/chat
  const baselineP95 = baseline.prepare(`
    SELECT
      duration_ms
    FROM request_metrics
    WHERE endpoint = '/api/chat'
    ORDER BY duration_ms
    LIMIT 1 OFFSET (
      SELECT CAST(COUNT(*) * 95 / 100.0 AS INTEGER)
      FROM request_metrics
      WHERE endpoint = '/api/chat'
    )
  `).get() as { duration_ms: number } | undefined;

  const currentP95 = current.prepare(`
    SELECT
      duration_ms
    FROM request_metrics
    WHERE endpoint = '/api/chat'
    ORDER BY duration_ms
    LIMIT 1 OFFSET (
      SELECT CAST(COUNT(*) * 95 / 100.0 AS INTEGER)
      FROM request_metrics
      WHERE endpoint = '/api/chat'
    )
  `).get() as { duration_ms: number } | undefined;

  if (baselineP95 && currentP95) {
    const changePercent = ((currentP95.duration_ms - baselineP95.duration_ms) / baselineP95.duration_ms) * 100;
    comparisons.push({
      metric: 'Chat API P95',
      baseline: baselineP95.duration_ms,
      current: currentP95.duration_ms,
      change_percent: changePercent,
      regressed: changePercent > REGRESSION_THRESHOLD,
    });
  }

  // Compare error rates
  const baselineErrorRate = baseline.prepare(`
    SELECT
      CAST(SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100 as error_rate
    FROM request_metrics
  `).get() as { error_rate: number } | undefined;

  const currentErrorRate = current.prepare(`
    SELECT
      CAST(SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) AS REAL) / COUNT(*) * 100 as error_rate
    FROM request_metrics
  `).get() as { error_rate: number } | undefined;

  if (baselineErrorRate && currentErrorRate) {
    const changePercent = ((currentErrorRate.error_rate - baselineErrorRate.error_rate) / (baselineErrorRate.error_rate || 1)) * 100;
    comparisons.push({
      metric: 'Error Rate',
      baseline: baselineErrorRate.error_rate,
      current: currentErrorRate.error_rate,
      change_percent: changePercent,
      regressed: changePercent > REGRESSION_THRESHOLD,
    });
  }

  baseline.close();
  current.close();

  return comparisons;
}

function printReport(comparisons: MetricComparison[]): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 REGRESSION CHECK REPORT');
  console.log('='.repeat(80));

  let hasRegression = false;

  for (const comparison of comparisons) {
    const icon = comparison.regressed ? '❌' : '✅';
    const sign = comparison.change_percent > 0 ? '+' : '';

    console.log(`\n${icon} ${comparison.metric}:`);
    console.log(`   Baseline: ${comparison.baseline.toFixed(2)}`);
    console.log(`   Current:  ${comparison.current.toFixed(2)}`);
    console.log(`   Change:   ${sign}${comparison.change_percent.toFixed(1)}%`);

    if (comparison.regressed) {
      console.log(`   ⚠️  REGRESSION: Exceeded ${REGRESSION_THRESHOLD}% threshold`);
      hasRegression = true;
    }
  }

  console.log('\n' + '='.repeat(80));

  if (hasRegression) {
    console.log('\n❌ Regression detected! Performance has degraded.');
    process.exit(1);
  } else {
    console.log('\n✅ No regression detected. All metrics within acceptable range.');
    process.exit(0);
  }
}

// Main execution
const baselineDbPath = path.join(__dirname, '../stress/metrics/baseline.db');
const currentDbPath = path.join(__dirname, '../stress/metrics/stress-test.db');

if (!fs.existsSync(currentDbPath)) {
  console.log('❌ No current stress test results found.');
  console.log('   Run: npm run stress:all');
  process.exit(1);
}

const comparisons = compareMetrics(baselineDbPath, currentDbPath);
printReport(comparisons);
