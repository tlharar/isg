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
  NumberInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useForm, Controller } from 'react-hook-form';
import { usePpeStore, type PpeRecord } from '../stores/ppeStore';
import { useWorkerStore } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';
import { useEquipmentStore } from '@store/equipmentStore';
import { notifications } from '@mantine/notifications';


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
  const equipmentItems = useEquipmentStore((s) => s.items);
  const decrementStock = useEquipmentStore((s) => s.decrementStock);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const employeeOptions = useMemo(() => {
    let list = workers;
    if (selectedCompanyId) list = list.filter((w) => w.companyId === selectedCompanyId);
    return list.map((w) => ({ value: w.id, label: `${w.nameSurname}${w.jobTitle ? ` - ${w.jobTitle}` : ''}` }));
  }, [workers, selectedCompanyId]);

  const equipmentOptions = useMemo(() => {
    let list = equipmentItems;
    if (selectedCompanyId) list = list.filter((e) => e.companyId === selectedCompanyId);
    return list.map((e) => ({ value: e.id, label: e.name }));
  }, [equipmentItems, selectedCompanyId]);

  const editing = editingId ? records.find((r) => r.id === editingId) ?? null : null;

  type FormValues = {
    employeeId: string;
    equipmentId: string;
    quantity: number;
    dateGiven: string;
    nextRenewalDate: string;
  };

  const { handleSubmit, setValue, watch, control, reset } = useForm<FormValues>({
    defaultValues: {
      employeeId: '',
      equipmentId: '',
      quantity: 1,
      dateGiven: new Date().toISOString().slice(0, 10),
      nextRenewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    },
  });

  const handleAdd = () => {
    setEditingId(null);
    reset({
      employeeId: '',
      equipmentId: '',
      quantity: 1,
      dateGiven: new Date().toISOString().slice(0, 10),
      nextRenewalDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    });
    openModal();
  };

  const handleEdit = (record: PpeRecord) => {
    setEditingId(record.id);
    setValue('employeeId', record.employeeId);
    const byName = equipmentItems.find((e) => e.name === record.equipment);
    setValue('equipmentId', byName?.id ?? '');
    setValue('quantity', 1);
    setValue('dateGiven', record.dateGiven);
    setValue('nextRenewalDate', record.nextRenewalDate);
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
    setEditingId(null);
  };

  const onSubmit = (data: FormValues) => {
    const dateGiven = typeof data.dateGiven === 'string' ? data.dateGiven : new Date(data.dateGiven).toISOString().slice(0, 10);
    const nextRenewalDate = typeof data.nextRenewalDate === 'string' ? data.nextRenewalDate : new Date(data.nextRenewalDate).toISOString().slice(0, 10);
    if (editingId) {
      const byId = equipmentItems.find((e) => e.id === data.equipmentId);
      updateRecord(editingId, {
        employeeId: data.employeeId,
        equipment: byId?.name ?? data.equipmentId,
        dateGiven,
        nextRenewalDate,
      });
    } else {
      const quantity = Number(data.quantity);
      const validQty = Number.isFinite(quantity) && quantity >= 1 ? quantity : 1;
      const items = useEquipmentStore.getState().items;
      const freshItem = items.find((e) => e.id === data.equipmentId);
      if (!freshItem) {
        notifications.show({
          title: 'Ekipman bulunamadı',
          message: 'Seçilen ekipman envanterde bulunamadı. Lütfen listeden seçin.',
          color: 'red',
        });
        return;
      }
      const currentStock = Number(freshItem.currentStock);
      if (!Number.isFinite(currentStock) || currentStock < validQty) {
        notifications.show({
          title: 'Yetersiz stok',
          message: `Yetersiz stok! ${freshItem.name} için kalan: ${currentStock}`,
          color: 'red',
        });
        return;
      }
      decrementStock(freshItem.id, validQty);
      for (let i = 0; i < validQty; i++) {
        addRecord({
          employeeId: data.employeeId,
          equipment: freshItem.name,
          dateGiven,
          nextRenewalDate,
        });
      }
      notifications.show({
        title: 'Zimmet oluşturuldu',
        message: `${freshItem.name} stoktan düşüldü ve kayıt eklendi.`,
        color: 'green',
      });
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
              placeholder={t('ppe.form.equipmentPlaceholder')}
              data={equipmentOptions}
              value={watch('equipmentId') || null}
              onChange={(v) => setValue('equipmentId', v ?? '')}
              searchable
              required
              disabled={!!editingId}
            />
            {!editingId && (
              <NumberInput
                label={t('ppe.form.quantity')}
                value={watch('quantity')}
                onChange={(v) => setValue('quantity', typeof v === 'string' ? Number(v) || 1 : v ?? 1)}
                min={1}
                required
              />
            )}
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
