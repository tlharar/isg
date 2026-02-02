import { NavLink, Stack, Text } from '@mantine/core';
import { useLocation, Link } from 'react-router-dom';
import {
  IconLayoutDashboard,
  IconAlertTriangle,
  IconUsers,
  IconSchool,
} from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';

const navItems = [
  { to: '/dashboard', labelKey: 'nav.dashboard', icon: IconLayoutDashboard },
  { to: '/risk', labelKey: 'nav.risk', icon: IconAlertTriangle },
  { to: '/personnel', labelKey: 'nav.personnel', icon: IconUsers },
  { to: '/training', labelKey: 'nav.training', icon: IconSchool },
] as const;

interface NavContentProps {
  onNavigate?: () => void;
}

export function NavContent({ onNavigate }: NavContentProps) {
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <>
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
    </>
  );
}
