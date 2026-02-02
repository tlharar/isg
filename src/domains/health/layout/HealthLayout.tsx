import { Outlet } from 'react-router-dom';
import { Box } from '@mantine/core';

export function HealthLayout() {
  return (
    <Box>
      <Outlet />
    </Box>
  );
}
