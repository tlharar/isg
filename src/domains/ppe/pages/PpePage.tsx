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
  Select,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useForm, Controller } from 'react-hook-form';
import { usePpeStore, type PpeRecord } from '../stores/ppeStore';
import { useWorkerStore } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';

const EQUIPMENT_OPTIONS = [
  { value: 'Baret', label: 'Baret' },
  { value: 'Çelik Burunlu Ayakkabı', label: 'Çelik Burunlu Ayakkabı' },
  { value: 'Eldiven', label: 'Eldiven' },
  { value: 'Gözlük', label: 'Gözlük' },
  { value: 'Kulaklık', label: 'Kulaklık' },
  { value: 'Maske', label: 'Maske' },
  { value: 'Yelek', label: 'Yelek' },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('tr-TR');
  } catch {
    return iso;
  }
}

export function PpePage() {
  const { t } = useTranslation();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const workers = useWorkerStore((s) => s.workers);
  const records = usePpeStore((s) => s.records);
  const addRecord = usePpeStore((s) => s.addRecord);
  const updateRecord = usePpeStore((s) => s.updateRecord);
  const deleteRecord = usePpeStore((s) => s.deleteRecord);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const employeeOptions = useMemo(() => {
    let list = workers;
    if (selectedCompanyId) list = list.filter((w) => w.companyId === selectedCompanyId);
    return list.map((w) => ({ value: w.id, label: `${w.nameSurname}${w.jobTitle ? ` - ${w.jobTitle}` : ''}` }));
  }, [workers, selectedCompanyId]);

  const editing = editingId ? records.find((r) => r.id === editingId) ?? null : null;

  const { handleSubmit, setValue, watch, control, reset } = useForm<Omit<PpeRecord, 'id' | 'createdAt'>>({
    defaultValues: {
      employeeId: '',
      equipment: 'Baret',
      dateGiven: new Date().toISOString().slice(0, 10),
      nextRenewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    },
  });

  const handleAdd = () => {
    setEditingId(null);
    reset({
      employeeId: '',
      equipment: 'Baret',
      dateGiven: new Date().toISOString().slice(0, 10),
      nextRenewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
    openModal();
  };

  const handleEdit = (record: PpeRecord) => {
    setEditingId(record.id);
    setValue('employeeId', record.employeeId);
    setValue('equipment', record.equipment);
    setValue('dateGiven', record.dateGiven);
    setValue('nextRenewalDate', record.nextRenewalDate);
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
    setEditingId(null);
  };

  const onSubmit = (data: Omit<PpeRecord, 'id' | 'createdAt'>) => {
    const dateGiven = typeof data.dateGiven === 'string' ? data.dateGiven : new Date(data.dateGiven).toISOString().slice(0, 10);
    const nextRenewalDate = typeof data.nextRenewalDate === 'string' ? data.nextRenewalDate : new Date(data.nextRenewalDate).toISOString().slice(0, 10);
    const payload = { ...data, dateGiven, nextRenewalDate };
    if (editingId) {
      updateRecord(editingId, payload);
    } else {
      addRecord(payload);
    }
    handleCloseModal();
  };

  const handleDelete = (record: PpeRecord) => {
    if (window.confirm(t('ppe.deleteConfirm'))) deleteRecord(record.id);
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>{t('ppe.title')}</Title>
            <Text c="dimmed" size="sm">{t('ppe.subtitle')}</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
            {t('ppe.addZimmet')}
          </Button>
        </Group>

        <Paper withBorder>
          <Table.ScrollContainer minWidth={700}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('ppe.table.workerName')}</Table.Th>
                  <Table.Th>{t('ppe.table.equipment')}</Table.Th>
                  <Table.Th>{t('ppe.table.dateGiven')}</Table.Th>
                  <Table.Th>{t('ppe.table.nextRenewalDate')}</Table.Th>
                  <Table.Th style={{ width: 60 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {records.map((r) => {
                  const worker = workers.find((w) => w.id === r.employeeId);
                  return (
                    <Table.Tr key={r.id}>
                      <Table.Td>{worker?.nameSurname ?? r.employeeId}</Table.Td>
                      <Table.Td>{r.equipment}</Table.Td>
                      <Table.Td>{formatDate(r.dateGiven)}</Table.Td>
                      <Table.Td>{formatDate(r.nextRenewalDate)}</Table.Td>
                      <Table.Td>
                        <Menu shadow="md" width={160} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" size="sm">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => handleEdit(r)}>
                              {t('company.actions.edit')}
                            </Menu.Item>
                            <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => handleDelete(r)}>
                              {t('company.actions.delete')}
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
          {records.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" py="xl">{t('ppe.noRecords')}</Text>
          )}
        </Paper>
      </Stack>

      <Modal opened={modalOpened} onClose={handleCloseModal} title={editing ? t('ppe.editTitle') : t('ppe.addZimmet')} size="sm">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            <Select
              label={t('ppe.form.worker')}
              placeholder={t('ppe.form.workerPlaceholder')}
              data={employeeOptions}
              value={watch('employeeId') || null}
              onChange={(v) => setValue('employeeId', v ?? '')}
              searchable
              required
            />
            <Select
              label={t('ppe.form.equipment')}
              data={EQUIPMENT_OPTIONS}
              value={watch('equipment')}
              onChange={(v) => setValue('equipment', v ?? '')}
              required
            />
            <Controller
              name="dateGiven"
              control={control}
              render={({ field }) => (
                <DatePickerInput
                  label={t('ppe.form.dateGiven')}
                  placeholder={t('ppe.form.dateGivenPlaceholder')}
                  valueFormat="DD.MM.YYYY"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(d) => setValue('dateGiven', d ? new Date(d).toISOString().slice(0, 10) : '')}
                />
              )}
            />
            <Controller
              name="nextRenewalDate"
              control={control}
              render={({ field }) => (
                <DatePickerInput
                  label={t('ppe.form.nextRenewalDate')}
                  placeholder={t('ppe.form.nextRenewalDatePlaceholder')}
                  valueFormat="DD.MM.YYYY"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(d) => setValue('nextRenewalDate', d ? new Date(d).toISOString().slice(0, 10) : '')}
                />
              )}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" type="button" onClick={handleCloseModal}>{t('company.back')}</Button>
              <Button type="submit">{editing ? t('company.save') : t('ppe.addZimmet')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
