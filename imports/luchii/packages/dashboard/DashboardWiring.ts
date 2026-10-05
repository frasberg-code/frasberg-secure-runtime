import { ConstitutionalDashboardService, DashboardServiceContext } from "./ConstitutionalDashboardService";
import { ConstitutionalDashboardState } from "./ConstitutionalDashboardTypes";
import { Logger, getLogger } from "../../core/governance/logger";

export class DashboardWiring {
  private logger: Logger;

  constructor(private readonly ctx: DashboardServiceContext) {
    this.logger = getLogger("DashboardWiring");
  }

  wire() {
    this.logger.info("Wiring Constitutional Dashboard into kernel");

    const dashboardService = new ConstitutionalDashboardService(this.ctx);

    // Add dashboard() method to kernel
    (this.ctx.kernel as any).getDashboard = (): ConstitutionalDashboardState => {
      this.logger.debug("Retrieving dashboard state");
      return dashboardService.getState();
    };

    // Add cache invalidation method
    (this.ctx.kernel as any).invalidateDashboardCache = (): void => {
      dashboardService.invalidateCache();
    };

    this.logger.info("Dashboard wiring complete");
    return this.ctx.kernel;
  }
}

export function wireDashboard(ctx: DashboardServiceContext) {
  const wiring = new DashboardWiring(ctx);
  return wiring.wire();
}
