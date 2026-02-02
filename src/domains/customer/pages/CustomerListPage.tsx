import { useState } from 'react';
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
  Select,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { customerFormSchema, type CustomerFormValues } from '../schemas/customerSchema';
import { useAppStore } from '@shared/stores/appStore';
import { useCompanyStore } from '@store/companyStore';

export interface Customer extends CustomerFormValues {
  id: string;
}

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: '1',
    nameSurname: 'Ali Yılmaz',
    email: 'ali@example.com',
    tcIdNo: '12345678901',
    gender: 'male',
    companyId: 'c1',
  },
  {
    id: '2',
    nameSurname: 'Fatma Demir',
    email: 'fatma@example.com',
    tcIdNo: '98765432109',
    gender: 'female',
    companyId: 'c2',
  },
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

interface CustomerModalFormProps {
  customer: Customer | null;
  selectedCompanyId: string | null;
  onSubmit: (data: CustomerFormValues) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

function CustomerModalForm({ customer, selectedCompanyId, onSubmit, onCancel, t }: CustomerModalFormProps) {
  const companies = useCompanyStore((s) => s.companies);
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: customer
      ? {
          nameSurname: customer.nameSurname,
          email: customer.email,
          tcIdNo: customer.tcIdNo,
          gender: customer.gender,
          companyId: customer.companyId,
        }
      : {
          nameSurname: '',
          email: '',
          tcIdNo: '',
          gender: 'male',
          companyId: selectedCompanyId ?? '',
        },
  });

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));
  const showCompanySelect = !selectedCompanyId;

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Stack gap="md">
        <TextInput
          label={t('customer.form.nameSurname')}
          placeholder={t('customer.form.nameSurname')}
          {...register('nameSurname')}
          error={errors.nameSurname?.message}
          required
        />
        <TextInput
          label={t('customer.form.email')}
          placeholder={t('customer.form.email')}
          type="email"
          {...register('email')}
          error={errors.email?.message}
          required
        />
        <TextInput
          label={t('customer.form.tcIdNo')}
          placeholder={t('customer.form.tcIdNo')}
          {...register('tcIdNo')}
          error={errors.tcIdNo?.message}
          maxLength={11}
          required
        />
        <Select
          label={t('customer.form.gender')}
          placeholder={t('customer.form.gender')}
          data={[
            { value: 'male', label: t('customer.genderMale') },
            { value: 'female', label: t('customer.genderFemale') },
          ]}
          value={watch('gender')}
          onChange={(v) => setValue('gender', (v as 'male' | 'female') ?? 'male')}
          error={errors.gender?.message}
          required
        />
        {(showCompanySelect || customer) ? (
          <Select
            label={t('customer.form.company')}
            placeholder={t('customer.form.company')}
            data={companyOptions}
            value={watch('companyId')}
            onChange={(v) => setValue('companyId', v ?? '')}
            error={errors.companyId?.message}
            required
          />
        ) : null}
        <Group justify="flex-end" mt="md">
          <Button variant="default" type="button" onClick={onCancel}>
            {t('customer.back')}
          </Button>
          <Button type="submit">
            {customer ? t('customer.save') : t('customer.addCustomer')}
          </Button>
        </Group>
      </Stack>
    </form>
  );
}

export function CustomerListPage() {
  const { t } = useTranslation();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const filteredCustomers = selectedCompanyId
    ? customers.filter((c) => c.companyId === selectedCompanyId)
    : customers;

  const handleAddClick = () => {
    setEditingCustomer(null);
    openModal();
  };

  const handleEditClick = (customer: Customer) => {
    setEditingCustomer(customer);
    openModal();
  };

  const handleDeleteClick = (customer: Customer) => {
    if (window.confirm(t('customer.deleteConfirm'))) {
      setCustomers((prev) => prev.filter((c) => c.id !== customer.id));
    }
  };

  const handleModalSubmit = (data: CustomerFormValues) => {
    const payload = {
      ...data,
      companyId: data.companyId || selectedCompanyId || '',
    };
    if (editingCustomer) {
      setCustomers((prev) =>
        prev.map((c) => (c.id === editingCustomer.id ? { ...payload, id: c.id } : c))
      );
    } else {
      setCustomers((prev) => [...prev, { ...payload, id: generateId() }]);
    }
    closeModal();
    setEditingCustomer(null);
  };

  const handleModalClose = () => {
    closeModal();
    setEditingCustomer(null);
  };

  const getCompanyLabel = (companyId: string) => getCompanyById(companyId)?.name ?? companyId;

  return (
    <>
      <Stack gap="md" mb="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <div>
            <Title order={2}>{t('customer.title')}</Title>
            <Text c="dimmed" size="sm">
              {t('customer.subtitle')}
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} size="sm" onClick={handleAddClick}>
            {t('customer.addCustomer')}
          </Button>
        </Group>
      </Stack>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('customer.form.nameSurname')}</Table.Th>
              <Table.Th>{t('customer.form.email')}</Table.Th>
              <Table.Th>{t('customer.form.tcIdNo')}</Table.Th>
              <Table.Th>{t('customer.form.gender')}</Table.Th>
              <Table.Th>{t('customer.form.company')}</Table.Th>
              <Table.Th style={{ width: 50 }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filteredCustomers.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.nameSurname}</Table.Td>
                <Table.Td>{c.email}</Table.Td>
                <Table.Td>{c.tcIdNo}</Table.Td>
                <Table.Td>{t(c.gender === 'male' ? 'customer.genderMale' : 'customer.genderFemale')}</Table.Td>
                <Table.Td>{getCompanyLabel(c.companyId)}</Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={160} position="bottom-end">
                    <Menu.Target>
                      <ActionIcon variant="subtle" size="sm">
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => handleEditClick(c)}
                      >
                        {t('customer.actions.edit')}
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={() => handleDeleteClick(c)}
                      >
                        {t('customer.actions.delete')}
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
        title={editingCustomer ? t('customer.editPageTitle') : t('customer.newPageTitle')}
        size="md"
      >
        <CustomerModalForm
          key={editingCustomer?.id ?? 'new'}
          customer={editingCustomer}
          selectedCompanyId={selectedCompanyId}
          onSubmit={handleModalSubmit}
          onCancel={handleModalClose}
          t={t}
        />
      </Modal>
    </>
  );
}
