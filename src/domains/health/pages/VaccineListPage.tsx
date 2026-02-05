import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Badge,
  Select,
  Anchor,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useVaccineStore, type VaccineRecord, type VaccineType, type VaccineStatus } from '../stores/vaccineStore';
import { useWorkerStore } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';
import { VaccineModal } from '../components/VaccineModal';

const VACCINE_TYPE_LABELS: Record<VaccineType, string> = {
  TETANUS: 'Tetanoz',
  HEPATITIS_B: 'Hepatit B',
  INFLUENZA: 'Grip',
  COVID19: 'COVID-19',
  OTHER: 'Diğer',
};

const STATUS_LABELS: Record<VaccineStatus, string> = {
  PENDING: 'Bekliyor',
  COMPLETED: 'Tamamlandı',
  REFUSED: 'Reddetti',
};

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('tr-TR');
}

function isOverdue(nextDose: Date | string | null): boolean {
  if (!nextDose) return false;
  const d = typeof nextDose === 'string' ? new Date(nextDose) : nextDose;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d.getTime() <= today.getTime();
}

function isUpcomingThisWeek(nextDose: Date | string | null): boolean {
  if (!nextDose) return false;
  const d = typeof nextDose === 'string' ? new Date(nextDose) : new Date(nextDose);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfWeek = new Date(today);
  endOfWeek.setDate(endOfWeek.getDate() + 7);
  d.setHours(0, 0, 0, 0);
  return d.getTime() >= today.getTime() && d.getTime() <= endOfWeek.getTime();
}

export function VaccineListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const workerIdFromUrl = searchParams.get('workerId') ?? '';

  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const records = useVaccineStore((s) => s.records);
  const deleteVaccine = useVaccineStore((s) => s.deleteVaccine);
  const getWorkerById = useWorkerStore((s) => s.getWorkerById);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingRecord, setEditingRecord] = useState<VaccineRecord | null>(null);
  const [filterUpcoming, setFilterUpcoming] = useState<string>('');

  const workerFromUrl = workerIdFromUrl ? getWorkerById(workerIdFromUrl) : null;

  const filteredRecords = useMemo(() => {
    let list = [...records];
    const workers = useWorkerStore.getState().workers;
    if (selectedCompanyId) {
      list = list.filter((r) => {
        const w = workers.find((x) => x.id === r.workerId);
        return w?.companyId === selectedCompanyId;
      });
    }
    if (workerIdFromUrl) {
      list = list.filter((r) => r.workerId === workerIdFromUrl);
    }
    if (filterUpcoming === 'upcoming') {
      list = list.filter(
        (r) => r.status !== 'REFUSED' && isUpcomingThisWeek(r.nextDoseDate)
      );
    }
    if (filterUpcoming === 'overdue') {
      list = list.filter(
        (r) => r.status !== 'REFUSED' && r.nextDoseDate && isOverdue(r.nextDoseDate)
      );
    }
    return list.sort((a, b) => {
      const da = new Date(a.applicationDate).getTime();
      const db = new Date(b.applicationDate).getTime();
      return db - da;
    });
  }, [records, selectedCompanyId, workerIdFromUrl, filterUpcoming]);

  const clearWorkerFilter = () => {
    searchParams.delete('workerId');
    setSearchParams(searchParams, { replace: true });
  };

  const handleAdd = () => {
    setEditingRecord(null);
    openModal();
  };

  const handleEdit = (record: VaccineRecord) => {
    setEditingRecord(record);
    openModal();
  };

  const handleModalClose = () => {
    closeModal();
    setEditingRecord(null);
  };

  const handleDelete = (record: VaccineRecord) => {
    const worker = getWorkerById(record.workerId);
    modals.openConfirmModal({
      title: 'Aşı kaydını sil',
      children: (
        <Text size="sm">
          {worker?.nameSurname ?? record.workerId} — {VACCINE_TYPE_LABELS[record.vaccineType]} doz {record.doseNumber} kaydı silinecek.
        </Text>
      ),
      labels: { confirm: 'Sil', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        deleteVaccine(record.id);
        notifications.show({ title: 'Kayıt silindi', message: '', color: 'gray' });
      },
    });
  };

  const getStatusBadge = (r: VaccineRecord) => {
    if (r.status === 'REFUSED') {
      return <Badge color="gray" size="sm">Reddetti</Badge>;
    }
    if (r.status === 'COMPLETED') {
      if (r.nextDoseDate && isOverdue(r.nextDoseDate)) {
        return <Badge color="red" size="sm">Gecikti / Zamanı geldi</Badge>;
      }
      return <Badge color="green" size="sm">Tamamlandı</Badge>;
    }
    if (r.status === 'PENDING') {
      if (r.nextDoseDate && isOverdue(r.nextDoseDate)) {
        return <Badge color="red" size="sm">Gecikti / Zamanı geldi</Badge>;
      }
      return <Badge color="yellow" size="sm">Bekliyor</Badge>;
    }
    return <Badge size="sm">{STATUS_LABELS[r.status]}</Badge>;
  };

  const filterOptions = [
    { value: '', label: 'Tümü' },
    { value: 'upcoming', label: 'Gelecek aşılar (bu hafta)' },
    { value: 'overdue', label: 'Gecikmiş / Zamanı gelen' },
  ];

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap">
          <div>
            <Title order={2}>Aşı Takibi</Title>
            <Text c="dimmed" size="sm">
              Personel aşı kayıtları, gelecek dozlar ve redler
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
            Yeni Aşı Kaydı
          </Button>
        </Group>

        {workerIdFromUrl && workerFromUrl && (
          <Paper withBorder p="sm" bg="var(--mantine-color-blue-light)">
            <Group justify="space-between">
              <Text size="sm">
                <Text span fw={500}>Personel aşı geçmişi: </Text>
                {workerFromUrl.nameSurname}
              </Text>
              <Anchor size="sm" onClick={clearWorkerFilter}>
                Filtreyi kaldır
              </Anchor>
            </Group>
          </Paper>
        )}

        <Paper withBorder p="md">
          <Group align="flex-end" gap="md" wrap="wrap">
            <Select
              label="Filtre"
              placeholder="Filtre seçin"
              data={filterOptions}
              value={filterUpcoming}
              onChange={(v) => setFilterUpcoming(v ?? '')}
              clearable
              style={{ minWidth: 220 }}
            />
          </Group>
        </Paper>

        <Paper withBorder>
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Personel</Table.Th>
                  <Table.Th>Aşı Tipi</Table.Th>
                  <Table.Th>Doz</Table.Th>
                  <Table.Th>İşlem Tarihi</Table.Th>
                  <Table.Th>Gelecek Doz</Table.Th>
                  <Table.Th>Durum</Table.Th>
                  <Table.Th style={{ width: 56 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredRecords.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        Kayıt bulunamadı.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredRecords.map((r) => {
                    const worker = getWorkerById(r.workerId);
                    return (
                      <Table.Tr key={r.id}>
                        <Table.Td>{worker?.nameSurname ?? r.workerId}</Table.Td>
                        <Table.Td>{VACCINE_TYPE_LABELS[r.vaccineType]}</Table.Td>
                        <Table.Td>
                          {r.doseNumber}
                          {r.isBooster ? ' (Rapel)' : ''}
                        </Table.Td>
                        <Table.Td>{formatDate(r.applicationDate)}</Table.Td>
                        <Table.Td>
                          {r.nextDoseDate ? formatDate(r.nextDoseDate) : '—'}
                        </Table.Td>
                        <Table.Td>{getStatusBadge(r)}</Table.Td>
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
                                onClick={() => handleEdit(r)}
                              >
                                Düzenle
                              </Menu.Item>
                              <Menu.Item
                                leftSection={<IconTrash size={14} />}
                                color="red"
                                onClick={() => handleDelete(r)}
                              >
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

      <VaccineModal
        opened={modalOpened}
        onClose={handleModalClose}
        record={editingRecord}
        preselectedWorkerId={workerIdFromUrl || undefined}
      />
    </>
  );
}
