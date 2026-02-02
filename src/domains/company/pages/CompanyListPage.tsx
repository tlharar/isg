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
import { useTranslation } from '@shared/i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyFormSchema, type CompanyFormValues } from '../schemas/companySchema';
import { useCompanyStore, type Company, type CompanyStatus } from '@store/companyStore';
import { useAppStore } from '@shared/stores/appStore';

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

  const handleExampleExcel = () => {
    // Placeholder: download example Excel template
    console.log('Example Excel');
  };

  const handleImportExcel = () => {
    // Placeholder: open file picker and import
    console.log('Import Excel');
  };

  const handleIsgKatip = () => {
    // Placeholder: open ISG Katip add/edit flow
    console.log('Add/Edit from ISG Katip');
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
            <Title order={2}>{t('company.menu.companies')}</Title>
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
            color="green"
            variant="light"
            onClick={handleExampleExcel}
          >
            {t('company.buttonExampleExcel')}
          </Button>
          <Button
            leftSection={<IconUpload size={16} />}
            size="sm"
            color="green"
            variant="light"
            onClick={handleImportExcel}
          >
            {t('company.buttonImportExcel')}
          </Button>
          <Button
            leftSection={<IconLink size={16} />}
            size="sm"
            color="green"
            onClick={handleIsgKatip}
          >
            {t('company.buttonIsgKatip')}
          </Button>
          <Button leftSection={<IconPlus size={16} />} size="sm" color="green" onClick={handleAddClick}>
            {t('company.addCompany')}
          </Button>
        </Group>
      </Stack>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('company.table.name')}</Table.Th>
              <Table.Th>{t('company.table.sgkNo')}</Table.Th>
              <Table.Th>{t('company.table.employeeCountSystem')}</Table.Th>
              <Table.Th>{t('company.table.employeeCountIsgKatip')}</Table.Th>
              <Table.Th>{t('company.table.status')}</Table.Th>
              <Table.Th style={{ width: 80 }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredCompanies.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.name}</Table.Td>
                <Table.Td>{c.sgkNo}</Table.Td>
                <Table.Td>{c.employeeCountSystem}</Table.Td>
                <Table.Td>{c.employeeCountIsgKatip}</Table.Td>
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
