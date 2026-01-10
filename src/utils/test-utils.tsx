// src/utils/test-utils.js
import React from 'react';
import { render as testingLibraryRender } from '@testing-library/react';
// Import any providers you need, e.g., a Redux Provider
import { MantineProvider, createTheme, Button } from '@mantine/core';
import classes from "../static/mantine.module.css";

const theme = createTheme({
  components: {
    Button: Button.extend({ classNames: classes }),
  }
});

const customRender = (ui: React.ReactElement) =>
  {
    return testingLibraryRender(<>{ui}</>, {
      wrapper: ({ children }: { children: React.ReactNode }) => {
        return (
        <MantineProvider theme={theme} env="test">
          {children}
        </MantineProvider>
    )},
  })
}

// Re-export everything from the library
export * from '@testing-library/react';

// Override the original render with your custom one
export { customRender as render };
