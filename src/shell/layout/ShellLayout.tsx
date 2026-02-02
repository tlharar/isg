import { Outlet } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useIdleTimer } from '@shared/hooks/useIdleTimer';
import { ShellHeader } from '../header/ShellHeader';
import { ShellSidebar } from '../sidebar/ShellSidebar';

const IDLE_LOGOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * App layout: header + navbar (sidebar). On mobile, the navbar is collapsed by default
 * and only shown when the hamburger menu is opened. Clicking a nav link closes the menu.
 * Background: light gray (#f8f9fa) for depth; sidebar white with border.
 * Idle session timeout: logs out and redirects to /login after 15 minutes of inactivity.
 */
export function ShellLayout() {
  const [mobileMenuOpened, { close: closeMobileMenu, toggle: toggleMobileMenu }] = useDisclosure(false);

  useIdleTimer(IDLE_LOGOUT_MS);

  return (
    <AppShell
      header={{ height: { base: 56, sm: 56 } }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileMenuOpened },
      }}
      padding={{ base: 'sm', sm: 'md' }}
      styles={{
        root: {
          backgroundColor: 'var(--mantine-color-gray-0)',
        },
        main: {
          backgroundColor: '#f8f9fa',
        },
        navbar: {
          backgroundColor: '#ffffff',
          borderRight: '1px solid var(--mantine-color-default-border)',
        },
      }}
    >
      <ShellHeader
        mobileMenuOpened={mobileMenuOpened}
        onMobileMenuToggle={toggleMobileMenu}
      />
      <ShellSidebar onCloseMobileNav={closeMobileMenu} />
      <AppShell.Main>
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
