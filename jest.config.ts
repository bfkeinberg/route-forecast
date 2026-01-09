// jest.config.ts
import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  preset: 'ts-jest', // Enables TypeScript support with ts-jest
  testEnvironment: 'jsdom', // Provides a browser-like environment (Jest 28+ requires separate install)
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'], // Points to the setup file for jest-dom matchers
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'], // Ensures correct file resolution
  // Add other options as needed
  moduleNameMapper: {
    '^Images/(.*)$': '<rootDir>/src/static/$1',
  },
};

export default config;

