import { Outlet } from 'react-router-dom';
import { AppShell, Drawer } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ShellSidebar } from '../sidebar/ShellSidebar';
import { ShellHeader } from '../header/ShellHeader';
import { NavContent } from '../nav/NavContent';

export function ShellLayout() {
  const [drawerOpened, { close: closeDrawer, toggle }] = useDisclosure(false);

  return (
    <>
      <AppShell
        header={{ height: { base: 56, sm: 56 } }}
        navbar={{
          width: 260,
          breakpoint: 'sm',
        }}
        padding={{ base: 'sm', sm: 'md' }}
      >
        <ShellHeader mobileMenuOpened={drawerOpened} onMobileMenuToggle={toggle} />
        <ShellSidebar />
        <AppShell.Main>
          <Outlet />
        </AppShell.Main>
      </AppShell>
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        title={null}
        size="260px"
        hiddenFrom="sm"
        padding="md"
        aria-label="Navigation menu"
      >
        <NavContent onNavigate={closeDrawer} />
      </Drawer>
    </>
  );
}
