import { useEffect } from 'react';
import {
  Stack,
  Text,
  Box,
  UnstyledButton,
  Divider,
  Collapse,
  SegmentedControl,
} from '@mantine/core';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useMediaQuery, useDisclosure } from '@mantine/hooks';
import {
  IconLayoutDashboard,
  IconAlertTriangle,
  IconUsers,
  IconSchool,
  IconUsersGroup,
  IconBuildingStore,
  IconBuilding,
  IconChevronDown,
  IconChevronRight,
  IconSitemap,
  IconTruck,
  IconUserCircle,
  IconMail,
} from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useAppStore } from '@shared/stores/appStore';

const mainNavItems = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: IconLayoutDashboard },
  { to: '/risk', labelKey: 'nav.risk', icon: IconAlertTriangle },
  { to: '/personnel', labelKey: 'nav.personnel', icon: IconUsers },
  { to: '/training', labelKey: 'nav.training', icon: IconSchool },
  { to: '/worker', labelKey: 'nav.worker', icon: IconUsersGroup },
  { to: '/customer', labelKey: 'nav.customer', icon: IconBuildingStore },
] as const;

const companySubItems = [
  { to: '/company', end: true, labelKey: 'company.menu.companies', icon: IconBuilding },
  { to: '/company/employees', end: false, labelKey: 'company.menu.employees', icon: IconUsers },
  { to: '/company/units', end: false, labelKey: 'company.menu.units', icon: IconSitemap },
  { to: '/company/subcontractors', end: false, labelKey: 'company.menu.subcontractors', icon: IconTruck },
  { to: '/company/representative', end: false, labelKey: 'company.menu.representative', icon: IconUserCircle },
  { to: '/company/mail-groups', end: false, labelKey: 'company.menu.mailGroups', icon: IconMail },
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

  const isCompanyPath = location.pathname.startsWith('/company');
  const [companyOpen, { toggle: toggleCompany, open: openCompany }] = useDisclosure(isCompanyPath);

  useEffect(() => {
    if (isCompanyPath) openCompany();
  }, [isCompanyPath, openCompany]);

  const handleNavClick = (to: string) => {
    navigate(to);
    onNavigate?.();
  };

  const useClickHandler = Boolean(onNavigate);

  const linkStyle = (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '8px 12px',
    paddingLeft: 36,
    borderRadius: 'var(--mantine-radius-sm)',
    fontWeight: 500,
    fontSize: 'var(--mantine-font-size-sm)',
    backgroundColor: isActive ? 'var(--mantine-primary-light)' : 'transparent',
    color: isActive ? 'var(--mantine-primary-light-color)' : 'var(--mantine-color-text)',
  });

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
          {/* Main nav items - always visible */}
          {mainNavItems.map(({ to, labelKey, icon: Icon }) =>
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
              <UnstyledButton
                key={to}
                component={Link}
                to={to}
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
            )
          )}

          {/* Company Management - accordion parent */}
          <Box>
            <UnstyledButton
              onClick={() => (useClickHandler ? toggleCompany() : toggleCompany())}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--mantine-radius-sm)',
                fontWeight: 500,
                backgroundColor: isCompanyPath ? 'var(--mantine-primary-light)' : 'transparent',
                color: isCompanyPath
                  ? 'var(--mantine-primary-light-color)'
                  : 'var(--mantine-color-text)',
              }}
            >
              <IconBuilding size={20} stroke={1.5} style={{ marginRight: 12, flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: 'left' }}>{t('nav.company')}</span>
              {companyOpen ? (
                <IconChevronDown size={16} style={{ flexShrink: 0 }} />
              ) : (
                <IconChevronRight size={16} style={{ flexShrink: 0 }} />
              )}
            </UnstyledButton>
            <Collapse in={companyOpen}>
              <Stack gap={2} py="xs" pl="xs" style={{ borderLeft: '2px solid var(--mantine-color-default-border)', marginLeft: 8 }}>
                {companySubItems.map(({ to, labelKey, icon: Icon }) => {
                  const active =
                    to === '/company'
                      ? location.pathname === '/company'
                      : location.pathname.startsWith(to);
                  return useClickHandler ? (
                    <UnstyledButton
                      key={to}
                      onClick={() => handleNavClick(to)}
                      style={linkStyle(active)}
                    >
                      <Icon size={18} stroke={1.5} style={{ marginRight: 10, flexShrink: 0 }} />
                      <span>{t(labelKey)}</span>
                    </UnstyledButton>
                  ) : (
                    <UnstyledButton
                      key={to}
                      component={Link}
                      to={to}
                      style={linkStyle(active)}
                    >
                      <Icon size={18} stroke={1.5} style={{ marginRight: 10, flexShrink: 0 }} />
                      <span>{t(labelKey)}</span>
                    </UnstyledButton>
                  );
                })}
              </Stack>
            </Collapse>
          </Box>
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
