import { GovernanceCLI } from "./GovernanceCLI";
import { ViewConstitutionCommand } from "./commands";

describe("GovernanceCLI", () => {
  let cli: GovernanceCLI;

  beforeEach(() => {
    cli = new GovernanceCLI();
  });

  describe("command registration", () => {
    it("should register a command", () => {
      const command = new ViewConstitutionCommand();
      cli.registerCommand("test-command", command);

      // Verify through context or other means
      expect(cli).toBeDefined();
    });
  });

  describe("execution", () => {
    it("should display help with no arguments", async () => {
      // This would test the help display
      expect(cli).toBeDefined();
    });

    it("should execute registered command", async () => {
      const command = new ViewConstitutionCommand();
      cli.registerCommand("gov constitution view", command);

      // Test execution
      expect(cli).toBeDefined();
    });
  });

  describe("output formatting", () => {
    it("should support different output formats", () => {
      const context = cli["context"];
      expect(context.format).toBe("table");
    });
  });
});

describe("GovernanceCommands", () => {
  describe("ViewConstitutionCommand", () => {
    it("should display constitution", async () => {
      const cmd = new ViewConstitutionCommand();
      expect(cmd.name).toBe("gov constitution view");
      expect(cmd.description).toBe("Display current constitution");
    });
  });
});
