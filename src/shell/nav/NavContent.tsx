import { NavLink, Stack, Text, SegmentedControl, Box, UnstyledButton, Divider } from '@mantine/core';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconLayoutDashboard,
  IconAlertTriangle,
  IconUsers,
  IconSchool,
  IconUsersGroup,
} from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useAppStore } from '@shared/stores/appStore';

const navItems = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: IconLayoutDashboard },
  { to: '/risk', labelKey: 'nav.risk', icon: IconAlertTriangle },
  { to: '/personnel', labelKey: 'nav.personnel', icon: IconUsers },
  { to: '/training', labelKey: 'nav.training', icon: IconSchool },
  { to: '/worker', labelKey: 'nav.worker', icon: IconUsersGroup },
] as const;

interface NavContentProps {
  /** Called when a nav item is clicked (closes mobile navbar) */
  onNavigate?: () => void;
  /** When true, show language switcher at bottom; defaults to true on mobile */
  showLanguageAtBottom?: boolean;
}

export function NavContent({ onNavigate, showLanguageAtBottom: showLanguageAtBottomProp }: NavContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const setLocale = useAppStore((s) => s.setLocale);
  const isMobile = useMediaQuery('(max-width: 47.99em)');
  const showLanguageAtBottom = showLanguageAtBottomProp ?? isMobile;

  const handleNavClick = (to: string) => {
    navigate(to);
    onNavigate?.();
  };

  const useClickHandler = Boolean(onNavigate);

  return (
    <Stack
      gap={showLanguageAtBottom ? 'sm' : 'md'}
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
        {showLanguageAtBottom && <Divider mb="sm" />}
        <Stack gap={showLanguageAtBottom ? 8 : 2}>
          {navItems.map(({ to, labelKey, icon: Icon }) =>
            useClickHandler ? (
              <UnstyledButton
                key={to}
                onClick={() => handleNavClick(to)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 'var(--mantine-radius-sm)',
                  fontWeight: 500,
                  backgroundColor:
                    location.pathname === to ? 'var(--mantine-primary-light)' : 'transparent',
                  color:
                    location.pathname === to
                      ? 'var(--mantine-primary-light-color)'
                      : 'var(--mantine-color-text)',
                }}
              >
                <Icon size={20} stroke={1.5} style={{ marginRight: 12, flexShrink: 0 }} />
                <span>{t(labelKey)}</span>
              </UnstyledButton>
            ) : (
              <NavLink
                key={to}
                component={Link}
                to={to}
                label={t(labelKey)}
                leftSection={<Icon size={20} stroke={1.5} />}
                active={location.pathname === to}
                variant="light"
              />
            )
          )}
        </Stack>
      </Box>
      {showLanguageAtBottom && (
        <Box
          pt="md"
          style={{
            borderTop: '1px solid var(--mantine-color-default-border)',
            marginTop: 'auto',
            flexShrink: 0,
          }}
        >
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
