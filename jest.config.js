module.exports = {
  testEnvironment: 'node',
  transform: { '^.+\\.tsx?$': 'babel-jest' },
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/seeders/**',
    '!src/types/**',
    '!src/models/**',
    '!src/config/**',
  ],
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
