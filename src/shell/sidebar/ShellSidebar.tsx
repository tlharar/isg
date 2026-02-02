import { AppShell } from '@mantine/core';
import { NavContent } from '../nav/NavContent';

export function ShellSidebar() {
  return (
    <AppShell.Navbar p="sm">
      <AppShell.Section grow>
        <NavContent />
      </AppShell.Section>
    </AppShell.Navbar>
  );
}
