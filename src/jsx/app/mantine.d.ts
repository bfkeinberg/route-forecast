// mantine.d.ts
import { ButtonVariant } from '@mantine/core';

type ExtendedButtonVariant = ButtonVariant | 'warning' | 'success' | 'active';

declare module '@mantine/core' {
  export interface ButtonProps {
    variant?: ExtendedButtonVariant;
  }
}
