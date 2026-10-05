const frontendConfig = require("./frontend/eslint.config.js");

module.exports = [
  {
    ignores: [
      "backend/**", "games/**", "memory/**", "test_reports/**", "tests/**", "mobile/**", "frasberg-carjack/**",
      "frasberg-secure-runtime/**", "packages/**", "apps/**", "studio/**", "config/**", "scripts/**",
      "provider-kit/**", "selfhost/**", "streaming-server/**", "deployer-agent-docs/**",
      "frontend/build/**", "frontend/node_modules/**", "frontend/plugins/**",
      "node_modules/**", "**/*.min.js",
    ],
  },
  ...frontendConfig.map((c) =>
    c.files ? { ...c, files: c.files.map((f) => `frontend/${f}`) } : c
  ),
];
