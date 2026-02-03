import { Outlet } from 'react-router-dom';
import { Box } from '@mantine/core';

export function CrmLayout() {
  return (
    <Box>
      <Outlet />
    </Box>
  );
}
