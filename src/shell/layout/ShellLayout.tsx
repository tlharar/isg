import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuthStore } from '@shared/stores/authStore';
import { useIdleTimer } from '@shared/hooks/useIdleTimer';
import { ShellHeader } from '../header/ShellHeader';
import { ShellSidebar } from '../sidebar/ShellSidebar';

const IDLE_LOGOUT_MS = 15 * 60 * 1000; // 15 minutes
const ACCOUNT_EXPIRY_WARNING_KEY = 'account-expiry-warning-shown';

function daysUntilExpiry(expiryDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  return Math.floor((expiry.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * App layout: header + navbar (sidebar). On mobile, the navbar is collapsed by default
 * and only shown when the hamburger menu is opened. Clicking a nav link closes the menu.
 * Backgrounds use --app-background and --sidebar-background (set by cssVariablesResolver in main.tsx) so light/dark mode both work.
 * Idle session timeout: logs out and redirects to /login after 15 minutes of inactivity.
 * Shows a one-per-session warning when account expires within 7 days.
 */
export function ShellLayout() {
  const currentUser = useAuthStore((s) => s.currentUser);
  const [mobileMenuOpened, { close: closeMobileMenu, toggle: toggleMobileMenu }] = useDisclosure(false);

  useIdleTimer(IDLE_LOGOUT_MS);

  useEffect(() => {
    if (!currentUser?.accountExpiryDate) return;
    const expiry = new Date(currentUser.accountExpiryDate);
    if (Number.isNaN(expiry.getTime())) return;
    const daysLeft = daysUntilExpiry(expiry);
    if (daysLeft <= 0 || daysLeft > 7) return;
    if (sessionStorage.getItem(ACCOUNT_EXPIRY_WARNING_KEY) === '1') return;
    sessionStorage.setItem(ACCOUNT_EXPIRY_WARNING_KEY, '1');
    notifications.show({
      title: 'Hesap Süresi Dolmak Üzere',
      message: `Hesabınızın kullanım süresinin dolmasına ${daysLeft} gün kalmıştır. Kesinti yaşamamak için lütfen yöneticinizle iletişime geçiniz.`,
      color: 'yellow',
      icon: <IconAlertCircle size={20} />,
      autoClose: 8000,
    });
  }, [currentUser]);

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
          backgroundColor: 'var(--app-bg)',
        },
        main: {
          backgroundColor: 'var(--app-bg)',
        },
        navbar: {
          backgroundColor: 'var(--sidebar-bg)',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
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
