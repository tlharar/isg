import { AppShell } from '@mantine/core';
import { NavContent } from '../nav/NavContent';

interface ShellSidebarProps {
  /** Called when a nav item is selected (e.g. to close mobile navbar) */
  onCloseMobileNav?: () => void;
}

export function ShellSidebar({ onCloseMobileNav }: ShellSidebarProps) {
  return (
    <AppShell.Navbar p="sm">
      <AppShell.Section grow component="div" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <NavContent onNavigate={onCloseMobileNav} />
      </AppShell.Section>
    </AppShell.Navbar>
  );
}
