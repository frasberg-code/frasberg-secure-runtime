module.exports = {
  testEnvironment: "jsdom",
  roots: ["<rootDir>/lib"],
  transform: {
    "^.+\.(ts|tsx)$": "ts-jest"
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  testMatch: ["**/__tests__/**/*.test.(ts|tsx|js)"],
  moduleNameMapper: {
    "^@lib/(.*)$": "<rootDir>/lib/$1"
  },
  setupFilesAfterEnv: ["<rootDir>/setupTests.ts"]
};
