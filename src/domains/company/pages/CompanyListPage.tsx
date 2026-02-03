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
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconEdit, IconTrash, IconDownload, IconUpload, IconLink, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyFormSchema, type CompanyFormValues } from '../schemas/companySchema';
import { useCompanyStore, type Company, type CompanyStatus, type HazardClass } from '@store/companyStore';
import { useAppStore } from '@shared/stores/appStore';
import * as XLSX from 'xlsx';

/** Mock cities (İl) for filter */
const MOCK_CITIES = [
  { value: '', label: '—' },
  { value: 'istanbul', label: 'Istanbul' },
  { value: 'ankara', label: 'Ankara' },
  { value: 'izmir', label: 'Izmir' },
];

/** Mock districts (İlçe) for filter */
const MOCK_DISTRICTS: Record<string, { value: string; label: string }[]> = {
  '': [{ value: '', label: '—' }],
  istanbul: [
    { value: '', label: '—' },
    { value: 'kadikoy', label: 'Kadıköy' },
    { value: 'besiktas', label: 'Beşiktaş' },
    { value: 'uskudar', label: 'Üsküdar' },
  ],
  ankara: [
    { value: '', label: '—' },
    { value: 'cankaya', label: 'Çankaya' },
    { value: 'kecoren', label: 'Keçiören' },
  ],
  izmir: [
    { value: '', label: '—' },
    { value: 'konak', label: 'Konak' },
    { value: 'karsiyaka', label: 'Karşıyaka' },
  ],
};

/**
 * Get hazard class badge color
 */
function getHazardClassColor(hazardClass?: HazardClass): string {
  switch (hazardClass) {
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
function normalizeHazardClass(value: string): HazardClass | undefined {
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
  if (normalized.includes('istanbul') || normalized.includes('İstanbul')) return 'istanbul';
  if (normalized.includes('ankara')) return 'ankara';
  if (normalized.includes('izmir') || normalized.includes('İzmir')) return 'izmir';
  return normalized;
}

interface CompanyModalFormProps {
  company: Company | null;
  onSubmit: (data: CompanyFormValues) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

function CompanyModalForm({ company, onSubmit, onCancel, t }: CompanyModalFormProps) {
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: company
      ? {
          name: company.name,
          taxNo: company.taxNo,
          address: company.address,
          sgkNo: company.sgkNo,
          city: company.city,
          district: company.district,
          status: company.status,
        }
      : {
          name: '',
          taxNo: '',
          address: '',
          sgkNo: '',
          city: '',
          district: '',
          status: 'active',
        },
  });

  const cityValue = watch('city');
  const districtOptions = MOCK_DISTRICTS[cityValue] ?? MOCK_DISTRICTS[''];

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="md">
        <TextInput
          label={t('company.form.name')}
          placeholder={t('company.form.name')}
          {...register('name')}
          error={errors.name?.message}
          required
        />
        <TextInput
          label={t('company.form.taxNo')}
          placeholder={t('company.form.taxNo')}
          {...register('taxNo')}
          error={errors.taxNo?.message}
          required
        />
        <TextInput
          label={t('company.form.sgkNo')}
          placeholder={t('company.form.sgkNo')}
          {...register('sgkNo')}
          error={errors.sgkNo?.message}
          required
        />
        <Select
          label={t('company.form.city')}
          placeholder={t('company.form.city')}
          data={MOCK_CITIES}
          value={watch('city')}
          onChange={(v) => {
            setValue('city', v ?? '');
            setValue('district', '');
          }}
          error={errors.city?.message}
          required
        />
        <Select
          label={t('company.form.district')}
          placeholder={t('company.form.district')}
          data={districtOptions}
          value={watch('district')}
          onChange={(v) => setValue('district', v ?? '')}
          error={errors.district?.message}
          required
        />
        <Textarea
          label={t('company.form.address')}
          placeholder={t('company.form.address')}
          {...register('address')}
          error={errors.address?.message}
          required
          minRows={2}
        />
        <Select
          label={t('company.form.status')}
          data={[
            { value: 'active', label: t('company.statusActive') },
            { value: 'passive', label: t('company.statusPassive') },
          ]}
          value={watch('status')}
          onChange={(v) => setValue('status', (v as CompanyStatus) ?? 'active')}
          error={errors.status?.message}
          required
        />
        <Group justify="flex-end" mt="md">
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
        'Vergi No': '1234567890',
        'İl': 'Istanbul',
        'İlçe': 'Kadıköy',
        'Adres': 'Örnek Mahalle, Örnek Sokak No:1',
        'Tehlike Sınıfı': 'Tehlikeli',
      },
      {
        'Firma Adı': 'Örnek Firma B',
        'SGK Sicil No': 'SGK-67890',
        'Vergi No': '0987654321',
        'İl': 'Ankara',
        'İlçe': 'Çankaya',
        'Adres': 'Örnek Mahalle, Örnek Cadde No:5',
        'Tehlike Sınıfı': 'Çok Tehlikeli',
      },
      {
        'Firma Adı': 'Örnek Firma C',
        'SGK Sicil No': 'SGK-11111',
        'Vergi No': '1122334455',
        'İl': 'Izmir',
        'İlçe': 'Konak',
        'Adres': 'Örnek Mahalle, Örnek Bulvar No:10',
        'Tehlike Sınıfı': 'Az Tehlikeli',
      },
    ];

    const worksheet = XLSX.utils.json_to_sheet(exampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Firmalar');

    // Set column widths
    worksheet['!cols'] = [
      { wch: 25 }, // Firma Adı
      { wch: 15 }, // SGK Sicil No
      { wch: 15 }, // Vergi No
      { wch: 12 }, // İl
      { wch: 12 }, // İlçe
      { wch: 40 }, // Adres
      { wch: 18 }, // Tehlike Sınıfı
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
          const sgkNo = row['SGK Sicil No']?.toString().trim();
          const vergiNo = row['Vergi No']?.toString().trim() || '';
          const il = row['İl']?.toString().trim() || '';
          const ilce = row['İlçe']?.toString().trim() || '';
          const adres = row['Adres']?.toString().trim() || '';
          const tehlikeSinifi = row['Tehlike Sınıfı']?.toString().trim() || '';

          // Validation: Firma Adı and SGK Sicil No are required
          if (!firmaAdi || !sgkNo) {
            skippedCount++;
            return;
          }

          validCompanies.push({
            name: firmaAdi,
            sgkNo: sgkNo,
            taxNo: vergiNo,
            city: normalizeCity(il),
            district: ilce.toLowerCase(),
            address: adres,
            status: 'active',
            hazardClass: normalizeHazardClass(tehlikeSinifi),
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
              {filteredCompanies.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td>{c.name}</Table.Td>
                  <Table.Td>{c.sgkNo}</Table.Td>
                  <Table.Td>
                    {c.hazardClass ? (
                      <Badge color={getHazardClassColor(c.hazardClass)} size="sm">
                        {c.hazardClass}
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
