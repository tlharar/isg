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
  Textarea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { companyFormSchema, type CompanyFormValues } from '../schemas/companySchema';
import { useCompanyStore, type Company } from '@store/companyStore';

interface CompanyModalFormProps {
  company: Company | null;
  onSubmit: (data: CompanyFormValues) => void;
  onCancel: () => void;
  t: (key: string) => string;
}

function CompanyModalForm({ company, onSubmit, onCancel, t }: CompanyModalFormProps) {
  const { register, handleSubmit, formState: { errors } } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: company
      ? { name: company.name, taxNo: company.taxNo, address: company.address }
      : { name: '', taxNo: '', address: '' },
  });

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
        <Textarea
          label={t('company.form.address')}
          placeholder={t('company.form.address')}
          {...register('address')}
          error={errors.address?.message}
          required
          minRows={2}
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
  const companies = useCompanyStore((s) => s.companies);
  const addCompany = useCompanyStore((s) => s.addCompany);
  const updateCompany = useCompanyStore((s) => s.updateCompany);
  const deleteCompany = useCompanyStore((s) => s.deleteCompany);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

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

  return (
    <>
      <Stack gap="md" mb="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <div>
            <Title order={2}>{t('company.title')}</Title>
            <Text c="dimmed" size="sm">
              {t('company.subtitle')}
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} size="sm" onClick={handleAddClick}>
            {t('company.addCompany')}
          </Button>
        </Group>
      </Stack>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('company.form.name')}</Table.Th>
              <Table.Th>{t('company.form.taxNo')}</Table.Th>
              <Table.Th>{t('company.form.address')}</Table.Th>
              <Table.Th style={{ width: 50 }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {companies.map((c) => (
              <Table.Tr key={c.id}>
                <Table.Td>{c.name}</Table.Td>
                <Table.Td>{c.taxNo}</Table.Td>
                <Table.Td>{c.address}</Table.Td>
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
