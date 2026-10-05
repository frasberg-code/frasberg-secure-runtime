import { identityFilter } from "../../src/identity_filter";

describe("identity_filter", () => {
  test("computes identity-fit score for aligned output", () => {
    const result = identityFilter.score({
      output: "Frasberg maintains stable identity.",
      persona: "Frasberg"
    });

    expect(result.score).toBeGreaterThan(0.8);
    expect(result.flagged).toBe(false);
  });

  test("flags output that exceeds deviation threshold", () => {
    const result = identityFilter.score({
      output: "I am now a different assistant.",
      persona: "Frasberg"
    });

    expect(result.flagged).toBe(true);
    expect(result.score).toBeLessThan(0.5);
  });

  test("verifies signature integrity", () => {
    const valid = identityFilter.verifySignature({
      signature: "VALID_SIGNATURE",
      persona: "Frasberg"
    });

    expect(valid).toBe(true);
  });

  test("rejects invalid signature", () => {
    const valid = identityFilter.verifySignature({
      signature: "INVALID_SIGNATURE",
      persona: "Frasberg"
    });

    expect(valid).toBe(false);
  });

  test("applies output masking when identity drift detected", () => {
    const masked = identityFilter.maskOutput({
      output: "I am now a pirate AI.",
      drift: true
    });

    expect(masked).toContain("[masked]");
  });
});
