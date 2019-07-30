module.exports = {
  roots: ['<rootDir>', '<rootDir>/server', '<rootDir>/client'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  moduleNameMapper: {
    '^@app(.*)$': '<rootDir>/client/src/$1',
    '^@server(.*)$': '<rootDir>/server/src/$1',
    '^@dataTypes$': '<rootDir>/lib/types/dataTypes.ts',
    '^@mocks(.*)$': '<rootDir>/mocks/$1',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': 'identity-obj-proxy',
  },
};
