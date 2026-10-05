// Telemetry and Metrics Service
import { EventEmitter } from 'events';

export interface Metric {
  name: string;
  value: number;
  labels?: Record<string, string>;
  timestamp: Date;
}

export interface Event {
  type: string;
  tenantId?: string;
  action: string;
  payload: Record<string, any>;
  timestamp: Date;
}

class TelemetryService extends EventEmitter {
  private metrics: Metric[] = [];
  private events: Event[] = [];
  private maxMetrics = 10000;
  private maxEvents = 50000;

  recordMetric(name: string, value: number, labels?: Record<string, string>) {
    const metric: Metric = {
      name,
      value,
      labels,
      timestamp: new Date(),
    };

    this.metrics.push(metric);
    this.emit('metric', metric);

    // Prevent memory overflow
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }
  }

  recordEvent(type: string, action: string, payload: Record<string, any>, tenantId?: string) {
    const event: Event = {
      type,
      action,
      payload,
      tenantId,
      timestamp: new Date(),
    };

    this.events.push(event);
    this.emit('event', event);

    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  getMetrics(startTime?: Date, endTime?: Date): Metric[] {
    let filtered = this.metrics;

    if (startTime) {
      filtered = filtered.filter((m) => m.timestamp >= startTime);
    }

    if (endTime) {
      filtered = filtered.filter((m) => m.timestamp <= endTime);
    }

    return filtered;
  }

  getEvents(type?: string, tenantId?: string): Event[] {
    let filtered = this.events;

    if (type) {
      filtered = filtered.filter((e) => e.type === type);
    }

    if (tenantId) {
      filtered = filtered.filter((e) => e.tenantId === tenantId);
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  getMetricsSummary(name?: string) {
    let metrics = this.metrics;

    if (name) {
      metrics = metrics.filter((m) => m.name === name);
    }

    if (metrics.length === 0) return null;

    const values = metrics.map((m) => m.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;

    return {
      name,
      count: values.length,
      sum,
      avg,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }
}

export const telemetry = new TelemetryService();

// Common metrics
export const metrics = {
  recordRequestLatency: (endpoint: string, latency: number) => {
    telemetry.recordMetric('request_latency_ms', latency, { endpoint });
  },

  recordDbQueryLatency: (query: string, latency: number) => {
    telemetry.recordMetric('db_query_latency_ms', latency, { query: query.slice(0, 50) });
  },

  recordBillingEvent: (kind: string, units: number) => {
    telemetry.recordMetric('billing_event_units', units, { kind });
  },

  recordTenantCreated: (tenantId: string, tier: string, region: string) => {
    telemetry.recordEvent('tenant', 'created', { tier, region }, tenantId);
  },

  recordAcoDecision: (tenantId: string, type: string) => {
    telemetry.recordEvent('aco', 'decision', { type }, tenantId);
  },

  recordHealthUpdate: (tenantId: string, score: number) => {
    telemetry.recordMetric('tenant_health_score', score, { tenantId });
  },

  recordError: (endpoint: string, error: string) => {
    telemetry.recordEvent('error', endpoint, { error });
  },
};

export function getTelemetrySummary() {
  return {
    totalMetrics: telemetry.getMetrics().length,
    totalEvents: telemetry.getEvents().length,
    requestLatency: telemetry.getMetricsSummary('request_latency_ms'),
    dbQueryLatency: telemetry.getMetricsSummary('db_query_latency_ms'),
  };
}
