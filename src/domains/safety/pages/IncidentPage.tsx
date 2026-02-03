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
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useIncidentStore, type Incident, type IncidentType, type IncidentStatus } from '@store/incidentStore';
import { useWorkerStore } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';

const INCIDENT_TYPE_OPTIONS: { value: IncidentType; label: string }[] = [
  { value: 'İş Kazası', label: 'İş Kazası' },
  { value: 'Ramak Kala', label: 'Ramak Kala' },
];

const STATUS_OPTIONS: { value: IncidentStatus; label: string }[] = [
  { value: 'Açık', label: 'Açık' },
  { value: 'Kapandı', label: 'Kapandı' },
];

const INJURY_TYPE_OPTIONS = [
  { value: 'Kesik', label: 'Kesik' },
  { value: 'Yanık', label: 'Yanık' },
  { value: 'Kırık', label: 'Kırık' },
  { value: 'Ezilme', label: 'Ezilme' },
  { value: '—', label: '—' },
];

const BODY_PART_OPTIONS = [
  { value: 'El', label: 'El' },
  { value: 'Ayak', label: 'Ayak' },
  { value: 'Göz', label: 'Göz' },
  { value: 'Baş', label: 'Baş' },
  { value: 'Sırt', label: 'Sırt' },
  { value: '—', label: '—' },
];

const incidentFormSchema = z.object({
  type: z.enum(['İş Kazası', 'Ramak Kala']),
  employeeId: z.string().min(1, 'Employee is required'),
  dateTime: z.coerce.date(),
  location: z.string().min(1, 'Location is required'),
  injuryType: z.string().min(1),
  injuredBodyPart: z.string().min(1),
  rootCause: z.string().min(1, 'Root cause is required'),
  status: z.enum(['Açık', 'Kapandı']),
});

type IncidentFormValues = z.infer<typeof incidentFormSchema>;

function getSeverityColor(type: IncidentType): string {
  return type === 'İş Kazası' ? 'red' : 'yellow';
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
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
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const employeeOptions = useMemo(() => {
    let list = workers;
    if (selectedCompanyId) list = list.filter((w) => w.companyId === selectedCompanyId);
    return list.map((w) => ({ value: w.id, label: `${w.nameSurname}${w.jobTitle ? ` - ${w.jobTitle}` : ''}` }));
  }, [workers, selectedCompanyId]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    reset,
    formState: { errors },
  } = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      type: 'İş Kazası',
      employeeId: '',
      dateTime: new Date(),
      location: '',
      injuryType: 'Kesik',
      injuredBodyPart: 'El',
      rootCause: '',
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
    setEditingIncident(null);
    reset({
      type: 'İş Kazası',
      employeeId: '',
      dateTime: new Date(),
      location: '',
      injuryType: 'Kesik',
      injuredBodyPart: 'El',
      rootCause: '',
      status: 'Açık',
    });
    openModal();
  };

  const handleEdit = (incident: Incident) => {
    setEditingIncident(incident);
    setValue('type', incident.type);
    setValue('employeeId', incident.employeeId);
    setValue('dateTime', new Date(incident.dateTime));
    setValue('location', incident.location);
    setValue('injuryType', incident.injuryType);
    setValue('injuredBodyPart', incident.injuredBodyPart);
    setValue('rootCause', incident.rootCause);
    setValue('status', incident.status);
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
    setEditingIncident(null);
  };

  const onSubmit = (data: IncidentFormValues) => {
    const payload = {
      type: data.type,
      employeeId: data.employeeId,
      dateTime: new Date(data.dateTime).toISOString(),
      location: data.location,
      injuryType: data.injuryType,
      injuredBodyPart: data.injuredBodyPart,
      rootCause: data.rootCause,
      status: data.status,
    };
    if (editingIncident) {
      updateIncident(editingIncident.id, payload);
    } else {
      addIncident(payload);
    }
    handleCloseModal();
  };

  const handleDelete = (incident: Incident) => {
    if (window.confirm(t('incident.deleteConfirm'))) {
      deleteIncident(incident.id);
    }
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
                data={[
                  { value: '', label: t('incident.filterAll') },
                  ...INCIDENT_TYPE_OPTIONS,
                ]}
                value={filterType}
                onChange={(v) => setFilterType(v ?? '')}
                clearable
                style={{ minWidth: 140 }}
              />
              <Select
                size="xs"
                label={t('incident.filterStatus')}
                data={[
                  { value: '', label: t('incident.filterAll') },
                  ...STATUS_OPTIONS,
                ]}
                value={filterStatus}
                onChange={(v) => setFilterStatus(v ?? '')}
                clearable
                style={{ minWidth: 120 }}
              />
            </Group>
          </Stack>
        </Paper>

        <Paper withBorder>
          <Table.ScrollContainer minWidth={900}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>{t('incident.table.type')}</Table.Th>
                  <Table.Th>{t('incident.table.employee')}</Table.Th>
                  <Table.Th>{t('incident.table.dateTime')}</Table.Th>
                  <Table.Th>{t('incident.table.location')}</Table.Th>
                  <Table.Th>{t('incident.table.injuryType')}</Table.Th>
                  <Table.Th>{t('incident.table.injuredBodyPart')}</Table.Th>
                  <Table.Th>{t('incident.table.rootCause')}</Table.Th>
                  <Table.Th>{t('incident.table.status')}</Table.Th>
                  <Table.Th style={{ width: 60 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredIncidents.map((i) => {
                  const worker = workers.find((w) => w.id === i.employeeId);
                  return (
                    <Table.Tr key={i.id}>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          <Badge color={getSeverityColor(i.type)} size="sm">
                            {i.type}
                          </Badge>
                        </Text>
                      </Table.Td>
                      <Table.Td>{worker?.nameSurname ?? i.employeeId}</Table.Td>
                      <Table.Td>{formatDateTime(i.dateTime)}</Table.Td>
                      <Table.Td>{i.location}</Table.Td>
                      <Table.Td>{i.injuryType}</Table.Td>
                      <Table.Td>{i.injuredBodyPart}</Table.Td>
                      <Table.Td style={{ maxWidth: 200 }} title={i.rootCause}>
                        <Text size="sm" style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }} lineClamp={1}>
                          {i.rootCause}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={i.status === 'Açık' ? 'orange' : 'gray'} size="sm">
                          {i.status}
                        </Badge>
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
            <Text size="sm" c="dimmed" ta="center" py="xl">
              {t('incident.noIncidents')}
            </Text>
          )}
        </Paper>
      </Stack>

      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={editingIncident ? t('incident.editTitle') : t('incident.addTitle')}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack gap="md">
            <Select
              label={t('incident.form.type')}
              data={INCIDENT_TYPE_OPTIONS}
              value={watch('type')}
              onChange={(v) => setValue('type', (v as IncidentType) ?? 'İş Kazası')}
              error={errors.type?.message}
              required
            />
            <Select
              label={t('incident.form.employee')}
              placeholder={t('incident.form.employeePlaceholder')}
              data={employeeOptions}
              value={watch('employeeId') || null}
              onChange={(v) => setValue('employeeId', v ?? '')}
              error={errors.employeeId?.message}
              required
              searchable
            />
            <Controller
              name="dateTime"
              control={control}
              render={({ field }) => (
                <DatePickerInput
                  label={t('incident.form.dateTime')}
                  placeholder={t('incident.form.dateTimePlaceholder')}
                  valueFormat="DD.MM.YYYY"
                  value={field.value ?? null}
                  onChange={field.onChange}
                  error={errors.dateTime?.message}
                />
              )}
            />
            <TextInput
              label={t('incident.form.location')}
              placeholder={t('incident.form.locationPlaceholder')}
              {...register('location')}
              error={errors.location?.message}
              required
            />
            <Select
              label={t('incident.form.injuryType')}
              data={INJURY_TYPE_OPTIONS}
              value={watch('injuryType')}
              onChange={(v) => setValue('injuryType', v ?? '')}
              error={errors.injuryType?.message}
              required
            />
            <Select
              label={t('incident.form.injuredBodyPart')}
              data={BODY_PART_OPTIONS}
              value={watch('injuredBodyPart')}
              onChange={(v) => setValue('injuredBodyPart', v ?? '')}
              error={errors.injuredBodyPart?.message}
              required
            />
            <Textarea
              label={t('incident.form.rootCause')}
              placeholder={t('incident.form.rootCausePlaceholder')}
              {...register('rootCause')}
              error={errors.rootCause?.message}
              required
              minRows={2}
            />
            <Select
              label={t('incident.form.status')}
              data={STATUS_OPTIONS}
              value={watch('status')}
              onChange={(v) => setValue('status', (v as IncidentStatus) ?? 'Açık')}
              error={errors.status?.message}
              required
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" type="button" onClick={handleCloseModal}>
                {t('company.back')}
              </Button>
              <Button type="submit">
                {editingIncident ? t('company.save') : t('incident.addIncident')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
}
