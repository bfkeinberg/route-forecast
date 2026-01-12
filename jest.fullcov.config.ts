// jest.config.ts
import type { Config } from '@jest/types';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: Config.InitialOptions = {
    preset: 'ts-jest', // Enables TypeScript support with ts-jest,
    collectCoverage: true,
    collectCoverageFrom: ["src/{jsx,redux,server,utils}/**/*.{js,jsx,ts,tsx}"],
    testEnvironment: 'jsdom', // Provides a browser-like environment (Jest 28+ requires separate install)
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Points to the setup file for jest-dom matchers
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], // Ensures correct file resolution
    // Add other options as needed
    moduleNameMapper: {
        '^Images/(.*)$': '<rootDir>/src/static/$1',
    },
    transform: {
        '^.+\\.(css|scss|sass|less)$': 'jest-transform-css',
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: 'tsconfig.test.json' // Specify the path to your test tsconfig
        }]
    },
    moduleDirectories: [
        'node_modules',
        'src/utils', // Add your utility folder here
        __dirname,
    ],
    testMatch: [
        '**/?(*.)+(test).ts(x)?' // adjust as needed
  ],
};

export default config;

