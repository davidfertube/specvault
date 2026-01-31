/**
 * Performance Instrumentation for Stress Testing
 *
 * Provides timing hooks and performance tracking for critical paths.
 */

// Type for global metrics collector interface
interface GlobalWithMetrics {
  metricsCollector?: {
    recordComponent: (data: {
      component: string;
      operation: string;
      durationMs: number;
      success: boolean;
      timestamp: string;
    }) => void;
  };
}

export class PerformanceTracker {
  private timings: Map<string, number[]> = new Map();
  private static instance: PerformanceTracker;

  private constructor() {}

  static getInstance(): PerformanceTracker {
    if (!PerformanceTracker.instance) {
      PerformanceTracker.instance = new PerformanceTracker();
    }
    return PerformanceTracker.instance;
  }

  /**
   * Start a timer and return a function to end it
   * @param label - Label for this timing measurement
   * @returns Function to call when operation completes
   */
  startTimer(label: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;

      if (!this.timings.has(label)) {
        this.timings.set(label, []);
      }

      this.timings.get(label)!.push(duration);

      // Log to metrics collector if available in global scope
      const g = typeof global !== 'undefined' ? global as unknown as GlobalWithMetrics : undefined;
      if (g?.metricsCollector) {
        g.metricsCollector.recordComponent({
          component: label.split('_')[0],
          operation: label,
          durationMs: duration,
          success: true,
          timestamp: new Date().toISOString(),
        });
      }
    };
  }

  /**
   * Get statistics for a specific label
   */
  getStats(label: string): {
    count: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } {
    const times = this.timings.get(label) || [];

    if (times.length === 0) {
      return { count: 0, avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
    }

    const sorted = [...times].sort((a, b) => a - b);

    return {
      count: times.length,
      avg: times.reduce((sum, val) => sum + val, 0) / times.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
    };
  }

  /**
   * Get all collected timings
   */
  getAllStats(): Record<string, ReturnType<typeof this.getStats>> {
    const allStats: Record<string, ReturnType<typeof this.getStats>> = {};

    for (const label of this.timings.keys()) {
      allStats[label] = this.getStats(label);
    }

    return allStats;
  }

  /**
   * Calculate percentile from sorted array
   */
  private percentile(sortedArray: number[], percentile: number): number {
    if (sortedArray.length === 0) return 0;

    const index = Math.ceil((sortedArray.length * percentile) / 100) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Reset all collected timings
   */
  reset(): void {
    this.timings.clear();
  }

  /**
   * Print performance summary
   */
  printSummary(): void {
    console.log('\n📊 Performance Summary:');
    console.log('═'.repeat(80));

    const allStats = this.getAllStats();
    const sortedLabels = Object.keys(allStats).sort(
      (a, b) => allStats[b].avg - allStats[a].avg
    );

    for (const label of sortedLabels) {
      const stats = allStats[label];
      console.log(`\n${label}:`);
      console.log(`  Count: ${stats.count}`);
      console.log(`  Avg:   ${stats.avg.toFixed(2)}ms`);
      console.log(`  P50:   ${stats.p50.toFixed(2)}ms`);
      console.log(`  P95:   ${stats.p95.toFixed(2)}ms`);
      console.log(`  P99:   ${stats.p99.toFixed(2)}ms`);
      console.log(`  Min:   ${stats.min.toFixed(2)}ms`);
      console.log(`  Max:   ${stats.max.toFixed(2)}ms`);
    }

    console.log('\n' + '═'.repeat(80));
  }
}

// Export singleton instance
export const perf = PerformanceTracker.getInstance();

/**
 * Decorator for instrumenting async functions
 */
export function instrument(label: string) {
  return function (
    _target: unknown,
    _propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const endTimer = perf.startTimer(label);
      try {
        return await originalMethod.apply(this, args);
      } finally {
        endTimer();
      }
    };

    return descriptor;
  };
}
