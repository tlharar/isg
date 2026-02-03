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
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useForm, Controller } from 'react-hook-form';
import { useIncidentStore, type Incident, type IncidentType, type IncidentSeverity, type IncidentStatus } from '../stores/incidentStore';
import { useWorkerStore } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';

const TYPE_OPTIONS: { value: IncidentType; label: string }[] = [
  { value: 'İş Kazası', label: 'İş Kazası' },
  { value: 'Ramak Kala', label: 'Ramak Kala' },
];

const SEVERITY_OPTIONS: { value: IncidentSeverity; label: string }[] = [
  { value: 'Hafif', label: 'Hafif' },
  { value: 'Orta', label: 'Orta' },
  { value: 'Ağır', label: 'Ağır' },
];

const STATUS_OPTIONS: { value: IncidentStatus; label: string }[] = [
  { value: 'Açık', label: 'Açık' },
  { value: 'Kapandı', label: 'Kapandı' },
];

const INJURY_TYPES = ['Kesik', 'Yanık', 'Kırık', 'Ezilme', '—'].map((v) => ({ value: v, label: v }));
const BODY_PARTS = ['El', 'Ayak', 'Göz', 'Baş', 'Sırt', '—'].map((v) => ({ value: v, label: v }));

function getTypeBadgeColor(type: IncidentType): string {
  return type === 'İş Kazası' ? 'red' : 'orange';
}

export function IncidentPage() {
  const { t } = useTranslation();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const workers = useWorkerStore((s) => s.workers);
  const incidents = useIncidentStore((s) => s.incidents);
  const addIncident = useIncidentStore((s) => s.addIncident);
  const updateIncident = useIncidentStore((s) => s.updateIncident);
  const deleteIncident = useIncidentStore((s) => s.deleteIncident);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const employeeOptions = useMemo(() => {
    let list = workers;
    if (selectedCompanyId) list = list.filter((w) => w.companyId === selectedCompanyId);
    return list.map((w) => ({ value: w.id, label: `${w.nameSurname}${w.jobTitle ? ` - ${w.jobTitle}` : ''}` }));
  }, [workers, selectedCompanyId]);

  const getIncidentById = useIncidentStore((s) => s.getIncidentById);
  const editing = editingId ? getIncidentById(editingId) ?? null : null;

  const { handleSubmit, setValue, watch, control, reset } = useForm<Omit<Incident, 'id' | 'createdAt'>>({
    defaultValues: {
      type: 'İş Kazası',
      employeeId: '',
      date: new Date().toISOString().slice(0, 10),
      location: '',
      description: '',
      injuryType: 'Kesik',
      bodyPart: 'El',
      severity: 'Orta',
      status: 'Açık',
    },
  });

  const filteredIncidents = useMemo(() => {
    return incidents.filter((i) => {
      if (filterType && i.type !== filterType) return false;
      if (filterStatus && i.status !== filterStatus) return false;
      return true;
    });
  }, [incidents, filterType, filterStatus]);

  const handleAdd = () => {
    setEditingId(null);
    reset({
      type: 'İş Kazası',
      employeeId: '',
      date: new Date().toISOString().slice(0, 10),
      location: '',
      description: '',
      injuryType: 'Kesik',
      bodyPart: 'El',
      severity: 'Orta',
      status: 'Açık',
    });
    openModal();
  };

  const handleEdit = (incident: Incident) => {
    setEditingId(incident.id);
    setValue('type', incident.type);
    setValue('employeeId', incident.employeeId);
    setValue('date', incident.date);
    setValue('location', incident.location);
    setValue('description', incident.description);
    setValue('injuryType', incident.injuryType);
    setValue('bodyPart', incident.bodyPart);
    setValue('severity', incident.severity);
    setValue('status', incident.status);
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
    setEditingId(null);
  };

  const onSubmit = (data: Omit<Incident, 'id' | 'createdAt'>) => {
    const dateStr = typeof data.date === 'string' ? data.date : new Date(data.date).toISOString().slice(0, 10);
    const payload = { ...data, date: dateStr };
    if (editingId) {
      updateIncident(editingId, payload);
    } else {
      addIncident(payload);
    }
    handleCloseModal();
  };

  const handleDelete = (incident: Incident) => {
    if (window.confirm(t('incident.deleteConfirm'))) deleteIncident(incident.id);
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>{t('incident.title')}</Title>
            <Text c="dimmed" size="sm">{t('incident.subtitle')}</Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
            {t('incident.addIncident')}
          </Button>
        </Group>

        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text size="sm" fw={500}>{t('incident.filters')}</Text>
            <Group>
              <Select
                size="xs"
                label={t('incident.filterType')}
                data={[{ value: '', label: t('incident.filterAll') }, ...TYPE_OPTIONS]}
                value={filterType}
                onChange={(v) => setFilterType(v ?? '')}
                clearable
                style={{ minWidth: 140 }}
              />
              <Select
                size="xs"
                label={t('incident.filterStatus')}
                data={[{ value: '', label: t('incident.filterAll') }, ...STATUS_OPTIONS]}
                value={filterStatus}
                onChange={(v) => setFilterStatus(v ?? '')}
                clearable
                style={{ minWidth: 120 }}
              />
            </Group>
          </Stack>
        </Paper>

        <Paper withBorder>
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('incident.table.dateTime')}</Table.Th>
                  <Table.Th>{t('incident.table.type')}</Table.Th>
                  <Table.Th>{t('incident.table.employee')}</Table.Th>
                  <Table.Th>{t('incident.table.location')}</Table.Th>
                  <Table.Th>{t('incident.table.status')}</Table.Th>
                  <Table.Th style={{ width: 60 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredIncidents.map((i) => {
                  const worker = workers.find((w) => w.id === i.employeeId);
                  return (
                    <Table.Tr key={i.id}>
                      <Table.Td>{i.date}</Table.Td>
                      <Table.Td>
                        <Badge color={getTypeBadgeColor(i.type)} size="sm">{i.type}</Badge>
                      </Table.Td>
                      <Table.Td>{worker?.nameSurname ?? i.employeeId}</Table.Td>
                      <Table.Td>{i.location}</Table.Td>
                      <Table.Td>
                        <Badge color={i.status === 'Açık' ? 'orange' : 'gray'} size="sm">{i.status}</Badge>
                      </Table.Td>
                      <Table.Td>
                        <Menu shadow="md" width={160} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" size="sm">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => handleEdit(i)}>
                              {t('company.actions.edit')}
                            </Menu.Item>
                            <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => handleDelete(i)}>
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
          {filteredIncidents.length === 0 && (
            <Text size="sm" c="dimmed" ta="center" py="xl">{t('incident.noIncidents')}</Text>
          )}
        </Paper>
      </Stack>

      <Modal opened={modalOpened} onClose={handleCloseModal} title={editing ? t('incident.editTitle') : t('incident.addTitle')} size="md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            <Select
              label={t('incident.form.type')}
              data={TYPE_OPTIONS}
              value={watch('type')}
              onChange={(v) => setValue('type', (v as IncidentType) ?? 'İş Kazası')}
              required
            />
            <Select
              label={t('incident.form.employee')}
              placeholder={t('incident.form.employeePlaceholder')}
              data={employeeOptions}
              value={watch('employeeId') || null}
              onChange={(v) => setValue('employeeId', v ?? '')}
              searchable
              required
            />
            <Controller
              name="date"
              control={control}
              render={({ field }) => (
                <DatePickerInput
                  label={t('incident.form.dateTime')}
                  placeholder={t('incident.form.dateTimePlaceholder')}
                  valueFormat="DD.MM.YYYY"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(d) => setValue('date', d ? new Date(d).toISOString().slice(0, 10) : '')}
                />
              )}
            />
            <TextInput
              label={t('incident.form.location')}
              placeholder={t('incident.form.locationPlaceholder')}
              value={watch('location')}
              onChange={(e) => setValue('location', e.currentTarget.value)}
              required
            />
            <Textarea
              label={t('incident.form.rootCause')}
              placeholder={t('incident.form.rootCausePlaceholder')}
              value={watch('description')}
              onChange={(e) => setValue('description', e.currentTarget.value)}
              minRows={2}
              required
            />
            <Select
              label={t('incident.form.injuryType')}
              data={INJURY_TYPES}
              value={watch('injuryType')}
              onChange={(v) => setValue('injuryType', v ?? '')}
            />
            <Select
              label={t('incident.form.injuredBodyPart')}
              data={BODY_PARTS}
              value={watch('bodyPart')}
              onChange={(v) => setValue('bodyPart', v ?? '')}
            />
            <Select
              label={t('incident.form.severity')}
              data={SEVERITY_OPTIONS}
              value={watch('severity')}
              onChange={(v) => setValue('severity', (v as IncidentSeverity) ?? 'Orta')}
            />
            <Select
              label={t('incident.form.status')}
              data={STATUS_OPTIONS}
              value={watch('status')}
              onChange={(v) => setValue('status', (v as IncidentStatus) ?? 'Açık')}
              required
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" type="button" onClick={handleCloseModal}>{t('company.back')}</Button>
              <Button type="submit">{editing ? t('company.save') : t('incident.addIncident')}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
