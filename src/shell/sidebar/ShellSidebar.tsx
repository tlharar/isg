import { AppShell, Select, Text } from '@mantine/core';
import { IconBuilding } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useAppStore } from '@shared/stores/appStore';
import { useCompanyStore } from '@store/companyStore';
import { NavContent } from '../nav/NavContent';

interface ShellSidebarProps {
  /** Called when a nav item is selected (e.g. to close mobile navbar) */
  onCloseMobileNav?: () => void;
}

export function ShellSidebar({ onCloseMobileNav }: ShellSidebarProps) {
  const { t } = useTranslation();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const setSelectedCompanyId = useAppStore((s) => s.setSelectedCompanyId);
  const companies = useCompanyStore((s) => s.companies);

  const companyOptions = [
    { value: '', label: t('common.allCompanies') },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <AppShell.Navbar p="sm">
      {/* Mobile-only Company Select: same state as header, visible only on small screens */}
      <AppShell.Section hiddenFrom="sm" mb="sm">
        <Text fw={500} size="xs" c="dimmed" mb="xs">
          {t('common.company')}
        </Text>
        <Select
          size="sm"
          leftSection={<IconBuilding size={16} />}
          placeholder={t('common.company')}
          data={companyOptions}
          value={selectedCompanyId ?? ''}
          onChange={(v) => setSelectedCompanyId(v === '' ? null : v)}
          clearable={false}
          aria-label={t('common.company')}
          style={{ width: '100%' }}
        />
      </AppShell.Section>
      <AppShell.Section grow component="div" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <NavContent onNavigate={onCloseMobileNav} />
      </AppShell.Section>
    </AppShell.Navbar>
  );
}
