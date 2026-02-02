import { Outlet } from 'react-router-dom';
import { Box } from '@mantine/core';

export function ExtraLayout() {
  return (
    <Box>
      <Outlet />
    </Box>
  );
}
