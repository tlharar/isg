import { Outlet } from 'react-router-dom';
import { Box } from '@mantine/core';

/**
 * Company module wrapper: no secondary sidebar.
 * Main sidebar (ShellSidebar) shows Company sub-menu via accordion.
 */
export function CompanyLayout() {
  return (
    <Box>
      <Outlet />
    </Box>
  );
}
