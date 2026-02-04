import { MantineColorsTuple, createTheme, rem, type CSSVariablesResolver } from '@mantine/core';

/** Vibrant Turquoise/Cyan brand color - #00C2CB as main (index 6), readable on light and dark */
const turquoise: MantineColorsTuple = [
  '#e6fffe',
  '#b3f7f6',
  '#80efee',
  '#4de7e6',
  '#26dfde',
  '#00d4d4',
  '#00C2CB',
  '#00a0a8',
  '#007e85',
  '#005c62',
];

/** Dark Sidebar & Light Content: sidebar and app background/text variables */
export const cssVariablesResolver: CSSVariablesResolver = () => ({
  variables: {},
  light: {
    '--sidebar-bg': '#111827',
    '--sidebar-text': '#ffffff',
    '--app-bg': '#f3f4f6',
    '--app-background': '#f3f4f6',
    '--sidebar-background': '#111827',
  },
  dark: {
    '--sidebar-bg': 'var(--mantine-color-dark-8)',
    '--sidebar-text': '#e5e7eb',
    '--app-bg': 'var(--mantine-color-dark-8)',
    '--app-background': 'var(--mantine-color-dark-8)',
    '--sidebar-background': 'var(--mantine-color-dark-9)',
  },
});

export const theme = createTheme({
  primaryColor: 'cyan',
  primaryShade: { light: 6, dark: 5 },
  colors: {
    cyan: turquoise,
  },
  fontFamily: "'Inter', system-ui, sans-serif",
  headings: {
    fontFamily: "'Inter', system-ui, sans-serif",
    fontWeight: '600',
  },
  defaultRadius: 'md',
  radius: {
    xs: rem(4),
    sm: rem(6),
    md: rem(8),
    lg: rem(12),
    xl: rem(16),
  },
  components: {
    AppShell: {
      defaultProps: {
        layout: 'alt',
      },
    },
    Button: {
      defaultProps: {
        radius: 'md',
        size: 'md',
      },
      vars: () => ({
        root: {
          '--button-height': rem(42),
        },
      }),
    },
    Paper: {
      defaultProps: {
        withBorder: true,
        shadow: 'sm',
        radius: 'md',
      },
    },
    Card: {
      defaultProps: {
        withBorder: true,
        shadow: 'sm',
        radius: 'md',
      },
    },
    Table: {
      defaultProps: {
        withTableBorder: true,
        withColumnBorders: true,
        striped: true,
      },
    },
    TextInput: {
      defaultProps: {
        variant: 'filled',
        radius: 'md',
      },
    },
    Select: {
      defaultProps: {
        variant: 'filled',
        radius: 'md',
      },
    },
    NumberInput: {
      defaultProps: {
        variant: 'filled',
        radius: 'md',
      },
    },
    Textarea: {
      defaultProps: {
        variant: 'filled',
        radius: 'md',
      },
    },
    PasswordInput: {
      defaultProps: {
        variant: 'filled',
        radius: 'md',
      },
    },
    NativeSelect: {
      defaultProps: {
        variant: 'filled',
        radius: 'md',
      },
    },
    MultiSelect: {
      defaultProps: {
        variant: 'filled',
        radius: 'md',
      },
    },
    Autocomplete: {
      defaultProps: {
        variant: 'filled',
        radius: 'md',
      },
    },
  },
});
