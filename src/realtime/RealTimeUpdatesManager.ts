import { Server as HTTPServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { Logger, getLogger } from "../../core/governance/logger";

export interface WebSocketMessage {
  type: "dashboard" | "insight" | "recommendation" | "alert";
  timestamp: string;
  data: unknown;
}

export interface DashboardSubscription {
  clientId: string;
  subscriptionTypes: Set<string>;
  lastUpdate: number;
}

export class RealTimeUpdatesManager {
  private io: SocketIOServer;
  private logger: Logger;
  private subscriptions: Map<string, DashboardSubscription> = new Map();
  private messageQueue: WebSocketMessage[] = [];
  private readonly MAX_QUEUE_SIZE = 1000;

  constructor(httpServer: HTTPServer) {
    this.logger = getLogger("RealTimeUpdatesManager");
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
      transports: ["websocket", "polling"],
    });

    this.setupHandlers();
  }

  private setupHandlers() {
    this.io.on("connection", (socket: Socket) => {
      this.logger.info("Client connected", { clientId: socket.id });

      const subscription: DashboardSubscription = {
        clientId: socket.id,
        subscriptionTypes: new Set(["dashboard", "insight"]),
        lastUpdate: Date.now(),
      };

      this.subscriptions.set(socket.id, subscription);

      // Handle subscription updates
      socket.on("subscribe", (types: string[]) => {
        subscription.subscriptionTypes = new Set(types);
        this.logger.debug("Client subscribed to types", { clientId: socket.id, types });
      });

      socket.on("unsubscribe", (types: string[]) => {
        types.forEach((t) => subscription.subscriptionTypes.delete(t));
        this.logger.debug("Client unsubscribed from types", { clientId: socket.id, types });
      });

      // Send recent messages from queue
      socket.on("request-history", (limit: number = 50) => {
        const recent = this.messageQueue.slice(-limit);
        socket.emit("history", recent);
      });

      // Handle heartbeat/ping
      socket.on("ping", () => {
        socket.emit("pong", { timestamp: new Date().toISOString() });
      });

      // Handle disconnection
      socket.on("disconnect", () => {
        this.subscriptions.delete(socket.id);
        this.logger.info("Client disconnected", { clientId: socket.id });
      });

      // Handle errors
      socket.on("error", (error: Error) => {
        this.logger.error("Socket error", error);
      });
    });

    // Heartbeat to keep connections alive
    setInterval(() => {
      this.io.emit("ping", { timestamp: new Date().toISOString() });
    }, 30000); // Every 30 seconds
  }

  broadcastDashboardUpdate(dashboardState: unknown) {
    const message: WebSocketMessage = {
      type: "dashboard",
      timestamp: new Date().toISOString(),
      data: dashboardState,
    };

    this.addToQueue(message);
    this.io.emit("dashboard-update", message);
    this.logger.debug("Dashboard update broadcast");
  }

  broadcastInsight(insight: unknown) {
    const message: WebSocketMessage = {
      type: "insight",
      timestamp: new Date().toISOString(),
      data: insight,
    };

    this.addToQueue(message);
    this.io.emit("insight", message);
    this.logger.info("Insight broadcast");
  }

  broadcastRecommendation(recommendation: unknown) {
    const message: WebSocketMessage = {
      type: "recommendation",
      timestamp: new Date().toISOString(),
      data: recommendation,
    };

    this.addToQueue(message);
    this.io.emit("recommendation", message);
    this.logger.info("Recommendation broadcast");
  }

  broadcastAlert(alert: unknown) {
    const message: WebSocketMessage = {
      type: "alert",
      timestamp: new Date().toISOString(),
      data: alert,
    };

    this.addToQueue(message);
    this.io.emit("alert", message);
    this.logger.warn("Alert broadcast");
  }

  private addToQueue(message: WebSocketMessage) {
    this.messageQueue.push(message);
    if (this.messageQueue.length > this.MAX_QUEUE_SIZE) {
      this.messageQueue.shift();
    }
  }

  getStats() {
    return {
      connectedClients: this.io.engine.clientsCount,
      subscriptions: this.subscriptions.size,
      queuedMessages: this.messageQueue.length,
    };
  }

  getIO(): SocketIOServer {
    return this.io;
  }
}

export function createRealTimeUpdates(httpServer: HTTPServer): RealTimeUpdatesManager {
  return new RealTimeUpdatesManager(httpServer);
}
