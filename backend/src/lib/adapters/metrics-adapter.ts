import { logger } from '../logger';

export interface MetricData {
  name: string;
  value: number;
  labels?: Record<string, string | number>;
  timestamp?: Date;
}

export interface IMetricsAdapter {
  recordCounter(metric: MetricData): Promise<void>;
  recordGauge(metric: MetricData): Promise<void>;
  recordHistogram(metric: MetricData): Promise<void>;
  isConfigured(): boolean;
}

// In-memory metrics adapter (default)
export class InMemoryMetricsAdapter implements IMetricsAdapter {
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();

  async recordCounter(metric: MetricData): Promise<void> {
    const key = this.makeKey(metric.name, metric.labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + metric.value);

    logger.debug({ metric: metric.name, value: metric.value }, 'Counter recorded');
  }

  async recordGauge(metric: MetricData): Promise<void> {
    const key = this.makeKey(metric.name, metric.labels);
    this.gauges.set(key, metric.value);

    logger.debug({ metric: metric.name, value: metric.value }, 'Gauge recorded');
  }

  async recordHistogram(metric: MetricData): Promise<void> {
    logger.debug({ metric: metric.name, value: metric.value }, 'Histogram recorded');
  }

  isConfigured(): boolean {
    return true;
  }

  getCounters(): Map<string, number> {
    return new Map(this.counters);
  }

  getGauges(): Map<string, number> {
    return new Map(this.gauges);
  }

  private makeKey(name: string, labels?: Record<string, string | number>): string {
    if (!labels) return name;
    const labelStr = Object.entries(labels)
      .map(([k, v]) => `${k}=${v}`)
      .join(',');
    return `${name}{${labelStr}}`;
  }
}

// Datadog metrics adapter (stub)
export class DatadogMetricsAdapter implements IMetricsAdapter {
  constructor(private apiKey: string, private appKey: string) {}

  async recordCounter(metric: MetricData): Promise<void> {
    logger.debug(
      { metric: metric.name, value: metric.value },
      '[DATADOG COUNTER - STUB]'
    );
  }

  async recordGauge(metric: MetricData): Promise<void> {
    logger.debug(
      { metric: metric.name, value: metric.value },
      '[DATADOG GAUGE - STUB]'
    );
  }

  async recordHistogram(metric: MetricData): Promise<void> {
    logger.debug(
      { metric: metric.name, value: metric.value },
      '[DATADOG HISTOGRAM - STUB]'
    );
  }

  isConfigured(): boolean {
    return !!(this.apiKey && this.appKey);
  }
}

// Prometheus metrics adapter (stub)
export class PrometheusMetricsAdapter implements IMetricsAdapter {
  private metrics: string[] = [];

  async recordCounter(metric: MetricData): Promise<void> {
    const line = this.formatPrometheusMetric('counter', metric);
    this.metrics.push(line);
    logger.debug({ metric: metric.name }, '[PROMETHEUS COUNTER]');
  }

  async recordGauge(metric: MetricData): Promise<void> {
    const line = this.formatPrometheusMetric('gauge', metric);
    this.metrics.push(line);
    logger.debug({ metric: metric.name }, '[PROMETHEUS GAUGE]');
  }

  async recordHistogram(metric: MetricData): Promise<void> {
    const line = this.formatPrometheusMetric('histogram', metric);
    this.metrics.push(line);
    logger.debug({ metric: metric.name }, '[PROMETHEUS HISTOGRAM]');
  }

  isConfigured(): boolean {
    return true;
  }

  getMetrics(): string {
    return this.metrics.join('\n');
  }

  private formatPrometheusMetric(type: string, metric: MetricData): string {
    const labels = metric.labels
      ? Object.entries(metric.labels)
          .map(([k, v]) => `${k}="${v}"`)
          .join(',')
      : '';

    return `${metric.name}${labels ? `{${labels}}` : ''} ${metric.value}`;
  }
}

// Metrics service
export class MetricsService {
  private adapters: IMetricsAdapter[] = [];

  constructor() {
    // Default to in-memory adapter
    this.adapters.push(new InMemoryMetricsAdapter());
  }

  addAdapter(adapter: IMetricsAdapter): void {
    if (adapter.isConfigured()) {
      this.adapters.push(adapter);
      logger.info({ adapter: adapter.constructor.name }, 'Metrics adapter added');
    }
  }

  async recordCounter(name: string, value: number = 1, labels?: Record<string, string | number>): Promise<void> {
    const metric: MetricData = { name, value, labels };
    const promises = this.adapters.map((adapter) => adapter.recordCounter(metric));
    await Promise.all(promises);
  }

  async recordGauge(name: string, value: number, labels?: Record<string, string | number>): Promise<void> {
    const metric: MetricData = { name, value, labels };
    const promises = this.adapters.map((adapter) => adapter.recordGauge(metric));
    await Promise.all(promises);
  }

  async recordHistogram(name: string, value: number, labels?: Record<string, string | number>): Promise<void> {
    const metric: MetricData = { name, value, labels };
    const promises = this.adapters.map((adapter) => adapter.recordHistogram(metric));
    await Promise.all(promises);
  }
}

export const metricsService = new MetricsService();
