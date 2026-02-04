import { Link } from 'react-router-dom';
import {
  AppShell,
  Group,
  useMantineColorScheme,
  ActionIcon,
  Burger,
  SegmentedControl,
  Select,
  Text,
  Menu,
  Button,
  Avatar,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconSun, IconMoon, IconLogout, IconBuilding, IconUser, IconKey } from '@tabler/icons-react';
import { useAppStore } from '@shared/stores/appStore';
import { useAuthStore } from '@shared/stores/authStore';
import { useTranslation } from '@shared/i18n';
import { useCompanyStore } from '@store/companyStore';
import { AccountSettingsModal } from './AccountSettingsModal';
import { ChangePasswordModal } from './ChangePasswordModal';

/** Brand colors for ÖZARTEK dual-tone text */
const BRAND_TURQUOISE = '#00C2CB';
const BRAND_TEAL = '#006064';

function getInitials(firstName: string, lastName: string, email: string): string {
  const first = (firstName || '').trim().charAt(0);
  const last = (lastName || '').trim().charAt(0);
  if (first && last) return `${first}${last}`.toUpperCase();
  if (first) return first.toUpperCase();
  if (email) return email.charAt(0).toUpperCase();
  return '?';
}

function getDisplayName(firstName: string, lastName: string, email: string): string {
  const full = [firstName, lastName].filter(Boolean).join(' ').trim();
  return full || email || 'Kullanıcı';
}

interface ShellHeaderProps {
  mobileMenuOpened: boolean;
  onMobileMenuToggle: () => void;
}

export function ShellHeader({ mobileMenuOpened, onMobileMenuToggle }: ShellHeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const setSelectedCompanyId = useAppStore((s) => s.setSelectedCompanyId);
  const setLocale = useAppStore((s) => s.setLocale);
  const companies = useCompanyStore((s) => s.companies);
  const currentUser = useAuthStore((s) => s.currentUser);
  const logout = useAuthStore((s) => s.logout);
  const { t, locale } = useTranslation();
  const [passwordModalOpened, { open: openPasswordModal, close: closePasswordModal }] = useDisclosure(false);
  const [accountModalOpened, { open: openAccountModal, close: closeAccountModal }] = useDisclosure(false);

  const companyOptions = [
    { value: '', label: t('common.allCompanies') },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  const displayName = currentUser
    ? getDisplayName(currentUser.firstName, currentUser.lastName, currentUser.email)
    : '';
  const initials = currentUser
    ? getInitials(currentUser.firstName, currentUser.lastName, currentUser.email)
    : '?';

  return (
    <>
      <AppShell.Header>
        <Group h="100%" px="sm" justify="space-between" wrap="nowrap" gap="xs">
          <Group wrap="nowrap" gap="xs" style={{ minWidth: 0 }}>
            <Burger
              opened={mobileMenuOpened}
              onClick={onMobileMenuToggle}
              hiddenFrom="sm"
              size="sm"
              aria-label={t('common.menu')}
            />
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none',
                cursor: 'pointer',
              }}
              aria-label={t('appTitle')}
            >
              <Group wrap="nowrap" gap={6} style={{ minWidth: 0 }}>
                <img
                  src="/logo.png"
                  alt="Özartek Logo"
                  height={50}
                  style={{ display: 'block', flexShrink: 0, width: 'auto' }}
                />
                <Text
                  component="span"
                  fw={700}
                  style={{
                    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
                    fontSize: 'var(--mantine-h4-font-size)',
                    lineHeight: 1.2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                  }}
                >
                  <Text component="span" inherit style={{ color: BRAND_TURQUOISE }}>
                    ÖZAR
                  </Text>
                  <Text component="span" inherit style={{ color: BRAND_TEAL }}>
                    TEK
                  </Text>
                </Text>
              </Group>
            </Link>
          </Group>
          <Group gap="xs" wrap="nowrap">
            <Select
              size="xs"
              leftSection={<IconBuilding size={14} />}
              placeholder={t('common.company')}
              data={companyOptions}
              value={selectedCompanyId ?? ''}
              onChange={(v) => setSelectedCompanyId(v === '' ? null : v)}
              clearable={false}
              style={{ minWidth: 140 }}
              visibleFrom="sm"
              aria-label={t('common.company')}
            />
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
                    {displayName || 'Kullanıcı'}
                  </Box>
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUser size={14} />} onClick={openAccountModal}>
                  Hesap Bilgileri
                </Menu.Item>
                <Menu.Item leftSection={<IconKey size={14} />} onClick={openPasswordModal}>
                  Şifre Değiştir
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size={14} />}
                  color="red"
                  onClick={() => logout()}
                >
                  Çıkış Yap
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
