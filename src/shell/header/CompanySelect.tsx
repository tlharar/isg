import {
  Group,
  Select,
  Menu,
  ActionIcon,
  Badge,
  Loader,
} from '@mantine/core';
import { IconBuilding, IconSitemap, IconX } from '@tabler/icons-react';
import { useAppStore } from '@shared/stores/appStore';
import { useTranslation } from '@shared/i18n';
import { useCompanyStore } from '@store/companyStore';

const EMPTY_OPTIONS: { value: string; label: string }[] = [{ value: '', label: 'Tüm Firmalar' }];

interface CompanySelectProps {
  /** Compact for header, 'full' for sidebar */
  size?: 'xs' | 'sm';
  /** Hide on small screens (e.g. header) */
  visibleFrom?: 'sm' | 'xs' | never;
  /** Use in sidebar (mobile) - no visibleFrom */
  variant?: 'header' | 'sidebar';
}

/**
 * Crash-proof company selector: main companies + optional sub-contractor menu.
 * Uses strict default values so Mantine Select never receives undefined/null.
 * Icons: IconBuilding, IconSitemap, IconX (no invalid exports).
 */
export function CompanySelect({ size = 'xs', visibleFrom = 'sm', variant = 'header' }: CompanySelectProps) {
  const { t } = useTranslation();
  const selectedMainCompanyId = useAppStore((s) => s?.selectedMainCompanyId ?? null);
  const selectedSubCompanyId = useAppStore((s) => s?.selectedSubCompanyId ?? null);
  const setSelectedMainCompany = useAppStore((s) => s?.setSelectedMainCompany);
  const setSelectedSubCompany = useAppStore((s) => s?.setSelectedSubCompany);
  const getMainCompanies = useCompanyStore((s) => s?.getMainCompanies);
  const getSubContractorCompanies = useCompanyStore((s) => s?.getSubContractorCompanies);
  const getCompanyById = useCompanyStore((s) => s?.getCompanyById);

  if (getMainCompanies == null || setSelectedMainCompany == null) {
    return <Loader type="oval" size={size} style={{ minWidth: 80 }} />;
  }

  const mainCompanies = (() => {
    try {
      const list = getMainCompanies?.();
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  })();

  const mainCompanyOptions: { value: string; label: string }[] = (() => {
    try {
      const allLabel = (t && typeof t === 'function' ? t('common.allCompanies') : null) ?? 'Tüm Firmalar';
      const mapped = mainCompanies
        ?.filter((c) => c != null)
        ?.map((c) => ({ value: String(c?.id ?? ''), label: String(c?.name ?? '') }))
        ?.filter((o) => o.value !== '') ?? [];
      const opts = [{ value: '', label: allLabel }, ...mapped];
      return opts.length > 0 ? opts : EMPTY_OPTIONS;
    } catch {
      return EMPTY_OPTIONS;
    }
  })();

  const subContractors = (() => {
    if (selectedMainCompanyId == null || selectedMainCompanyId === '') return [];
    try {
      const list = getSubContractorCompanies?.(selectedMainCompanyId);
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  })();

  const hasSubContractors = (subContractors?.length ?? 0) > 0;
  const selectedSubName =
    selectedSubCompanyId != null && selectedSubCompanyId !== ''
      ? (getCompanyById?.(selectedSubCompanyId)?.name ?? null)
      : null;

  const selectValue =
    selectedMainCompanyId != null && selectedMainCompanyId !== ''
      ? String(selectedMainCompanyId)
      : '';

  const handleMainChange = (v: string | null) => {
    try {
      setSelectedMainCompany?.(v === '' || v == null ? null : v);
    } catch {
      // no-op
    }
  };

  const handleSubSelect = (id: string) => {
    try {
      if (id) setSelectedSubCompany?.(id);
    } catch {
      // no-op
    }
  };

  const handleClearSub = () => {
    try {
      setSelectedSubCompany?.(null);
    } catch {
      // no-op
    }
  };

  const selectData = mainCompanyOptions ?? EMPTY_OPTIONS;
  const safeData = Array.isArray(selectData) ? selectData : [];

  const selectEl = (
    <Select
      size={size}
      leftSection={<IconBuilding size={14} />}
      placeholder="Ana Firma Seçiniz"
      data={safeData}
      value={selectValue}
      onChange={handleMainChange}
      clearable={false}
      style={{ minWidth: variant === 'sidebar' ? undefined : 160 }}
      aria-label="Ana Firma Seçiniz"
      {...(variant === 'header' && visibleFrom ? { visibleFrom } : {})}
    />
  );

  const subButton =
    selectedMainCompanyId != null &&
    selectedMainCompanyId !== '' &&
    hasSubContractors ? (
      <Menu shadow="md" width={260} position="bottom-end" withinPortal>
        <Menu.Target>
          <ActionIcon
            variant={selectedSubCompanyId ? 'light' : 'default'}
            color={selectedSubCompanyId ? 'blue' : undefined}
            size="lg"
            aria-label="Alt İşveren"
            {...(variant === 'header' && visibleFrom ? { visibleFrom } : {})}
          >
            <IconSitemap size={18} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Label>Alt İşveren</Menu.Label>
          {(subContractors ?? []).map((sub) => (
            <Menu.Item
              key={sub?.id ?? ''}
              onClick={() => sub?.id != null && handleSubSelect(sub.id)}
              style={{
                fontWeight: selectedSubCompanyId === sub?.id ? 600 : undefined,
              }}
            >
              {sub?.name ?? ''}
            </Menu.Item>
          ))}
          {selectedSubCompanyId != null && selectedSubCompanyId !== '' && (
            <>
              <Menu.Divider />
              <Menu.Item leftSection={<IconX size={14} />} onClick={handleClearSub} color="gray">
                Ana firmaya dön
              </Menu.Item>
            </>
          )}
        </Menu.Dropdown>
      </Menu>
    ) : null;

  const badgeEl =
    selectedSubName != null && selectedSubName !== '' ? (
      <Badge size="sm" variant="light" color="blue" {...(variant === 'header' && visibleFrom ? { visibleFrom } : {})}>
        Çalışılan: {selectedSubName}
      </Badge>
    ) : null;

  return (
    <Group gap="xs" wrap="nowrap">
      {selectEl}
      {subButton}
      {badgeEl}
    </Group>
  );
}
