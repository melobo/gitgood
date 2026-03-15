module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  maxWorkers: 1,
  setupFiles: ['dotenv/config'],

  transform: {
    '^.+\\.(ts|tsx|js)$': 'ts-jest'
  },
};