import { useMemo, useState } from 'react';
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
  TextInput,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconEdit, IconTrash } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { usePolyclinicStore, type PolyclinicRecord, type PolyclinicOutcome } from '../stores/polyclinicStore';
import { useWorkerStore } from '@store/workerStore';
import { PolyclinicModal } from '../components/PolyclinicModal';

const OUTCOME_LABELS: Record<PolyclinicOutcome, string> = {
  WORK: 'İşine Döndü',
  REST: 'İstirahat',
  HOSPITAL: 'Hastaneye Sevk',
  HOME: 'Eve Gönderildi',
};

const OUTCOME_COLORS: Record<PolyclinicOutcome, string> = {
  WORK: 'green',
  REST: 'orange',
  HOSPITAL: 'red',
  HOME: 'gray',
};

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PolyclinicPage() {
  const records = usePolyclinicStore((s) => s.records);
  const deleteRecord = usePolyclinicStore((s) => s.deleteRecord);
  const getWorkerById = useWorkerStore((s) => s.getWorkerById);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingRecord, setEditingRecord] = useState<PolyclinicRecord | null>(null);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [searchName, setSearchName] = useState('');

  const filteredRecords = useMemo(() => {
    let list = [...records];
    const [start, end] = dateRange;
    if (start) {
      const s = start.getTime();
      list = list.filter((r) => {
        const t = new Date(r.date).getTime();
        return t >= s;
      });
    }
    if (end) {
      const e = new Date(end);
      e.setHours(23, 59, 59, 999);
      const endMs = e.getTime();
      list = list.filter((r) => new Date(r.date).getTime() <= endMs);
    }
    const q = searchName.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const worker = getWorkerById(r.workerId);
        return worker?.nameSurname?.toLowerCase().includes(q);
      });
    }
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [records, dateRange, searchName, getWorkerById]);

  const handleAdd = () => {
    setEditingRecord(null);
    openModal();
  };

  const handleEdit = (record: PolyclinicRecord) => {
    setEditingRecord(record);
    openModal();
  };

  const handleModalClose = () => {
    closeModal();
    setEditingRecord(null);
  };

  const handleDelete = (record: PolyclinicRecord) => {
    const worker = getWorkerById(record.workerId);
    modals.openConfirmModal({
      title: 'Kaydı Sil',
      children: (
        <Text size="sm">
          Protokol No {record.protocolNumber} — {worker?.nameSurname ?? record.workerId} kaydı silinecek.
        </Text>
      ),
      labels: { confirm: 'Sil', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        deleteRecord(record.id);
        notifications.show({ title: 'Kayıt silindi', color: 'gray' });
      },
    });
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap">
          <div>
            <Title order={2}>Poliklinik Defteri</Title>
            <Text c="dimmed" size="sm">
              İşyeri hekimi / hemşire muayene kayıtları
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
            Yeni Muayene Ekle
          </Button>
        </Group>

        <Paper withBorder p="md">
          <Group align="flex-end" gap="md" wrap="wrap">
            <TextInput
              placeholder="Personel adı ile ara..."
              value={searchName}
              onChange={(e) => setSearchName(e.currentTarget.value)}
              style={{ minWidth: 220 }}
            />
            <DatePickerInput
              type="range"
              placeholder="Tarih aralığı"
              value={dateRange}
              onChange={setDateRange}
              valueFormat="DD.MM.YYYY"
              clearable
              style={{ minWidth: 260 }}
            />
          </Group>
        </Paper>

        <Paper withBorder>
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tarih</Table.Th>
                  <Table.Th>Protokol No</Table.Th>
                  <Table.Th>Personel Adı</Table.Th>
                  <Table.Th>Şikayet</Table.Th>
                  <Table.Th>Tanı</Table.Th>
                  <Table.Th>Sonuç</Table.Th>
                  <Table.Th style={{ width: 60 }} />
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
                        <Table.Td>{formatDate(r.date)}</Table.Td>
                        <Table.Td>{r.protocolNumber}</Table.Td>
                        <Table.Td>{worker?.nameSurname ?? r.workerId}</Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={2}>
                            {r.complaint || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" lineClamp={2}>
                            {r.diagnosis || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge size="sm" color={OUTCOME_COLORS[r.outcome]} variant="light">
                            {OUTCOME_LABELS[r.outcome]}
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

      <PolyclinicModal
        opened={modalOpened}
        onClose={handleModalClose}
        record={editingRecord}
      />
    </>
  );
}
