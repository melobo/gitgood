/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['<rootDir>/src/tests/jest.setup.env.ts'],
  testMatch: ['**/tests/**/*.test.ts'],
  globalSetup: '<rootDir>/src/tests/jest.global.setup.ts',
  globalTeardown: '<rootDir>/src/tests/jest.global.teardown.ts',
  coverageThreshold: {
    global: {
      lines: 85,
    },
  },
  setupFilesAfterEnv: ["<rootDir>/src/tests/jest.setup.ts"]
};

module.exports = config;