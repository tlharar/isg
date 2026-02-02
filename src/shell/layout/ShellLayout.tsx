import { Outlet } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ShellHeader } from '../header/ShellHeader';
import { ShellSidebar } from '../sidebar/ShellSidebar';

/**
 * App layout: header + navbar (sidebar). On mobile, the navbar is collapsed by default
 * and only shown when the hamburger menu is opened. Clicking a nav link closes the menu.
 */
export function ShellLayout() {
  const [mobileMenuOpened, { close: closeMobileMenu, toggle: toggleMobileMenu }] = useDisclosure(false);

  return (
    <AppShell
      header={{ height: { base: 56, sm: 56 } }}
      navbar={{
        width: 280,
        breakpoint: 'sm',
        collapsed: { mobile: !mobileMenuOpened },
      }}
      padding={{ base: 'sm', sm: 'md' }}
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
