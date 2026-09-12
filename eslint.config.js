const frontendConfig = require("./frontend/eslint.config.js");

module.exports = [
  {
    ignores: [
      "backend/**", "games/**", "memory/**", "test_reports/**", "tests/**", "mobile/**", "frasberg-carjack/**",
      "frontend/build/**", "frontend/node_modules/**", "frontend/plugins/**",
      "node_modules/**", "**/*.min.js",
    ],
  },
  ...frontendConfig.map((c) =>
    c.files ? { ...c, files: c.files.map((f) => `frontend/${f}`) } : c
  ),
];
