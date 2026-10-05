import { v4 as uuidv4 } from "uuid";
import { Logger, getLogger } from "../../core/governance/logger";
import { SieInsight } from "../../packages/sie/SovereignIntelligenceEngine";

export interface Alert {
  id: string;
  timestamp: string;
  insight: SieInsight;
  severity: "critical" | "high";
  status: "active" | "acknowledged" | "resolved";
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  notificationChannels: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  enabled: boolean;
  category?: string;
  minSeverity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  deduplicationWindowMs: number;
  escalationPolicy?: {
    minutesToEscalate: number;
    escalateTo: string[];
  };
}

export interface AlertConfig {
  rules: AlertRule[];
  channels: {
    console?: boolean;
    email?: {
      enabled: boolean;
      recipients: string[];
    };
    webhook?: {
      enabled: boolean;
      url: string;
    };
    slack?: {
      enabled: boolean;
      webhookUrl: string;
    };
  };
}

export class AlertEngine {
  private logger: Logger;
  private alerts: Map<string, Alert> = new Map();
  private activeAlerts: Set<string> = new Set();
  private deduplicationMap: Map<string, number> = new Map();
  private config: AlertConfig;
  private alertCallbacks: Set<(alert: Alert) => void> = new Set();

  constructor(config?: Partial<AlertConfig>) {
    this.logger = getLogger("AlertEngine");
    this.config = {
      rules: config?.rules || this.getDefaultRules(),
      channels: config?.channels || {
        console: true,
      },
    };
  }

  private getDefaultRules(): AlertRule[] {
    return [
      {
        id: "rule-compliance",
        name: "Compliance Risk Alert",
        enabled: true,
        category: "COMPLIANCE_RISK",
        minSeverity: "CRITICAL",
        deduplicationWindowMs: 3600000, // 1 hour
      },
      {
        id: "rule-override-pressure",
        name: "Override Pressure Alert",
        enabled: true,
        category: "OVERRIDE_PRESSURE",
        minSeverity: "HIGH",
        deduplicationWindowMs: 1800000, // 30 minutes
        escalationPolicy: {
          minutesToEscalate: 30,
          escalateTo: ["admin", "ops"],
        },
      },
      {
        id: "rule-health-risk",
        name: "Health Risk Alert",
        enabled: true,
        category: "HEALTH_RISK",
        minSeverity: "HIGH",
        deduplicationWindowMs: 900000, // 15 minutes
      },
    ];
  }

  processInsight(insight: SieInsight): Alert | null {
    // Check if this insight should trigger an alert
    const rule = this.findApplicableRule(insight);
    if (!rule || !rule.enabled) {
      return null;
    }

    // Check deduplication
    const insightKey = `${insight.category}-${insight.severity}`;
    const lastAlertTime = this.deduplicationMap.get(insightKey);
    const now = Date.now();

    if (lastAlertTime && now - lastAlertTime < rule.deduplicationWindowMs) {
      this.logger.debug("Alert deduplicated", { insightKey });
      return null;
    }

    // Create alert
    const alert: Alert = {
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      insight,
      severity: insight.severity === "CRITICAL" ? "critical" : "high",
      status: "active",
      notificationChannels: [],
    };

    // Store alert
    this.alerts.set(alert.id, alert);
    this.activeAlerts.add(alert.id);
    this.deduplicationMap.set(insightKey, now);

    // Send notifications
    this.notifyChannels(alert);

    // Trigger callbacks
    this.alertCallbacks.forEach((cb) => cb(alert));

    this.logger.warn("Alert created", { alertId: alert.id, severity: alert.severity });

    return alert;
  }

  private findApplicableRule(insight: SieInsight): AlertRule | null {
    for (const rule of this.config.rules) {
      if (!rule.enabled) continue;

      // Check category
      if (rule.category && rule.category !== insight.category) continue;

      // Check severity
      const severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
      const ruleIndex = severities.indexOf(rule.minSeverity);
      const insightIndex = severities.indexOf(insight.severity);

      if (insightIndex < ruleIndex) continue;

      return rule;
    }

    return null;
  }

  private notifyChannels(alert: Alert) {
    const channels = [];

    if (this.config.channels.console) {
      channels.push("console");
      this.notifyConsole(alert);
    }

    if (this.config.channels.email?.enabled) {
      channels.push("email");
      this.notifyEmail(alert);
    }

    if (this.config.channels.webhook?.enabled) {
      channels.push("webhook");
      this.notifyWebhook(alert);
    }

    if (this.config.channels.slack?.enabled) {
      channels.push("slack");
      this.notifySlack(alert);
    }

    alert.notificationChannels = channels;
  }

  private notifyConsole(alert: Alert) {
    const emoji = alert.severity === "critical" ? "🚨" : "⚠️";
    console.log(`
${emoji} ALERT: ${alert.insight.message}
   ID: ${alert.id}
   Severity: ${alert.severity.toUpperCase()}
   Category: ${alert.insight.category}
    `);
  }

  private notifyEmail(alert: Alert) {
    if (!this.config.channels.email?.recipients.length) return;

    this.logger.info("Email notification sent", {
      recipients: this.config.channels.email.recipients,
      alertId: alert.id,
    });
  }

  private notifyWebhook(alert: Alert) {
    if (!this.config.channels.webhook?.url) return;

    this.logger.info("Webhook notification sent", {
      url: this.config.channels.webhook.url,
      alertId: alert.id,
    });
  }

  private notifySlack(alert: Alert) {
    if (!this.config.channels.slack?.webhookUrl) return;

    this.logger.info("Slack notification sent", {
      alertId: alert.id,
    });
  }

  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = "acknowledged";
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date().toISOString();

    this.logger.info("Alert acknowledged", { alertId, acknowledgedBy });
    return true;
  }

  resolveAlert(alertId: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = "resolved";
    alert.resolvedAt = new Date().toISOString();
    this.activeAlerts.delete(alertId);

    this.logger.info("Alert resolved", { alertId });
    return true;
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts).map((id) => this.alerts.get(id)!);
  }

  getAllAlerts(limit: number = 100): Alert[] {
    return Array.from(this.alerts.values()).slice(-limit);
  }

  getAlertStats() {
    return {
      total: this.alerts.size,
      active: this.activeAlerts.size,
      acknowledged: Array.from(this.alerts.values()).filter(
        (a) => a.status === "acknowledged"
      ).length,
      resolved: Array.from(this.alerts.values()).filter(
        (a) => a.status === "resolved"
      ).length,
    };
  }

  onAlert(callback: (alert: Alert) => void) {
    this.alertCallbacks.add(callback);
  }

  offAlert(callback: (alert: Alert) => void) {
    this.alertCallbacks.delete(callback);
  }

  updateConfig(config: Partial<AlertConfig>) {
    if (config.rules) {
      this.config.rules = config.rules;
    }
    if (config.channels) {
      this.config.channels = { ...this.config.channels, ...config.channels };
    }
    this.logger.info("Alert config updated");
  }
}
