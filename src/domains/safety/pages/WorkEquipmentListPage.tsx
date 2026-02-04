import { useState, useMemo } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  Modal,
  TextInput,
  Select,
  NumberInput,
  ActionIcon,
  Menu,
  Badge,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconEdit, IconTrash, IconHistory } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useWorkEquipmentStore,
  getControlStatus,
  type Equipment,
  type EquipmentType,
  type EquipmentStatus,
} from '@store/workEquipmentStore';

const EQUIPMENT_TYPE_OPTIONS: { value: EquipmentType; label: string }[] = [
  { value: 'Lifting', label: 'Kaldırma' },
  { value: 'Pressure', label: 'Basınçlı Kap' },
  { value: 'Electrical', label: 'Elektrik' },
  { value: 'Machine', label: 'Tezgah' },
];

const STATUS_OPTIONS: { value: EquipmentStatus; label: string }[] = [
  { value: 'Active', label: 'Aktif' },
  { value: 'Scrap', label: 'Hurda' },
  { value: 'Out of Service', label: 'Devre Dışı' },
];

const TYPE_BADGE_COLORS: Record<EquipmentType, string> = {
  Lifting: 'blue',
  Pressure: 'orange',
  Electrical: 'yellow',
  Machine: 'grape',
};

const TYPE_LABELS: Record<EquipmentType, string> = {
  Lifting: 'Kaldırma',
  Pressure: 'Basınçlı Kap',
  Electrical: 'Elektrik',
  Machine: 'Tezgah',
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function NextControlCell({ equipment }: { equipment: Equipment }) {
  const status = getControlStatus(equipment);
  return (
    <MantineText size="sm" fw={status !== 'safe' ? 600 : undefined} c={status === 'overdue' ? 'red' : status === 'upcoming' ? 'yellow.7' : 'green.7'}>
      {formatDate(equipment.nextControlDate)}
    </MantineText>
  );
}

export function WorkEquipmentListPage() {
  const equipment = useWorkEquipmentStore((s) => s.equipment);
  const addEquipment = useWorkEquipmentStore((s) => s.addEquipment);
  const updateEquipment = useWorkEquipmentStore((s) => s.updateEquipment);
  const deleteEquipment = useWorkEquipmentStore((s) => s.deleteEquipment);
  const getControlRecordsByEquipmentId = useWorkEquipmentStore((s) => s.getControlRecordsByEquipmentId);

  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [historyOpened, { open: openHistory, close: closeHistory }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [historyEquipmentId, setHistoryEquipmentId] = useState<string | null>(null);

  const editingItem = useMemo(() => (editingId ? equipment.find((e) => e.id === editingId) : null), [editingId, equipment]);
  const historyRecords = useMemo(() => {
    if (!historyEquipmentId) return [];
    return getControlRecordsByEquipmentId(historyEquipmentId);
  }, [historyEquipmentId, getControlRecordsByEquipmentId]);
  const historyEquipment = useMemo(() => (historyEquipmentId ? equipment.find((e) => e.id === historyEquipmentId) : null), [historyEquipmentId, equipment]);

  const [form, setForm] = useState({
    name: '',
    type: 'Lifting' as EquipmentType,
    serialNumber: '',
    location: '',
    purchaseDate: new Date(),
    controlFrequencyMonths: 12,
    status: 'Active' as EquipmentStatus,
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({
      name: '',
      type: 'Lifting',
      serialNumber: '',
      location: '',
      purchaseDate: new Date(),
      controlFrequencyMonths: 12,
      status: 'Active',
    });
    openForm();
  };

  const openEdit = (eq: Equipment) => {
    setEditingId(eq.id);
    setForm({
      name: eq.name,
      type: eq.type,
      serialNumber: eq.serialNumber,
      location: eq.location,
      purchaseDate: eq.purchaseDate ? new Date(eq.purchaseDate + 'T12:00:00') : new Date(),
      controlFrequencyMonths: eq.controlFrequencyMonths,
      status: eq.status,
    });
    openForm();
  };

  const handleSaveForm = () => {
    if (!form.name.trim()) {
      notifications.show({ title: 'Hata', message: 'Ekipman adı girin.', color: 'red' });
      return;
    }
    const purchaseStr = form.purchaseDate instanceof Date ? form.purchaseDate.toISOString().slice(0, 10) : String(form.purchaseDate).slice(0, 10);
    if (editingItem) {
      updateEquipment(editingItem.id, {
        name: form.name.trim(),
        type: form.type,
        serialNumber: form.serialNumber.trim(),
        location: form.location.trim(),
        purchaseDate: purchaseStr,
        controlFrequencyMonths: form.controlFrequencyMonths,
        status: form.status,
      });
      notifications.show({ title: 'Güncellendi', message: 'Ekipman kaydı güncellendi.', color: 'green' });
    } else {
      addEquipment({
        name: form.name.trim(),
        type: form.type,
        serialNumber: form.serialNumber.trim(),
        location: form.location.trim(),
        purchaseDate: purchaseStr,
        lastControlDate: null,
        nextControlDate: null,
        controlFrequencyMonths: form.controlFrequencyMonths,
        status: form.status,
      });
      notifications.show({ title: 'Eklendi', message: 'Ekipman listeye eklendi.', color: 'green' });
    }
    closeForm();
  };

  const handleDelete = (eq: Equipment) => {
    if (window.confirm(`"${eq.name}" ekipmanını silmek istediğinize emin misiniz?`)) {
      deleteEquipment(eq.id);
      notifications.show({ title: 'Silindi', message: 'Ekipman kaldırıldı.', color: 'green' });
    }
  };

  const openHistoryModal = (eq: Equipment) => {
    setHistoryEquipmentId(eq.id);
    openHistory();
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>İş Ekipmanları Envanteri</Title>
            <MantineText c="dimmed" size="sm">
              Makine ve ekipman envanteri yönetimi.
            </MantineText>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAdd}>
            Yeni Ekipman Ekle
          </Button>
        </Group>

        <Paper withBorder>
          <Table.ScrollContainer minWidth={800}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Ad</Table.Th>
                  <Table.Th>Tür</Table.Th>
                  <Table.Th>Seri No</Table.Th>
                  <Table.Th>Konum</Table.Th>
                  <Table.Th>Durum</Table.Th>
                  <Table.Th>Sonraki Kontrol</Table.Th>
                  <Table.Th>İşlemler</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {equipment.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <MantineText size="sm" c="dimmed" ta="center" py="md">
                        Henüz ekipman kaydı yok.
                      </MantineText>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  equipment.map((eq) => (
                    <Table.Tr key={eq.id}>
                      <Table.Td>{eq.name}</Table.Td>
                      <Table.Td>
                        <Badge color={TYPE_BADGE_COLORS[eq.type]} size="sm" variant="light">
                          {TYPE_LABELS[eq.type]}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{eq.serialNumber || '—'}</Table.Td>
                      <Table.Td>{eq.location || '—'}</Table.Td>
                      <Table.Td>
                        <Badge color={eq.status === 'Active' ? 'green' : eq.status === 'Scrap' ? 'gray' : 'orange'} size="sm">
                          {STATUS_OPTIONS.find((s) => s.value === eq.status)?.label ?? eq.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <NextControlCell equipment={eq} />
                      </Table.Td>
                      <Table.Td>
                        <Menu shadow="md" width={200} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" size="sm">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => openEdit(eq)}>
                              Düzenle
                            </Menu.Item>
                            <Menu.Item leftSection={<IconHistory size={14} />} onClick={() => openHistoryModal(eq)}>
                              Geçmiş Kontrolleri Gör
                            </Menu.Item>
                            <Menu.Item leftSection={<IconTrash size={14} />} color="red" onClick={() => handleDelete(eq)}>
                              Sil
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Stack>

      {/* Add / Edit Modal */}
      <Modal opened={formOpened} onClose={closeForm} title={editingId ? 'Ekipman Düzenle' : 'Yeni Ekipman'} size="md">
        <Stack gap="sm">
          <TextInput label="Ad" placeholder="örn. Forklift 3 Ton" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <Select
            label="Tür"
            data={EQUIPMENT_TYPE_OPTIONS}
            value={form.type}
            onChange={(v) => v && setForm((f) => ({ ...f, type: v as EquipmentType }))}
          />
          <TextInput label="Seri No" placeholder="örn. FL-2021-001" value={form.serialNumber} onChange={(e) => setForm((f) => ({ ...f, serialNumber: e.target.value }))} />
          <TextInput label="Konum" placeholder="örn. Depo B" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} />
          <DatePickerInput
            label="Satın Alma Tarihi"
            value={form.purchaseDate}
            onChange={(d) => setForm((f) => ({ ...f, purchaseDate: d ?? new Date() }))}
            valueFormat="DD.MM.YYYY"
          />
          <NumberInput label="Kontrol Sıklığı (ay)" min={1} max={24} value={form.controlFrequencyMonths} onChange={(v) => setForm((f) => ({ ...f, controlFrequencyMonths: Number(v) || 12 }))} />
          <Select label="Durum" data={STATUS_OPTIONS} value={form.status} onChange={(v) => v && setForm((f) => ({ ...f, status: v as EquipmentStatus }))} />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeForm}>
              İptal
            </Button>
            <Button onClick={handleSaveForm}>Kaydet</Button>
          </Group>
        </Stack>
      </Modal>

      {/* History Modal */}
      <Modal opened={historyOpened} onClose={closeHistory} title={historyEquipment ? `Kontrol Geçmişi: ${historyEquipment.name}` : 'Kontrol Geçmişi'} size="md">
        {historyEquipment && (
          <Stack gap="xs">
            <MantineText size="sm" c="dimmed">
              Seri: {historyEquipment.serialNumber} · Konum: {historyEquipment.location}
            </MantineText>
            {historyRecords.length === 0 ? (
              <MantineText size="sm" c="dimmed">
                Henüz kontrol kaydı yok.
              </MantineText>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Tarih</Table.Th>
                    <Table.Th>Sonuç</Table.Th>
                    <Table.Th>Yapan</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {historyRecords.map((r) => (
                    <Table.Tr key={r.id}>
                      <Table.Td>{formatDate(r.date)}</Table.Td>
                      <Table.Td>
                        <Badge color={r.result === 'Pass' ? 'green' : 'red'} size="sm">
                          {r.result === 'Pass' ? 'Geçti' : 'Kaldı'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{r.performedBy || '—'}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        )}
      </Modal>
    </>
  );
}
