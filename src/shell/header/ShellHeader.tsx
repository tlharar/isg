import { AppShell, Group, Title, useMantineColorScheme, ActionIcon, Burger, SegmentedControl, Box, Image, Button, Select } from '@mantine/core';
import { IconSun, IconMoon, IconLogout, IconBuilding } from '@tabler/icons-react';
import { useAppStore } from '@shared/stores/appStore';
import { useAuthStore } from '@shared/stores/authStore';
import { useTranslation } from '@shared/i18n';
import { useCompanyStore } from '@store/companyStore';

interface ShellHeaderProps {
  mobileMenuOpened: boolean;
  onMobileMenuToggle: () => void;
}

export function ShellHeader({ mobileMenuOpened, onMobileMenuToggle }: ShellHeaderProps) {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { user, selectedCompanyId, setSelectedCompanyId } = useAppStore();
  const companies = useCompanyStore((s) => s.companies);
  const logout = useAuthStore((s) => s.logout);
  const { t, locale } = useTranslation();
  const setLocale = useAppStore((s) => s.setLocale);

  const companyOptions = [
    { value: '', label: t('common.allCompanies') },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
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
          <Image src="/logo.svg" alt="" w={32} h={32} fit="contain" />
          <Title order={4} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t('appTitle')}
          </Title>
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
          <Button variant="subtle" size="xs" leftSection={<IconLogout size={16} />} onClick={() => logout()} aria-label={t('common.logout')}>
            {t('common.logout')}
          </Button>
          {user && (
            <Box visibleFrom="xs" style={{ maxWidth: 120 }}>
              <Title order={6} c="dimmed" size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.displayName}
              </Title>
            </Box>
          )}
        </Group>
      </Group>
    </AppShell.Header>
  );
}
