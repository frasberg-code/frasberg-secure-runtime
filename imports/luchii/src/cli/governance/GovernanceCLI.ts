import { Logger, getLogger } from "../governance/logger";

export interface CLICommand {
  name: string;
  description: string;
  execute(args: string[]): Promise<void>;
  help(): string;
}

export interface CLIContext {
  verbose: boolean;
  format: "json" | "table" | "yaml";
  apiUrl: string;
}

export class GovernanceCLI {
  private commands: Map<string, CLICommand> = new Map();
  private logger: Logger;
  private context: CLIContext;

  constructor() {
    this.logger = getLogger("GovernanceCLI");
    this.context = {
      verbose: false,
      format: "table",
      apiUrl: process.env.GOVERNANCE_API_URL || "http://localhost:3000",
    };
  }

  registerCommand(name: string, command: CLICommand): void {
    this.commands.set(name, command);
    this.logger.info(`Registered command: ${name}`);
  }

  async execute(args: string[]): Promise<void> {
    if (args.length === 0) {
      this.printHelp();
      return;
    }

    // Parse global flags
    const globalFlags = this.parseGlobalFlags(args);
    this.context.verbose = globalFlags.verbose;
    this.context.format = globalFlags.format;

    // Remove global flags from args
    const commandArgs = args.filter(
      (arg) => !arg.startsWith("--") || arg === "--help" || arg === "-h"
    );

    const commandName = commandArgs[0];
    if (
      commandName === "help" ||
      commandName === "--help" ||
      commandName === "-h"
    ) {
      this.printHelp();
      return;
    }

    const command = this.commands.get(commandName);
    if (!command) {
      console.error(`Unknown command: ${commandName}`);
      this.printHelp();
      process.exit(1);
    }

    try {
      await command.execute(commandArgs.slice(1));
    } catch (error) {
      if (this.context.verbose && error instanceof Error) {
        console.error(error);
      } else if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
      }
      process.exit(1);
    }
  }

  private parseGlobalFlags(
    args: string[]
  ): { verbose: boolean; format: "json" | "table" | "yaml" } {
    return {
      verbose: args.includes("--verbose") || args.includes("-v"),
      format: (
        args.includes("--json")
          ? "json"
          : args.includes("--yaml")
            ? "yaml"
            : "table"
      ) as "json" | "table" | "yaml",
    };
  }

  private printHelp(): void {
    console.log(`
Frasberg Governance CLI

Usage: frasberg [global-options] <command> [command-options]

Global Options:
  --verbose, -v     Show verbose output
  --json            Output in JSON format
  --yaml            Output in YAML format
  --help, -h        Show help

Commands:
`);

    const commandList = Array.from(this.commands.entries()).map(
      ([name, cmd]) => `  ${name.padEnd(25)} ${cmd.description}`
    );
    console.log(commandList.join("\n"));

    console.log(`

Examples:
  frasberg gov constitution view
  frasberg gov kernel mode current
  frasberg gov corridor list --json
  frasberg gov simulate constitution-change --verbose

For command help:
  frasberg <command> --help
    `);
  }

  getContext(): CLIContext {
    return this.context;
  }
}
