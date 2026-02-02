import { NavLink, Stack, Text, SegmentedControl, Box } from '@mantine/core';
import { useLocation, Link } from 'react-router-dom';
import {
  IconLayoutDashboard,
  IconAlertTriangle,
  IconUsers,
  IconSchool,
} from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useAppStore } from '@shared/stores/appStore';

const navItems = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: IconLayoutDashboard },
  { to: '/risk', labelKey: 'nav.risk', icon: IconAlertTriangle },
  { to: '/personnel', labelKey: 'nav.personnel', icon: IconUsers },
  { to: '/training', labelKey: 'nav.training', icon: IconSchool },
] as const;

interface NavContentProps {
  onNavigate?: () => void;
  /** When true (mobile drawer), show language switcher at bottom of modules section */
  showLanguageAtBottom?: boolean;
}

export function NavContent({ onNavigate, showLanguageAtBottom }: NavContentProps) {
  const location = useLocation();
  const { t, locale } = useTranslation();
  const setLocale = useAppStore((s) => s.setLocale);

  return (
    <Stack
      gap="md"
      style={
        showLanguageAtBottom
          ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }
          : undefined
      }
    >
      <Box style={showLanguageAtBottom ? { flexShrink: 0 } : undefined}>
        <Text fw={600} size="sm" c="dimmed" px="xs" mb="xs">
          {t('nav.modules')}
        </Text>
        <Stack gap={2}>
          {navItems.map(({ to, labelKey, icon: Icon }) => (
            <NavLink
              key={to}
              component={Link}
              to={to}
              label={t(labelKey)}
              leftSection={<Icon size={20} stroke={1.5} />}
              active={location.pathname === to}
              variant="light"
              onClick={onNavigate}
            />
          ))}
        </Stack>
      </Box>
      {showLanguageAtBottom && (
        <Box pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)', marginTop: 'auto', flexShrink: 0 }}>
          <Text fw={500} size="xs" c="dimmed" mb="xs">
            {t('common.language')}
          </Text>
          <SegmentedControl
            size="sm"
            value={locale}
            onChange={(v) => setLocale(v === 'en' ? 'en' : 'tr')}
            data={[
              { label: t('common.en'), value: 'en' },
              { label: t('common.tr'), value: 'tr' },
            ]}
            aria-label={t('common.language')}
            fullWidth
          />
        </Box>
      )}
    </Stack>
  );
}
