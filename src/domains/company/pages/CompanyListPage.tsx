import { useState, useMemo } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  ActionIcon,
  Menu,
  Modal,
  TextInput,
  Textarea,
  Select,
  Badge,
  Tabs,
  Switch,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconEdit, IconTrash, IconDownload, IconUpload, IconLink, IconCheck, IconArrowDownRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyFormSchema, type CompanyFormValues } from '../schemas/companySchema';
import { useCompanyStore, type Company, type CompanyStatus, type DangerClass, isMainCompany } from '@store/companyStore';
import { useAppStore } from '@shared/stores/appStore';
import * as XLSX from 'xlsx';

/** Mock cities (İl) for form and filter */
const MOCK_CITIES = [
  { value: '', label: '—' },
  { value: 'İstanbul', label: 'İstanbul' },
  { value: 'Ankara', label: 'Ankara' },
  { value: 'İzmir', label: 'İzmir' },
];

/** Mock districts (İlçe) by city */
const MOCK_DISTRICTS: Record<string, { value: string; label: string }[]> = {
  '': [{ value: '', label: '—' }],
  'İstanbul': [
    { value: '', label: '—' },
    { value: 'Kadıköy', label: 'Kadıköy' },
    { value: 'Beşiktaş', label: 'Beşiktaş' },
    { value: 'Üsküdar', label: 'Üsküdar' },
  ],
  'Ankara': [
    { value: '', label: '—' },
    { value: 'Çankaya', label: 'Çankaya' },
    { value: 'Keçiören', label: 'Keçiören' },
  ],
  'İzmir': [
    { value: '', label: '—' },
    { value: 'Konak', label: 'Konak' },
    { value: 'Karşıyaka', label: 'Karşıyaka' },
  ],
};

/** Tehlike Sınıfı options */
const DANGER_CLASS_OPTIONS: { value: DangerClass; label: string }[] = [
  { value: 'Az Tehlikeli', label: 'Az Tehlikeli' },
  { value: 'Tehlikeli', label: 'Tehlikeli' },
  { value: 'Çok Tehlikeli', label: 'Çok Tehlikeli' },
];

/**
 * Get danger class (Tehlike Sınıfı) badge color
 */
function getDangerClassColor(dangerClass?: DangerClass): string {
  switch (dangerClass) {
    case 'Çok Tehlikeli':
      return 'red';
    case 'Tehlikeli':
      return 'orange';
    case 'Az Tehlikeli':
      return 'green';
    default:
      return 'gray';
  }
}

/**
 * Normalize hazard class string from Excel
 */
function normalizeDangerClass(value: string): DangerClass | undefined {
  const normalized = value?.trim().toLowerCase();
  if (normalized.includes('çok') || normalized.includes('cok')) return 'Çok Tehlikeli';
  if (normalized.includes('tehlikeli')) return 'Tehlikeli';
  if (normalized.includes('az')) return 'Az Tehlikeli';
  return undefined;
}

/**
 * Normalize city string from Excel
 */
function normalizeCity(value: string): string {
  const normalized = value?.trim().toLowerCase();
  if (normalized.includes('istanbul') || normalized.includes('İstanbul')) return 'İstanbul';
  if (normalized.includes('ankara')) return 'Ankara';
  if (normalized.includes('izmir') || normalized.includes('İzmir')) return 'İzmir';
  return value?.trim() || '';
}

interface CompanyModalFormProps {
  company: Company | null;
  onSubmit: (data: CompanyFormValues) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

function CompanyModalForm({ company, onSubmit, onCancel, t }: CompanyModalFormProps) {
  const getMainCompanies = useCompanyStore((s) => s.getMainCompanies);
  const mainCompanies = getMainCompanies();
  const [isSubContractorChecked, setIsSubContractorChecked] = useState(!!(company?.parentId));

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: company
      ? {
          name: company.name,
          naceCode: company.naceCode ?? '',
          dangerClass: company.dangerClass,
          sector: company.sector ?? '',
          sgkSicilNo: company.sgkSicilNo,
          taxOffice: company.taxOffice ?? '',
          taxNumber: company.taxNumber ?? '',
          city: company.city ?? '',
          district: company.district ?? '',
          address: company.address ?? '',
          phone: company.phone ?? '',
          email: company.email ?? '',
          status: company.status,
          parentId: company.parentId ?? null,
        }
      : {
          name: '',
          naceCode: '',
          dangerClass: undefined,
          sector: '',
          sgkSicilNo: '',
          taxOffice: '',
          taxNumber: '',
          city: '',
          district: '',
          address: '',
          phone: '',
          email: '',
          status: 'active',
          parentId: null,
        },
  });

  const mainCompanyOptions = mainCompanies
    .filter((c) => !company || c.id !== company.id)
    .map((c) => ({ value: c.id, label: c.name }));

  const handleFormSubmit = (data: CompanyFormValues) => {
    if (isSubContractorChecked && (data.parentId == null || data.parentId === '')) {
      notifications.show({ title: 'Hata', message: 'Alt işveren için ana firma seçin.', color: 'red' });
      return;
    }
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)}>
      <Tabs defaultValue="general">
        <Tabs.List mb="md">
          <Tabs.Tab value="general">{t('company.tabs.general')}</Tabs.Tab>
          <Tabs.Tab value="legal">{t('company.tabs.legal')}</Tabs.Tab>
          <Tabs.Tab value="contact">{t('company.tabs.contact')}</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="general">
          <Stack gap="md">
            <Switch
              label="Bu bir Alt İşverendir / Taşerondur"
              description="İşaretlenirse, aşağıdan ana firma seçin"
              checked={isSubContractorChecked}
              onChange={(e) => {
                const checked = e.currentTarget.checked;
                setIsSubContractorChecked(checked);
                if (!checked) setValue('parentId', null);
              }}
            />
            {isSubContractorChecked && (
              <Select
                label="Bağlı Olduğu Ana Firma"
                placeholder="Ana firma seçin"
                data={mainCompanyOptions}
                value={watch('parentId') ?? null}
                onChange={(v) => setValue('parentId', v === '' ? null : v)}
                clearable
                required={isSubContractorChecked}
              />
            )}
            <TextInput
              label={t('company.form.firmaUnvani')}
              placeholder={t('company.form.firmaUnvani')}
              {...register('name')}
              error={errors.name?.message}
              required
            />
            <TextInput
              label={t('company.form.naceCode')}
              placeholder="örn: 41201"
              {...register('naceCode')}
              error={errors.naceCode?.message}
            />
            <Select
              label={t('company.form.dangerClass')}
              placeholder={t('company.form.dangerClass')}
              data={DANGER_CLASS_OPTIONS}
              value={watch('dangerClass') ?? null}
              onChange={(v) => setValue('dangerClass', (v as CompanyFormValues['dangerClass']) ?? undefined)}
              error={errors.dangerClass?.message}
              clearable
            />
            <TextInput
              label={t('company.form.sector')}
              placeholder={t('company.form.sector')}
              {...register('sector')}
              error={errors.sector?.message}
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="legal">
          <Stack gap="md">
            <TextInput
              label={t('company.form.sgkSicilNo')}
              placeholder={t('company.form.sgkSicilNo')}
              {...register('sgkSicilNo')}
              error={errors.sgkSicilNo?.message}
              required
            />
            <TextInput
              label={t('company.form.taxOffice')}
              placeholder={t('company.form.taxOffice')}
              {...register('taxOffice')}
              error={errors.taxOffice?.message}
            />
            <TextInput
              label={t('company.form.taxNumber')}
              placeholder={t('company.form.taxNumber')}
              {...register('taxNumber')}
              error={errors.taxNumber?.message}
            />
          </Stack>
        </Tabs.Panel>

        <Tabs.Panel value="contact">
          <Stack gap="md">
            <Select
              label={t('company.form.city')}
              placeholder={t('company.form.city')}
              data={MOCK_CITIES}
              value={watch('city') || null}
              onChange={(v) => {
                setValue('city', v ?? '');
                setValue('district', '');
              }}
              error={errors.city?.message}
              clearable
            />
            <TextInput
              label={t('company.form.district')}
              placeholder={t('company.form.district')}
              {...register('district')}
              error={errors.district?.message}
            />
            <Textarea
              label={t('company.form.address')}
              placeholder={t('company.form.address')}
              {...register('address')}
              error={errors.address?.message}
              minRows={2}
            />
            <TextInput
              label={t('company.form.phone')}
              placeholder={t('company.form.phone')}
              {...register('phone')}
              error={errors.phone?.message}
            />
            <TextInput
              label={t('company.form.email')}
              placeholder={t('company.form.email')}
              type="email"
              {...register('email')}
              error={errors.email?.message}
            />
          </Stack>
        </Tabs.Panel>
      </Tabs>

      <Stack gap="md" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
        <Select
          label={t('company.form.status')}
          data={[
            { value: 'active', label: t('company.statusActive') },
            { value: 'passive', label: t('company.statusPassive') },
          ]}
          value={watch('status')}
          onChange={(v) => setValue('status', (v as CompanyStatus) ?? 'active')}
          error={errors.status?.message}
          style={{ maxWidth: 200 }}
        />
        <Group justify="flex-end" gap="xs">
          <Button variant="default" type="button" onClick={onCancel}>
            {t('company.back')}
          </Button>
          <Button type="submit">
            {company ? t('company.save') : t('company.addCompany')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

export function CompanyListPage() {
  const { t } = useTranslation();
  const setSelectedCompanyId = useAppStore((s) => s.setSelectedCompanyId);
  const companies = useCompanyStore((s) => s.companies);
  const addCompany = useCompanyStore((s) => s.addCompany);
  const addCompanyBulk = useCompanyStore((s) => s.addCompanyBulk);
  const updateCompany = useCompanyStore((s) => s.updateCompany);
  const deleteCompany = useCompanyStore((s) => s.deleteCompany);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterCity, setFilterCity] = useState<string>('');
  const [filterDistrict, setFilterDistrict] = useState<string>('');

  const filteredCompanies = useMemo(() => {
    return companies.filter((c) => {
      if (filterStatus && c.status !== filterStatus) return false;
      if (filterCity && c.city !== filterCity) return false;
      if (filterDistrict && c.district !== filterDistrict) return false;
      return true;
    });
  }, [companies, filterStatus, filterCity, filterDistrict]);

  /** Main companies first, then each main's sub-contractors (indented), for table display. */
  const hierarchyRows = useMemo(() => {
    const mains = filteredCompanies.filter(isMainCompany);
    const result: Company[] = [];
    for (const main of mains) {
      result.push(main);
      const subs = filteredCompanies.filter((c) => c.parentId === main.id);
      for (const sub of subs) result.push(sub);
    }
    return result;
  }, [filteredCompanies]);

  const handleAddClick = () => {
    setEditingCompany(null);
    openModal();
  };

  const handleEditClick = (company: Company) => {
    setEditingCompany(company);
    openModal();
  };

  const handleDeleteClick = (company: Company) => {
    if (window.confirm(t('company.deleteConfirm'))) {
      deleteCompany(company.id);
    }
  };

  const handleSelectCompany = (company: Company) => {
    setSelectedCompanyId(company.id);
  };

  const handleModalSubmit = (data: CompanyFormValues) => {
    if (editingCompany) {
      updateCompany(editingCompany.id, data);
    } else {
      addCompany(data);
    }
    closeModal();
    setEditingCompany(null);
  };

  const handleModalClose = () => {
    closeModal();
    setEditingCompany(null);
  };

  /**
   * Download example Excel template
   */
  const handleExampleExcel = () => {
    const exampleData = [
      {
        'Firma Adı': 'Örnek Firma A',
        'SGK Sicil No': 'SGK-12345',
        'Vergi Dairesi': 'Kadıköy',
        'Vergi No': '1234567890',
        'Nace Kodu': '41201',
        'Sektör': 'İnşaat',
        'İl': 'İstanbul',
        'İlçe': 'Kadıköy',
        'Adres': 'Örnek Mahalle, Örnek Sokak No:1',
        'Tehlike Sınıfı': 'Tehlikeli',
        'Telefon': '+90 216 123 45 67',
        'E-Posta': 'info@ornekfirma.com',
      },
      {
        'Firma Adı': 'Örnek Firma B',
        'SGK Sicil No': 'SGK-67890',
        'Vergi Dairesi': 'Çankaya',
        'Vergi No': '0987654321',
        'Nace Kodu': '35110',
        'Sektör': 'Enerji',
        'İl': 'Ankara',
        'İlçe': 'Çankaya',
        'Adres': 'Örnek Mahalle, Örnek Cadde No:5',
        'Tehlike Sınıfı': 'Çok Tehlikeli',
        'Telefon': '',
        'E-Posta': '',
      },
      {
        'Firma Adı': 'Örnek Firma C',
        'SGK Sicil No': 'SGK-11111',
        'Vergi Dairesi': 'Konak',
        'Vergi No': '1122334455',
        'Nace Kodu': '56101',
        'Sektör': 'Hizmet',
        'İl': 'İzmir',
        'İlçe': 'Konak',
        'Adres': 'Örnek Mahalle, Örnek Bulvar No:10',
        'Tehlike Sınıfı': 'Az Tehlikeli',
        'Telefon': '',
        'E-Posta': '',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Firmalar');

    worksheet['!cols'] = [
      { wch: 25 },
      { wch: 15 },
      { wch: 18 },
      { wch: 15 },
      { wch: 10 },
      { wch: 14 },
      { wch: 12 },
      { wch: 12 },
      { wch: 40 },
      { wch: 18 },
      { wch: 18 },
      { wch: 28 },
    ];

    XLSX.writeFile(workbook, 'firma_sablonu.xlsx');
    notifications.show({
      title: t('company.excelDownloadSuccess'),
      message: t('company.excelDownloadSuccessMessage'),
      color: 'green',
    });
  };

  /**
   * Handle Excel file import
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const validCompanies: Omit<Company, 'id' | 'employeeCountSystem' | 'employeeCountIsgKatip'>[] = [];
        let skippedCount = 0;

        jsonData.forEach((row: any) => {
          const firmaAdi = row['Firma Adı']?.toString().trim();
          const sgkSicilNo = row['SGK Sicil No']?.toString().trim();
          const vergiNo = row['Vergi No']?.toString().trim() || '';
          const vergiDairesi = row['Vergi Dairesi']?.toString().trim() || '';
          const naceKodu = row['Nace Kodu']?.toString().trim() || '';
          const sektor = row['Sektör']?.toString().trim() || '';
          const il = row['İl']?.toString().trim() || '';
          const ilce = row['İlçe']?.toString().trim() || '';
          const adres = row['Adres']?.toString().trim() || '';
          const tehlikeSinifi = row['Tehlike Sınıfı']?.toString().trim() || '';
          const telefon = row['Telefon']?.toString().trim() || '';
          const eposta = row['E-Posta']?.toString().trim() || '';

          // Validation: Firma Unvanı and SGK Sicil No are required
          if (!firmaAdi || !sgkSicilNo) {
            skippedCount++;
            return;
          }

          validCompanies.push({
            name: firmaAdi,
            naceCode: naceKodu,
            dangerClass: normalizeDangerClass(tehlikeSinifi),
            sector: sektor,
            sgkSicilNo,
            taxOffice: vergiDairesi,
            taxNumber: vergiNo,
            city: normalizeCity(il),
            district: ilce,
            address: adres,
            phone: telefon,
            email: eposta,
            status: 'active',
          });
        });

        if (validCompanies.length > 0) {
          addCompanyBulk(validCompanies);
          notifications.show({
            title: t('company.excelImportSuccess'),
            message: t('company.excelImportSuccessMessage').replace('{{count}}', validCompanies.length.toString()),
            color: 'green',
          });
        }

        if (skippedCount > 0) {
          notifications.show({
            title: t('company.excelImportWarning'),
            message: t('company.excelImportWarningMessage').replace('{{count}}', skippedCount.toString()),
            color: 'yellow',
          });
        }
      } catch (error) {
        console.error('Excel import error:', error);
        notifications.show({
          title: t('company.excelImportError'),
          message: t('company.excelImportErrorMessage'),
          color: 'red',
        });
      }
    };
    reader.readAsBinaryString(file);
    // Reset file input
    event.target.value = '';
  };

  const handleIsgKatip = () => {
    // Placeholder: open ISG Katip add/edit flow
    notifications.show({
      title: 'İSG-KATİP Entegrasyonu',
      message: 'Bu özellik yakında eklenecektir.',
      color: 'blue',
    });
  };

  const statusFilterOptions = [
    { value: '', label: t('company.filterStatusAll') },
    { value: 'active', label: t('company.statusActive') },
    { value: 'passive', label: t('company.statusPassive') },
  ];

  const cityFilterOptions = [
    { value: '', label: t('company.filterCityAll') },
    ...MOCK_CITIES.filter((c) => c.value).map((c) => ({ value: c.value, label: c.label })),
  ];

  const districtFilterOptions = [
    { value: '', label: t('company.filterDistrictAll') },
    ...(filterCity ? (MOCK_DISTRICTS[filterCity] ?? []).filter((d) => d.value) : []),
  ];

  return (
    <>
      <Stack gap="md" mb="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <div>
            <Title order={2}>{t('company.title')}</Title>
            <Text c="dimmed" size="sm">{t('company.subtitle')}</Text>
          </div>
        </Group>

        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text size="sm" fw={500}>{t('company.filtersTitle')}</Text>
            <Group align="flex-end" wrap="wrap" gap="sm">
              <Select
                size="xs"
                label={t('company.filterStatus')}
                placeholder={t('company.filterStatus')}
                data={statusFilterOptions}
                value={filterStatus}
                onChange={(v) => setFilterStatus(v ?? '')}
                clearable
                style={{ minWidth: 120 }}
              />
              <Select
                size="xs"
                label={t('company.filterCity')}
                placeholder={t('company.filterCity')}
                data={cityFilterOptions}
                value={filterCity}
                onChange={(v) => {
                  setFilterCity(v ?? '');
                  setFilterDistrict('');
                }}
                clearable
                style={{ minWidth: 140 }}
              />
              <Select
                size="xs"
                label={t('company.filterDistrict')}
                placeholder={t('company.filterDistrict')}
                data={districtFilterOptions}
                value={filterDistrict}
                onChange={(v) => setFilterDistrict(v ?? '')}
                clearable
                disabled={!filterCity}
                style={{ minWidth: 140 }}
              />
            </Group>
          </Stack>
        </Paper>

        <Group gap="xs" wrap="wrap">
          <Button
            leftSection={<IconDownload size={16} />}
            size="sm"
            color="teal"
            variant="light"
            onClick={handleExampleExcel}
          >
            {t('company.buttonExampleExcel')}
          </Button>
          <input
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            id="excel-file-input"
          />
          <Button
            leftSection={<IconUpload size={16} />}
            size="sm"
            color="teal"
            variant="light"
            component="label"
            htmlFor="excel-file-input"
          >
            {t('company.buttonImportExcel')}
          </Button>
          <Button
            leftSection={<IconLink size={16} />}
            size="sm"
            color="blue"
            variant="light"
            onClick={handleIsgKatip}
          >
            {t('company.buttonIsgKatip')}
          </Button>
          <Button leftSection={<IconPlus size={16} />} size="sm" color="teal" onClick={handleAddClick}>
            {t('company.addCompany')}
          </Button>
        </Group>
      </Stack>

      <Paper withBorder>
        <Table.ScrollContainer minWidth={900}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{t('company.table.name')}</Table.Th>
                <Table.Th>{t('company.table.sgkNo')}</Table.Th>
                <Table.Th>{t('company.table.hazardClass')}</Table.Th>
                <Table.Th>{t('company.table.city')}</Table.Th>
                <Table.Th>{t('company.table.employeeCountSystem')}</Table.Th>
                <Table.Th>{t('company.table.status')}</Table.Th>
                <Table.Th style={{ width: 80 }} />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {hierarchyRows.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td style={{ paddingLeft: c.parentId ? 32 : undefined }}>
                    <Group gap="xs" wrap="nowrap">
                      {c.parentId ? (
                        <IconArrowDownRight size={16} style={{ flexShrink: 0 }} />
                      ) : null}
                      <Text size="sm">{c.name}</Text>
                    </Group>
                  </Table.Td>
                  <Table.Td>{c.sgkSicilNo}</Table.Td>
                  <Table.Td>
                    {c.dangerClass ? (
                      <Badge color={getDangerClassColor(c.dangerClass)} size="sm">
                        {c.dangerClass}
                      </Badge>
                    ) : (
                      <Text c="dimmed" size="sm">—</Text>
                    )}
                  </Table.Td>
                  <Table.Td style={{ textTransform: 'capitalize' }}>{c.city || '—'}</Table.Td>
                  <Table.Td>
                    <Badge size="lg" variant="filled" color="blue">
                      {c.employeeCountSystem}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge color={c.status === 'active' ? 'green' : 'gray'} size="sm">
                      {c.status === 'active' ? t('company.statusActive') : t('company.statusPassive')}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={200} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle" size="sm">
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>
                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconCheck size={14} />}
                          onClick={() => handleSelectCompany(c)}
                        >
                          {t('company.actions.selectCompany')}
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconEdit size={14} />}
                          onClick={() => handleEditClick(c)}
                        >
                          {t('company.actions.edit')}
                        </Menu.Item>
                        <Menu.Item
                          leftSection={<IconTrash size={14} />}
                          color="red"
                          onClick={() => handleDeleteClick(c)}
                        >
                          {t('company.actions.delete')}
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={handleModalClose}
        title={editingCompany ? t('company.editPageTitle') : t('company.newPageTitle')}
        size="md"
      >
        <CompanyModalForm
          key={editingCompany?.id ?? 'new'}
          company={editingCompany}
          onSubmit={handleModalSubmit}
          onCancel={handleModalClose}
          t={t}
        />
      </Modal>
    </>
  );
}
