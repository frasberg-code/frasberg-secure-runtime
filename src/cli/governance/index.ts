#!/usr/bin/env node

import { GovernanceCLI } from "./GovernanceCLI";
import {
  ViewConstitutionCommand,
  GetKernelModeCommand,
  TransitionKernelModeCommand,
  ListCorridorsCommand,
  FreezeCorridorCommand,
  ListOverridesCommand,
  IssueOverrideCommand,
  QueryTelemetryCommand,
  SimulateConstitutionChangeCommand,
} from "./commands";
import {
  ListInsightsCommand,
  ShowCriticalInsightsCommand,
  ListRecommendationsCommand,
  ViewDashboardCommand,
  ShowSystemScoreCommand,
  ShowCorridorHealthCommand,
} from "./insights-commands";
import { Logger, getLogger } from "../governance/logger";

const logger = getLogger("FrasbergCLI");

async function main() {
  const cli = new GovernanceCLI();

  // Constitution commands
  cli.registerCommand(
    "gov constitution view",
    new ViewConstitutionCommand()
  );

  // Kernel mode commands
  cli.registerCommand(
    "gov kernel mode current",
    new GetKernelModeCommand()
  );
  cli.registerCommand(
    "gov kernel mode transition",
    new TransitionKernelModeCommand()
  );

  // Corridor commands
  cli.registerCommand("gov corridor list", new ListCorridorsCommand());
  cli.registerCommand("gov corridor freeze", new FreezeCorridorCommand());

  // Override commands
  cli.registerCommand("gov override list", new ListOverridesCommand());
  cli.registerCommand("gov override issue", new IssueOverrideCommand());

  // Query commands
  cli.registerCommand(
    "gov query telemetry",
    new QueryTelemetryCommand()
  );

  // Simulation commands
  cli.registerCommand(
    "gov simulate constitution-change",
    new SimulateConstitutionChangeCommand()
  );

  // Insight commands
  cli.registerCommand("insights list", new ListInsightsCommand());
  cli.registerCommand("insights critical", new ShowCriticalInsightsCommand());

  // Recommendation commands
  cli.registerCommand("recommendations list", new ListRecommendationsCommand());

  // Dashboard commands
  cli.registerCommand("dashboard view", new ViewDashboardCommand());
  cli.registerCommand("dashboard score", new ShowSystemScoreCommand());
  cli.registerCommand("dashboard health", new ShowCorridorHealthCommand());

  try {
    const args = process.argv.slice(2);
    await cli.execute(args);
  } catch (error) {
    if (error instanceof Error) {
      logger.error("CLI execution failed", error);
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

main();
