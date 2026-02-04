import { useState, useMemo, useRef } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  ActionIcon,
  Menu,
  Modal,
  Select,
  Textarea,
  SimpleGrid,
  Card,
  Badge,
  FileButton,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconEdit, IconTrash, IconCheck, IconAlertTriangle } from '@tabler/icons-react';
import { useForm, Controller } from 'react-hook-form';
import {
  useDofStore,
  isOverdue,
  type DofRecord,
  type DofSource,
  type DofType,
  type DofStatus,
} from '@store/dofStore';
import { useAppStore } from '@shared/stores/appStore';
import { useWorkerStore } from '@store/workerStore';
import { notifications } from '@mantine/notifications';

const SOURCE_OPTIONS: { value: DofSource; label: string }[] = [
  { value: 'Risk Analizi', label: 'Risk Analizi' },
  { value: 'Saha Denetimi', label: 'Saha Denetimi' },
  { value: 'İş Kazası', label: 'İş Kazası' },
  { value: 'Çalışan Önerisi', label: 'Çalışan Önerisi' },
  { value: 'Kurul Kararı', label: 'Kurul Kararı' },
];

const TYPE_OPTIONS: { value: DofType; label: string }[] = [
  { value: 'Düzenleyici', label: 'Düzenleyici' },
  { value: 'Önleyici', label: 'Önleyici' },
];

const DESCRIPTION_MAX_LENGTH = 60;

function truncate(str: string, max: number): string {
  if (!str) return '—';
  return str.length <= max ? str : `${str.slice(0, max)}…`;
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusBadge(status: DofStatus) {
  const map: Record<DofStatus, { color: string; label: string }> = {
    Açık: { color: 'orange', label: 'Açık' },
    Kapandı: { color: 'green', label: 'Kapandı' },
    İptal: { color: 'gray', label: 'İptal' },
  };
  const { color, label } = map[status];
  return <Badge color={color} size="sm">{label}</Badge>;
}

type CreateForm = Omit<DofRecord, 'id' | 'status' | 'resultDescription' | 'closingDate'>;

export function DofPage() {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const workers = useWorkerStore((s) => s.workers);
  const records = useDofStore((s) => s.records);
  const addDof = useDofStore((s) => s.addDof);
  const updateDof = useDofStore((s) => s.updateDof);
  const closeDof = useDofStore((s) => s.closeDof);
  const deleteDof = useDofStore((s) => s.deleteDof);
  const getDofById = useDofStore((s) => s.getDofById);

  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [closeOpened, { open: openClose, close: closeClose }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const fileButtonResetRef = useRef<() => void>(null);

  const companyRecords = useMemo(() => {
    if (!selectedCompanyId) return records;
    return records.filter((r) => r.companyId === selectedCompanyId);
  }, [records, selectedCompanyId]);

  const stats = useMemo(() => {
    const open = companyRecords.filter((r) => r.status === 'Açık');
    const overdue = open.filter((r) => isOverdue(r));
    const closed = companyRecords.filter((r) => r.status === 'Kapandı');
    return { open: open.length, overdue: overdue.length, closed: closed.length };
  }, [companyRecords]);

  const responsibleOptions = useMemo(() => {
    let list = workers;
    if (selectedCompanyId) list = list.filter((w) => w.companyId === selectedCompanyId);
    return list.map((w) => ({ value: w.nameSurname, label: w.nameSurname }));
  }, [workers, selectedCompanyId]);

  const closingRecord = closingId ? getDofById(closingId) ?? null : null;

  const { handleSubmit: handleCreateSubmit, setValue: setCreateValue, watch: watchCreate, control: controlCreate, reset: resetCreate } = useForm<CreateForm>({
    defaultValues: {
      companyId: selectedCompanyId ?? '',
      source: 'Saha Denetimi',
      type: 'Düzenleyici',
      description: '',
      responsible: '',
      deadline: new Date().toISOString().slice(0, 10),
    },
  });

  const { handleSubmit: handleCloseSubmit, control: controlClose, reset: resetClose } = useForm<{
    resultDescription: string;
    closingDate: Date | null;
  }>({
    defaultValues: { resultDescription: '', closingDate: new Date() },
  });

  const handleAdd = () => {
    setEditingId(null);
    resetCreate({
      companyId: selectedCompanyId ?? '',
      source: 'Saha Denetimi',
      type: 'Düzenleyici',
      description: '',
      responsible: '',
      deadline: new Date().toISOString().slice(0, 10),
    });
    openCreate();
  };

  const handleEdit = (record: DofRecord) => {
    setEditingId(record.id);
    setCreateValue('companyId', record.companyId);
    setCreateValue('source', record.source);
    setCreateValue('type', record.type);
    setCreateValue('description', record.description);
    setCreateValue('responsible', record.responsible);
    setCreateValue('deadline', record.deadline);
    openCreate();
  };

  const handleCloseModal = () => {
    closeCreate();
    setEditingId(null);
  };

  const onSubmitCreate = (data: CreateForm) => {
    const deadlineStr = typeof data.deadline === 'string' ? data.deadline : new Date(data.deadline).toISOString().slice(0, 10);
    const payload = { ...data, deadline: deadlineStr };
    if (editingId) {
      updateDof(editingId, payload);
    } else {
      if (!payload.companyId) {
        notifications.show({ title: 'Hata', message: 'Şirket seçin.', color: 'red' });
        return;
      }
      addDof({ ...payload, status: 'Açık' });
    }
    handleCloseModal();
  };

  const handleOpenCloseModal = (record: DofRecord) => {
    setClosingId(record.id);
    resetClose({ resultDescription: '', closingDate: new Date() });
    openClose();
  };

  const handleCloseDofModal = () => {
    closeClose();
    setClosingId(null);
    fileButtonResetRef.current?.();
  };

  const onSubmitClose = (data: { resultDescription: string; closingDate: Date | null }) => {
    if (!closingId) return;
    const closingDateStr = data.closingDate ? new Date(data.closingDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
    closeDof(closingId, data.resultDescription.trim() || 'Kapatıldı.', closingDateStr);
    notifications.show({ title: 'DÖF kapatıldı', message: 'Kayıt güncellendi.', color: 'green' });
    handleCloseDofModal();
  };

  const handleDelete = (record: DofRecord) => {
    if (window.confirm('Bu DÖF kaydını silmek istediğinize emin misiniz?')) deleteDof(record.id);
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Düzenleyici ve Önleyici Faaliyetler (DÖF)</Title>
            <MantineText c="dimmed" size="sm">
              OHS aksiyon takip ve kapanış kayıtları.
            </MantineText>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
            Yeni DÖF
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Card withBorder padding="md" radius="md">
            <MantineText size="sm" c="dimmed" tt="uppercase" fw={600}>
              Açık DÖF
            </MantineText>
            <MantineText fw={700} size="xl" mt="xs">
              {stats.open}
            </MantineText>
          </Card>
          <Card withBorder padding="md" radius="md">
            <MantineText size="sm" c="dimmed" tt="uppercase" fw={600}>
              Gecikmiş
            </MantineText>
            <MantineText fw={700} size="xl" mt="xs" c="red">
              {stats.overdue}
            </MantineText>
          </Card>
          <Card withBorder padding="md" radius="md">
            <MantineText size="sm" c="dimmed" tt="uppercase" fw={600}>
              Kapanan
            </MantineText>
            <MantineText fw={700} size="xl" mt="xs" c="green">
              {stats.closed}
            </MantineText>
          </Card>
        </SimpleGrid>

        <Paper withBorder>
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Kaynak</Table.Th>
                  <Table.Th>Açıklama</Table.Th>
                  <Table.Th>Sorumlu</Table.Th>
                  <Table.Th>Termin Tarihi</Table.Th>
                  <Table.Th>Durum</Table.Th>
                  <Table.Th>İşlemler</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {companyRecords.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <MantineText size="sm" c="dimmed" ta="center" py="md">
                        Bu şirket için DÖF kaydı yok.
                      </MantineText>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  companyRecords.map((r) => {
                    const overdue = isOverdue(r);
                    return (
                      <Table.Tr key={r.id}>
                        <Table.Td>{r.source}</Table.Td>
                        <Table.Td>{truncate(r.description, DESCRIPTION_MAX_LENGTH)}</Table.Td>
                        <Table.Td>{r.responsible || '—'}</Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {overdue && <IconAlertTriangle size={16} color="var(--mantine-color-red-6)" />}
                            <MantineText size="sm" c={overdue ? 'red' : undefined} fw={overdue ? 600 : undefined}>
                              {formatDate(r.deadline)}
                            </MantineText>
                          </Group>
                        </Table.Td>
                        <Table.Td>{getStatusBadge(r.status)}</Table.Td>
                        <Table.Td>
                          <Menu shadow="md" width={180} position="bottom-end">
                            <Menu.Target>
                              <ActionIcon variant="subtle" size="sm">
                                <IconDots size={16} />
                              </ActionIcon>
                            </Menu.Target>
                            <Menu.Dropdown>
                              {r.status === 'Açık' && (
                                <Menu.Item
                                  leftSection={<IconCheck size={14} />}
                                  onClick={() => handleOpenCloseModal(r)}
                                >
                                  Kapat
                                </Menu.Item>
                              )}
                              <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => handleEdit(r)}>
                                Detay / Düzenle
                              </Menu.Item>
                              <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => handleDelete(r)}>
                                Sil
                              </Menu.Item>
                            </Menu.Dropdown>
                          </Menu>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Stack>

      {/* Create / Edit Modal */}
      <Modal
        opened={createOpened}
        onClose={handleCloseModal}
        title={editingId ? 'DÖF Düzenle' : 'Yeni DÖF'}
        size="md"
      >
        <form onSubmit={handleCreateSubmit(onSubmitCreate)}>
          <Stack gap="md">
            <Select
              label="Kaynak"
              data={SOURCE_OPTIONS}
              value={watchCreate('source')}
              onChange={(v) => setCreateValue('source', (v as DofSource) ?? 'Saha Denetimi')}
              required
            />
            <Select
              label="Tür"
              data={TYPE_OPTIONS}
              value={watchCreate('type')}
              onChange={(v) => setCreateValue('type', (v as DofType) ?? 'Düzenleyici')}
              required
            />
            <Textarea
              label="Problem tanımı / Açıklama"
              placeholder="DÖF açıklaması"
              value={watchCreate('description')}
              onChange={(e) => setCreateValue('description', e.currentTarget.value)}
              minRows={2}
              required
            />
            <Select
              label="Sorumlu"
              placeholder="Sorumlu seçin"
              data={responsibleOptions}
              value={watchCreate('responsible') || null}
              onChange={(v) => setCreateValue('responsible', v ?? '')}
              searchable
            />
            <Controller
              name="deadline"
              control={controlCreate}
              render={({ field }) => (
                <DatePickerInput
                  label="Termin Tarihi"
                  valueFormat="DD.MM.YYYY"
                  value={field.value ? new Date(field.value) : null}
                  onChange={(d) => setCreateValue('deadline', d ? new Date(d).toISOString().slice(0, 10) : '')}
                />
              )}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" type="button" onClick={handleCloseModal}>
                İptal
              </Button>
              <Button type="submit">{editingId ? 'Kaydet' : 'Oluştur'}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Close DÖF Modal */}
      <Modal
        opened={closeOpened}
        onClose={handleCloseDofModal}
        title="DÖF Kapat"
        size="md"
      >
        {closingRecord && (
          <form onSubmit={handleCloseSubmit(onSubmitClose)}>
            <Stack gap="md">
              <MantineText size="sm" c="dimmed">
                Kapatılan kayıt: {truncate(closingRecord.description, 80)}
              </MantineText>
              <Controller
                name="resultDescription"
                control={controlClose}
                render={({ field }) => (
                  <Textarea
                    label="Yapılan İşlem Açıklaması"
                    placeholder="Nasıl giderildi?"
                    value={field.value}
                    onChange={(e) => field.onChange(e.currentTarget.value)}
                    minRows={3}
                    required
                  />
                )}
              />
              <Controller
                name="closingDate"
                control={controlClose}
                render={({ field }) => (
                  <DatePickerInput
                    label="Kapanış Tarihi"
                    valueFormat="DD.MM.YYYY"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <FileButton
                resetRef={fileButtonResetRef}
                onChange={() => notifications.show({ title: 'Dosya seçildi', message: 'Kanıt fotoğrafı (mock) yüklendi.', color: 'blue' })}
                accept="image/png,image/jpeg,image/webp"
              >
                {(props) => (
                  <Button {...props} variant="light" size="sm">
                    Kanıt Fotoğrafı Yükle
                  </Button>
                )}
              </FileButton>
              <Group justify="flex-end" mt="md">
                <Button variant="default" type="button" onClick={handleCloseDofModal}>
                  İptal
                </Button>
                <Button type="submit">Kapat</Button>
              </Group>
            </Stack>
          </form>
        )}
      </Modal>

    </>
  );
}
