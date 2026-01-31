/**
 * Metrics Reporter for Stress Tests
 *
 * Generates human-readable reports from collected metrics.
 */

import { writeFileSync } from 'fs';
import { MetricsCollector } from './collector';

export interface AlertThresholds {
  chat_p95_ms: number;
  upload_p95_ms: number;
  error_rate_percent: number;
  embedding_rate_limit: number;
  llm_rate_limit: number;
  cache_hit_rate_min: number;
}

export const DEFAULT_THRESHOLDS: AlertThresholds = {
  chat_p95_ms: 10000,           // 10s
  upload_p95_ms: 60000,         // 60s
  error_rate_percent: 5,        // 5%
  embedding_rate_limit: 0.9,    // 90%
  llm_rate_limit: 0.8,          // 80%
  cache_hit_rate_min: 0.3,      // 30%
};

export interface Alert {
  level: 'WARNING' | 'CRITICAL';
  message: string;
  value: number;
  threshold: number;
}

export function checkAlerts(
  collector: MetricsCollector,
  thresholds: AlertThresholds = DEFAULT_THRESHOLDS
): Alert[] {
  const alerts: Alert[] = [];

  // Check P95 latency
  const chatP95 = collector.getPercentile('/api/chat', 95);
  if (chatP95 > thresholds.chat_p95_ms) {
    alerts.push({
      level: 'WARNING',
      message: 'Chat API P95 latency exceeded threshold',
      value: chatP95,
      threshold: thresholds.chat_p95_ms,
    });
  }

  // Check error rate
  const errorRate = collector.getErrorRate();
  if (errorRate > thresholds.error_rate_percent) {
    alerts.push({
      level: errorRate > 10 ? 'CRITICAL' : 'WARNING',
      message: 'Error rate exceeded threshold',
      value: errorRate,
      threshold: thresholds.error_rate_percent,
    });
  }

  // Check rate limit usage
  const voyageUsage = collector.getRateLimitUsage('voyage');
  if (voyageUsage > thresholds.embedding_rate_limit * 100) {
    alerts.push({
      level: 'WARNING',
      message: 'Voyage AI rate limit usage high',
      value: voyageUsage,
      threshold: thresholds.embedding_rate_limit * 100,
    });
  }

  const groqUsage = collector.getRateLimitUsage('groq');
  if (groqUsage > thresholds.llm_rate_limit * 100) {
    alerts.push({
      level: 'WARNING',
      message: 'Groq LLM rate limit usage high',
      value: groqUsage,
      threshold: thresholds.llm_rate_limit * 100,
    });
  }

  return alerts;
}

export function printReport(collector: MetricsCollector): void {
  console.log('\n' + '='.repeat(80));
  console.log('📊 STRESS TEST REPORT');
  console.log('='.repeat(80));

  // API Performance
  console.log('\n🔍 API Performance:');
  console.log('─'.repeat(80));

  const chatP50 = collector.getPercentile('/api/chat', 50);
  const chatP95 = collector.getPercentile('/api/chat', 95);
  const chatP99 = collector.getPercentile('/api/chat', 99);
  const chatErrorRate = collector.getErrorRate('/api/chat');

  console.log(`  /api/chat:`);
  console.log(`    P50: ${formatMs(chatP50)}`);
  console.log(`    P95: ${formatMs(chatP95)}  ${chatP95 > 10000 ? '⚠️  SLOW' : '✓'}`);
  console.log(`    P99: ${formatMs(chatP99)}`);
  console.log(`    Error Rate: ${chatErrorRate.toFixed(2)}%  ${chatErrorRate > 5 ? '⚠️  HIGH' : '✓'}`);

  // Component Breakdown
  console.log('\n⚙️  Component Breakdown:');
  console.log('─'.repeat(80));

  const breakdown = collector.getComponentBreakdown();
  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

  for (const [component, duration] of Object.entries(breakdown).sort((a, b) => b[1] - a[1])) {
    const percent = ((duration / total) * 100).toFixed(1);
    console.log(`  ${component.padEnd(20)} ${formatMs(duration).padStart(10)}  (${percent}%)`);
  }

  // Rate Limit Usage
  console.log('\n🚦 Rate Limit Usage:');
  console.log('─'.repeat(80));

  const voyageUsage = collector.getRateLimitUsage('voyage');
  const groqUsage = collector.getRateLimitUsage('groq');

  console.log(`  Voyage AI:  ${voyageUsage.toFixed(1)}% of 1000 RPM  ${voyageUsage > 90 ? '⚠️  HIGH' : '✓'}`);
  console.log(`  Groq LLM:   ${groqUsage.toFixed(1)}% of 10/min      ${groqUsage > 80 ? '⚠️  HIGH' : '✓'}`);

  // Alerts
  const alerts = checkAlerts(collector);
  if (alerts.length > 0) {
    console.log('\n⚠️  ALERTS:');
    console.log('─'.repeat(80));

    for (const alert of alerts) {
      const icon = alert.level === 'CRITICAL' ? '🔴' : '🟡';
      console.log(`  ${icon} [${alert.level}] ${alert.message}`);
      console.log(`     Value: ${alert.value.toFixed(2)}, Threshold: ${alert.threshold}`);
    }
  } else {
    console.log('\n✅ No alerts - all metrics within thresholds');
  }

  console.log('\n' + '='.repeat(80));
}

function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function exportReportToFile(collector: MetricsCollector, filePath: string): void {
  const report = {
    timestamp: new Date().toISOString(),
    performance: {
      chat: {
        p50: collector.getPercentile('/api/chat', 50),
        p95: collector.getPercentile('/api/chat', 95),
        p99: collector.getPercentile('/api/chat', 99),
        errorRate: collector.getErrorRate('/api/chat'),
      },
    },
    components: collector.getComponentBreakdown(),
    rateLimits: {
      voyage: collector.getRateLimitUsage('voyage'),
      groq: collector.getRateLimitUsage('groq'),
    },
    alerts: checkAlerts(collector),
  };

  writeFileSync(filePath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report exported to: ${filePath}`);
}
