import { Link } from 'react-router-dom';
import {
  AppShell,
  Group,
  useMantineColorScheme,
  ActionIcon,
  Burger,
  SegmentedControl,
  Menu,
  Button,
  Avatar,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSun, IconMoon, IconLogout, IconUser, IconKey } from '@tabler/icons-react';
import { useAppStore } from '@shared/stores/appStore';
import { useAuthStore } from '@shared/stores/authStore';
import { useTranslation } from '@shared/i18n';
import { AccountSettingsModal } from './AccountSettingsModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { CompanySelect } from './CompanySelect';

function getInitials(firstName: string, lastName: string, email: string): string {
  const first = (firstName || '').trim().charAt(0);
  const last = (lastName || '').trim().charAt(0);
  if (first && last) return `${first}${last}`.toUpperCase();
  if (first) return first.toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return '?';
}

function getDisplayName(
  firstName: string,
  lastName: string,
  email: string,
  userFallback: string
): string {
  const full = [firstName, lastName].filter(Boolean).join(' ').trim();
  return full || email || userFallback;
}

interface ShellHeaderProps {
  mobileMenuOpened: boolean;
  onMobileMenuToggle: () => void;
}

export function ShellHeader({ mobileMenuOpened, onMobileMenuToggle }: ShellHeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const setLocale = useAppStore((s) => s.setLocale);
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const { t, locale } = useTranslation();
  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] = useDisclosure(false);
  const [accountModalOpened, { open: openAccountModal, close: closeAccountModal }] = useDisclosure(false);

  const displayName = currentUser
    ? getDisplayName(
        currentUser.firstName,
        currentUser.lastName,
        currentUser.email,
        t('common.user')
      )
    : '';
  const initials = currentUser
    ? getInitials(currentUser.firstName, currentUser.lastName, currentUser.email)
    : '?';

  return (
    <>
      <AppShell.Header
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid var(--mantine-color-gray-2)',
        }}
      >
        <Group h="100%" px="sm" justify="space-between" wrap="nowrap" gap="xs" style={{ position: 'relative' }}>
          <Group wrap="nowrap" gap="xs" style={{ minWidth: 0 }}>
            <Burger
              opened={mobileMenuOpened}
              onClick={onMobileMenuToggle}
              hiddenFrom="sm"
              size="sm"
              aria-label={t('common.menu')}
            />
          </Group>
          <Box
            hiddenFrom="sm"
            style={{
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Link to="/" style={{ display: 'flex', alignItems: 'center' }} aria-label={t('common.appName')}>
              <img
                src="/logo.png"
                alt={t('common.logoAlt')}
                height={36}
                style={{ display: 'block', width: 'auto' }}
              />
            </Link>
          </Box>
          <Group gap="xs" wrap="nowrap">
            <CompanySelect size="xs" visibleFrom="sm" variant="header" />
            <SegmentedControl
              size="xs"
              value={locale}
              onChange={(v) => setLocale(v === 'en' ? 'en' : 'tr')}
              data={[
                { label: t('common.en'), value: 'en' },
                { label: t('common.tr'), value: 'tr' },
              ]}
              aria-label={t('common.language')}
              visibleFrom="sm"
            />
            <ActionIcon
              variant="default"
              size="lg"
              onClick={() => toggleColorScheme()}
              aria-label={t('common.themeToggle')}
              visibleFrom="sm"
            >
              {colorScheme === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ActionIcon>

            <Menu shadow="md" width={220} position="bottom-end" withinPortal>
              <Menu.Target>
                <Button
                  variant="subtle"
                  size="sm"
                  leftSection={<Avatar radius="xl" size="sm" color="cyan">{initials}</Avatar>}
                  style={{ maxWidth: 200 }}
                >
                  <Box visibleFrom="xs" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {displayName || t('common.user')}
                  </Box>
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUser size={14} />} onClick={openAccountModal}>
                  {t('shell.accountInfo')}
                </Menu.Item>
                <Menu.Item leftSection={<IconKey size={14} />} onClick={openPasswordModal}>
                  {t('shell.changePassword')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  color="red"
                  onClick={() => logout()}
                >
                  {t('common.logout')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </AppShell.Header>

      <AccountSettingsModal opened={accountModalOpened} onClose={closeAccountModal} />
      <ChangePasswordModal opened={passwordModalOpened} onClose={closePasswordModal} />
    </>
  );
}
