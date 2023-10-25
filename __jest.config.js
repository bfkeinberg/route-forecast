const config = {
    "collectCoverage": false,
    "collectCoverageFrom": [
      "<rootDir>/src/jsx/**/*.{js,jsx}"
    ],
    "moduleNameMapper": {
      "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga|htm)$": "<rootDir>/__mocks__/fileMock.js",
      "@google-cloud/datastore": "<rootDir>/__mocks__/@google-cloud/datastore.js",
      "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js"
    },
    "testEnvironmentOptions": {
      "url": "http://localhost/"
    },
    "testMatch": [
      "**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(spec|test).[jt]s?(x)"
    ],
    "setupFilesAfterEnv": [
      "./node_modules/jest-enzyme/lib/index.js"
    ],
    "setupFiles": [
      "<rootDir>/setupFile.js"
    ],
    "transform": {
      "\\.[m]?[jt]sx?$": "babel-jest"
    },
    "transformIgnorePatterns": [
      "node_modules/(?!luxon)"
    ]
  }

module.exports = config;
