module.exports = {
  roots: ['<rootDir>/server', '<rootDir>/client'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@app(.*)$': '<rootDir>/client/src/$1',
    '^@server(.*)$': '<rootDir>/server/src/$1',
    '^@dataTypes$': '<rootDir>/lib/types/dataTypes.ts',
  },
};
