const glob = require('glob');

const listOfTestFiles = glob.sync('src/**/*.spec.*');
const listOfTestedFiles = listOfTestFiles.map((file) => file.replace('.spec.', '.'));

// jest.config.js
module.exports = {
  preset: 'ts-jest',
  collectCoverage: true,
  collectCoverageFrom: listOfTestedFiles,
  globals: {
    'ts-jest': {
      diagnostics: {
        warnOnly: true,
      },
    },
  },
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 0,
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
};
