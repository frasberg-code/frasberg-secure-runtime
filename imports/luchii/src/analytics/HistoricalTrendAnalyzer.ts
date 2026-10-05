import { Logger, getLogger } from "../../core/governance/logger";
import { SieInsight, SieRecommendation } from "../../packages/sie/SovereignIntelligenceEngine";

export interface HistoricalRecord {
  timestamp: string;
  systemScore: number;
  insightCount: number;
  criticialInsightCount: number;
  recommendationCount: number;
  corridorHealthAvg: number;
  uptime: number;
  errorRate: number;
}

export interface Trend {
  metric: string;
  direction: "increasing" | "decreasing" | "stable";
  changePercent: number;
  timespan: "1h" | "24h" | "7d" | "30d";
}

export interface Anomaly {
  timestamp: string;
  metric: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: "low" | "medium" | "high";
}

export interface Forecast {
  metric: string;
  timespan: "1h" | "24h" | "7d";
  predictedValue: number;
  confidence: number;
}

export class HistoricalTrendAnalyzer {
  private logger: Logger;
  private records: HistoricalRecord[] = [];
  private readonly MAX_RECORDS = 10080; // 7 days at 1-minute intervals
  private insights: SieInsight[] = [];
  private recommendations: SieRecommendation[] = [];

  constructor() {
    this.logger = getLogger("HistoricalTrendAnalyzer");
  }

  recordSnapshot(data: Partial<HistoricalRecord>) {
    const record: HistoricalRecord = {
      timestamp: new Date().toISOString(),
      systemScore: data.systemScore || 0,
      insightCount: data.insightCount || 0,
      criticialInsightCount: data.criticialInsightCount || 0,
      recommendationCount: data.recommendationCount || 0,
      corridorHealthAvg: data.corridorHealthAvg || 0,
      uptime: data.uptime || 99.9,
      errorRate: data.errorRate || 0,
    };

    this.records.push(record);

    // Maintain max size
    if (this.records.length > this.MAX_RECORDS) {
      this.records.shift();
    }

    this.logger.debug("Snapshot recorded", { systemScore: record.systemScore });
  }

  recordInsight(insight: SieInsight) {
    this.insights.push(insight);
    if (this.insights.length > this.MAX_RECORDS) {
      this.insights.shift();
    }
  }

  recordRecommendation(recommendation: SieRecommendation) {
    this.recommendations.push(recommendation);
    if (this.recommendations.length > this.MAX_RECORDS) {
      this.recommendations.shift();
    }
  }

  getTrends(timespan: "1h" | "24h" | "7d" | "30d" = "24h"): Trend[] {
    const minutes =
      timespan === "1h" ? 60 : timespan === "24h" ? 1440 : timespan === "7d" ? 10080 : 43200;
    const startIndex = Math.max(0, this.records.length - minutes);
    const records = this.records.slice(startIndex);

    if (records.length < 2) {
      return [];
    }

    const trends: Trend[] = [];

    // System score trend
    const scoreStart = records[0].systemScore;
    const scoreEnd = records[records.length - 1].systemScore;
    trends.push({
      metric: "systemScore",
      direction: scoreEnd > scoreStart ? "increasing" : scoreEnd < scoreStart ? "decreasing" : "stable",
      changePercent: ((scoreEnd - scoreStart) / scoreStart) * 100,
      timespan,
    });

    // Error rate trend
    const errorStart = records[0].errorRate;
    const errorEnd = records[records.length - 1].errorRate;
    trends.push({
      metric: "errorRate",
      direction: errorEnd > errorStart ? "increasing" : errorEnd < errorStart ? "decreasing" : "stable",
      changePercent: errorEnd - errorStart,
      timespan,
    });

    // Corridor health trend
    const healthStart = records[0].corridorHealthAvg;
    const healthEnd = records[records.length - 1].corridorHealthAvg;
    trends.push({
      metric: "corridorHealth",
      direction: healthEnd > healthStart ? "increasing" : healthEnd < healthStart ? "decreasing" : "stable",
      changePercent: ((healthEnd - healthStart) / healthStart) * 100,
      timespan,
    });

    // Insight count trend
    const insightStart = records[0].insightCount;
    const insightEnd = records[records.length - 1].insightCount;
    trends.push({
      metric: "insightCount",
      direction: insightEnd > insightStart ? "increasing" : insightEnd < insightStart ? "decreasing" : "stable",
      changePercent: insightEnd - insightStart,
      timespan,
    });

    return trends;
  }

  detectAnomalies(): Anomaly[] {
    const anomalies: Anomaly[] = [];

    if (this.records.length < 10) {
      return anomalies;
    }

    const recent = this.records.slice(-10);
    const avgScore = recent.reduce((sum, r) => sum + r.systemScore, 0) / recent.length;
    const stdDev = Math.sqrt(
      recent.reduce((sum, r) => sum + Math.pow(r.systemScore - avgScore, 2), 0) / recent.length
    );

    // Check each record against mean
    recent.forEach((record) => {
      const deviation = Math.abs(record.systemScore - avgScore);
      if (deviation > stdDev * 2) {
        anomalies.push({
          timestamp: record.timestamp,
          metric: "systemScore",
          expectedValue: avgScore,
          actualValue: record.systemScore,
          deviation,
          severity: deviation > stdDev * 3 ? "high" : "medium",
        });
      }
    });

    return anomalies;
  }

  generateForecast(): Forecast[] {
    const forecasts: Forecast[] = [];

    if (this.records.length < 5) {
      return forecasts;
    }

    // Simple linear regression forecast
    const recent24h = this.records.slice(-1440);
    if (recent24h.length > 0) {
      const avgScore =
        recent24h.reduce((sum, r) => sum + r.systemScore, 0) / recent24h.length;

      forecasts.push({
        metric: "systemScore",
        timespan: "24h",
        predictedValue: Math.min(100, Math.max(0, avgScore + this.getTrendSlope("systemScore"))),
        confidence: 0.75,
      });
    }

    const recent7d = this.records.slice(-10080);
    if (recent7d.length > 0) {
      const avgHealth =
        recent7d.reduce((sum, r) => sum + r.corridorHealthAvg, 0) / recent7d.length;

      forecasts.push({
        metric: "corridorHealth",
        timespan: "7d",
        predictedValue: Math.min(1, Math.max(0, avgHealth + this.getTrendSlope("corridorHealth") * 0.1)),
        confidence: 0.65,
      });
    }

    return forecasts;
  }

  private getTrendSlope(metric: string): number {
    if (this.records.length < 2) return 0;

    const recent = this.records.slice(-60); // Last hour
    if (recent.length < 2) return 0;

    let sum = 0;
    for (let i = 0; i < recent.length; i++) {
      const value =
        metric === "systemScore"
          ? recent[i].systemScore
          : metric === "corridorHealth"
            ? recent[i].corridorHealthAvg
            : 0;
      sum += (value - (i / recent.length) * 50) * 0.01;
    }

    return sum / recent.length;
  }

  getInsightStats(timespan: "1h" | "24h" | "7d" | "30d" = "24h") {
    const minutes =
      timespan === "1h" ? 60 : timespan === "24h" ? 1440 : timespan === "7d" ? 10080 : 43200;
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - minutes);

    const filtered = this.insights.filter((i) => new Date(i.timestamp) > cutoff);

    return {
      total: filtered.length,
      bySeverity: {
        critical: filtered.filter((i) => i.severity === "CRITICAL").length,
        high: filtered.filter((i) => i.severity === "HIGH").length,
        medium: filtered.filter((i) => i.severity === "MEDIUM").length,
        low: filtered.filter((i) => i.severity === "LOW").length,
      },
      byCategory: filtered.reduce(
        (acc, i) => {
          acc[i.category] = (acc[i.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }

  getRecommendationStats(timespan: "1h" | "24h" | "7d" | "30d" = "24h") {
    const minutes =
      timespan === "1h" ? 60 : timespan === "24h" ? 1440 : timespan === "7d" ? 10080 : 43200;
    const cutoff = new Date();
    cutoff.setMinutes(cutoff.getMinutes() - minutes);

    const filtered = this.recommendations.filter((r) => new Date(r.timestamp) > cutoff);

    return {
      total: filtered.length,
      byKind: filtered.reduce(
        (acc, r) => {
          acc[r.kind] = (acc[r.kind] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      ),
    };
  }

  generateReport(timespan: "1h" | "24h" | "7d" | "30d" = "24h") {
    const trends = this.getTrends(timespan);
    const anomalies = this.detectAnomalies();
    const forecast = this.generateForecast();
    const insightStats = this.getInsightStats(timespan);
    const recommendationStats = this.getRecommendationStats(timespan);

    return {
      timespan,
      generatedAt: new Date().toISOString(),
      recordCount: this.records.length,
      trends,
      anomalies,
      forecast,
      insightStats,
      recommendationStats,
    };
  }

  getHistoricalRecords(limit: number = 100): HistoricalRecord[] {
    return this.records.slice(-limit);
  }

  clearHistory() {
    this.records = [];
    this.insights = [];
    this.recommendations = [];
    this.logger.info("History cleared");
  }

  getStats() {
    return {
      recordCount: this.records.length,
      insightCount: this.insights.length,
      recommendationCount: this.recommendations.length,
    };
  }
}

export const analyzer = new HistoricalTrendAnalyzer();
