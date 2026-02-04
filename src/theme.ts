import { MantineColorsTuple, createTheme } from '@mantine/core';

/** Vibrant Turquoise/Cyan brand color - #00C2CB as main (index 6) */
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

export const theme = createTheme({
  primaryColor: 'cyan',
  colors: {
    cyan: turquoise,
  },
  fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  headings: {
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    fontWeight: '700',
  },
  defaultRadius: 'md',
  components: {
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
  },
});
