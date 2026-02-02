import { Outlet } from 'react-router-dom';
import { Box } from '@mantine/core';

export function ArchiveLayout() {
  return (
    <Box>
      <Outlet />
    </Box>
  );
}
