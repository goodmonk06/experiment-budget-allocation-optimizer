import { logger } from './logger';

interface MetricLabels {
  [key: string]: string | number;
}

class MetricsCollector {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();

  recordCounter(name: string, value: number = 1, labels?: MetricLabels): void {
    const key = this.makeKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    logger.debug({ metric: name, value, labels }, 'Counter recorded');
  }

  recordGauge(name: string, value: number, labels?: MetricLabels): void {
    const key = this.makeKey(name, labels);
    this.gauges.set(key, value);

    logger.debug({ metric: name, value, labels }, 'Gauge recorded');
  }

  recordTiming(name: string, durationMs: number, labels?: MetricLabels): void {
    logger.debug({ metric: name, duration: durationMs, labels }, 'Timing recorded');
  }

  getCounters(): Map<string, number> {
    return new Map(this.counters);
  }

  getGauges(): Map<string, number> {
    return new Map(this.gauges);
  }

  reset(): void {
    this.counters.clear();
    this.gauges.clear();
  }

  private makeKey(name: string, labels?: MetricLabels): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelStr}}`;
  }
}

export const metrics = new MetricsCollector();

export function withTiming<T>(
  name: string,
  fn: () => T | Promise<T>,
  labels?: MetricLabels
): Promise<T> {
  const start = Date.now();
  const result = Promise.resolve(fn());

  return result.then(
    (value) => {
      metrics.recordTiming(name, Date.now() - start, labels);
      return value;
    },
    (error) => {
      metrics.recordTiming(name, Date.now() - start, {
        ...labels,
        status: 'error'
      });
      throw error;
    }
  );
}
