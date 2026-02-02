import { MantineColorsTuple, createTheme } from '@mantine/core';

const turquoise: MantineColorsTuple = [
  '#e6fcfc',
  '#c3faf8',
  '#96f2f0',
  '#63e6e2',
  '#38d9d4',
  '#20c9c3',
  '#14b8ae',
  '#0d9488',
  '#0f766e',
  '#115e59',
];

export const theme = createTheme({
  primaryColor: 'cyan',
  colors: {
    cyan: turquoise,
  },
  fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  headings: {
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    fontWeight: '600',
  },
  defaultRadius: 'md',
  components: {
    Paper: {
      defaultProps: {
        shadow: 'sm',
        radius: 'md',
        withBorder: false,
      },
    },
  },
  other: {
    appBackground: '#f8f9fa',
    sidebarBackground: '#ffffff',
  },
});
