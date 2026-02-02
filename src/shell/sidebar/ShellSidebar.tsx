import { AppShell, Box } from '@mantine/core';
import { NavContent } from '../nav/NavContent';

interface ShellSidebarProps {
  /** Called when a nav item is selected (e.g. to close mobile navbar) */
  onCloseMobileNav?: () => void;
}

/**
 * ShellSidebar: Fixed-height flex column layout
 * Structure: [Header (fixed)] [ScrollArea (flex: 1)] [Footer (fixed)]
 */
export function ShellSidebar({ onCloseMobileNav }: ShellSidebarProps) {
  return (
    <AppShell.Navbar
      p={0}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <NavContent onNavigate={onCloseMobileNav} />
      </Box>
    </AppShell.Navbar>
  );
}
