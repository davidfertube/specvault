/**
 * Metrics Collector for Stress Tests
 *
 * Stores performance metrics in SQLite for analysis and regression tracking.
 */

import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface RequestMetric {
  endpoint: string;
  method: string;
  statusCode: number;
  durationMs: number;
  timestamp: string;
}

export interface ComponentMetric {
  component: string;
  operation: string;
  durationMs: number;
  success: boolean;
  metadata?: Record<string, string | number | boolean | null>;
  timestamp: string;
}

export class MetricsCollector {
  private db: Database.Database;
  private runId: number;
  private scenario: string;

  constructor(scenario: string, dbPath: string = './tests/stress/metrics/stress-test.db') {
    this.scenario = scenario;

    // Initialize database
    this.db = new Database(dbPath);
    this.db.pragma('journal_mode = WAL');

    // Load schema
    const schemaPath = join(__dirname, 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');
    this.db.exec(schema);

    // Create test run
    this.runId = this.createRun();
  }

  private createRun(): number {
    const stmt = this.db.prepare(`
      INSERT INTO test_runs (timestamp, scenario, git_commit, duration_ms)
      VALUES (?, ?, ?, 0)
    `);

    const result = stmt.run(
      new Date().toISOString(),
      this.scenario,
      process.env.GIT_COMMIT || 'unknown'
    );

    return result.lastInsertRowid as number;
  }

  recordRequest(metric: RequestMetric): void {
    const stmt = this.db.prepare(`
      INSERT INTO request_metrics (run_id, endpoint, method, status_code, duration_ms, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      this.runId,
      metric.endpoint,
      metric.method,
      metric.statusCode,
      metric.durationMs,
      metric.timestamp
    );
  }

  recordComponent(metric: ComponentMetric): void {
    const stmt = this.db.prepare(`
      INSERT INTO component_metrics (run_id, component, operation, duration_ms, success, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      this.runId,
      metric.component,
      metric.operation,
      metric.durationMs,
      metric.success ? 1 : 0,
      metric.metadata ? JSON.stringify(metric.metadata) : null,
      metric.timestamp
    );
  }

  getPercentile(endpoint: string, percentile: number): number {
    const stmt = this.db.prepare(`
      SELECT duration_ms FROM request_metrics
      WHERE run_id = ? AND endpoint = ?
      ORDER BY duration_ms
      LIMIT 1 OFFSET (
        SELECT CAST(COUNT(*) * ? / 100.0 AS INTEGER) FROM request_metrics
        WHERE run_id = ? AND endpoint = ?
      )
    `);

    const result = stmt.get(this.runId, endpoint, percentile, this.runId, endpoint) as { duration_ms: number } | undefined;
    return result?.duration_ms || 0;
  }

  getErrorRate(endpoint?: string): number {
    const whereClause = endpoint ? 'AND endpoint = ?' : '';
    const params = endpoint ? [this.runId, endpoint] : [this.runId];

    const stmt = this.db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status_code >= 400 THEN 1 ELSE 0 END) as errors
      FROM request_metrics
      WHERE run_id = ? ${whereClause}
    `);

    const result = stmt.get(...params) as { total: number; errors: number };

    if (result.total === 0) return 0;
    return (result.errors / result.total) * 100;
  }

  getComponentAvg(component: string): number {
    const stmt = this.db.prepare(`
      SELECT AVG(duration_ms) as avg_duration
      FROM component_metrics
      WHERE run_id = ? AND component = ?
    `);

    const result = stmt.get(this.runId, component) as { avg_duration: number } | undefined;
    return result?.avg_duration || 0;
  }

  getRateLimitUsage(service: 'voyage' | 'groq'): number {
    // Calculate based on component metrics
    const component = service === 'voyage' ? 'embedding_api' : 'llm';

    const stmt = this.db.prepare(`
      SELECT COUNT(*) as call_count
      FROM component_metrics
      WHERE run_id = ? AND component = ?
      AND datetime(timestamp) >= datetime('now', '-1 minute')
    `);

    const result = stmt.get(this.runId, component) as { call_count: number };

    // Calculate percentage of rate limit
    const limit = service === 'voyage' ? 1000 : 10; // RPM limits
    return (result.call_count / limit) * 100;
  }

  getComponentBreakdown(): Record<string, number> {
    const stmt = this.db.prepare(`
      SELECT component, AVG(duration_ms) as avg_duration
      FROM component_metrics
      WHERE run_id = ?
      GROUP BY component
    `);

    const results = stmt.all(this.runId) as Array<{ component: string; avg_duration: number }>;

    const breakdown: Record<string, number> = {};
    for (const result of results) {
      breakdown[result.component] = Math.round(result.avg_duration);
    }

    return breakdown;
  }

  finishRun(durationMs: number): void {
    const stmt = this.db.prepare(`
      UPDATE test_runs
      SET duration_ms = ?
      WHERE id = ?
    `);

    stmt.run(durationMs, this.runId);
  }

  close(): void {
    this.db.close();
  }
}
