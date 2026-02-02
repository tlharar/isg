import { Outlet } from 'react-router-dom';
import { Box } from '@mantine/core';

export function SafetyLayout() {
  return (
    <Box>
      <Outlet />
    </Box>
  );
}
