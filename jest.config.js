module.exports = {
    preset: 'react-native',
    setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': ['babel-jest', {
            presets: ['module:@react-native/babel-preset']
        }],
    },
    transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|expo|@expo|@react-navigation|react-i18next|lucide-react-native|@react-native-community)/)',
    ],
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
    },
    collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        'components/**/*.{js,jsx,ts,tsx}',
        'hooks/**/*.{js,jsx,ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/__tests__/**',
    ],
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 60,
            functions: 70,
            lines: 70,
        },
    },
    testMatch: [
        '**/__tests__/**/*.test.{js,jsx,ts,tsx}',
        '**/?(*.)+(spec|test).{js,jsx,ts,tsx}',
    ],
    bail: false,
    verbose: true,
};
