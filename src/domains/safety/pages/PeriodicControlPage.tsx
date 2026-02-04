import { useState, useMemo, useRef } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  Modal,
  Select,
  TextInput,
  FileButton,
  Badge,
  SimpleGrid,
  Card,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconAlertTriangle, IconCalendarMonth, IconCircleCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useWorkEquipmentStore,
  getControlStatus,
  type Equipment,
  type EquipmentType,
  type ControlResult,
} from '@store/workEquipmentStore';

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

export function PeriodicControlPage() {
  const equipment = useWorkEquipmentStore((s) => s.equipment);
  const addControlRecord = useWorkEquipmentStore((s) => s.addControlRecord);
  const getUpcomingControls = useWorkEquipmentStore((s) => s.getUpcomingControls);

  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
  const [formEquipmentId, setFormEquipmentId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState<Date | null>(new Date());
  const [formResult, setFormResult] = useState<ControlResult>('Pass');
  const [formPerformedBy, setFormPerformedBy] = useState('');
  const [formReportFile, setFormReportFile] = useState('');
  const fileResetRef = useRef<() => void>(null);

  const activeEquipment = useMemo(() => equipment.filter((e) => e.status === 'Active'), [equipment]);
  const equipmentOptions = useMemo(
    () => activeEquipment.map((e) => ({ value: e.id, label: `${e.name} (${e.serialNumber || e.id})` })),
    [activeEquipment]
  );

  const upcomingList = useMemo(() => getUpcomingControls(), [getUpcomingControls]);
  const stats = useMemo(() => {
    const overdue = equipment.filter((e) => e.status === 'Active' && getControlStatus(e) === 'overdue').length;
    const upcoming = equipment.filter((e) => e.status === 'Active' && getControlStatus(e) === 'upcoming').length;
    const safe = equipment.filter((e) => e.status === 'Active' && getControlStatus(e) === 'safe').length;
    return { overdue, upcoming, safe };
  }, [equipment]);

  const openAddControl = () => {
    setFormEquipmentId(activeEquipment[0]?.id ?? null);
    setFormDate(new Date());
    setFormResult('Pass');
    setFormPerformedBy('');
    setFormReportFile('');
    fileResetRef.current?.();
    openAddModal();
  };

  const handleSaveControl = () => {
    if (!formEquipmentId || !formDate) {
      notifications.show({ title: 'Hata', message: 'Ekipman ve kontrol tarihi seçin.', color: 'red' });
      return;
    }
    const dateStr = formDate instanceof Date ? formDate.toISOString().slice(0, 10) : String(formDate).slice(0, 10);
    addControlRecord(formEquipmentId, {
      date: dateStr,
      result: formResult,
      reportFile: formReportFile || 'yüklendi',
      performedBy: formPerformedBy.trim() || 'Belirtilmedi',
    });
    notifications.show({ title: 'Kontrol eklendi', message: 'Sonraki kontrol tarihi güncellendi.', color: 'green' });
    closeAddModal();
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Periyodik Kontrol Takibi</Title>
            <MantineText c="dimmed" size="sm">
              Yasal periyodik kontrollerin takip paneli.
            </MantineText>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAddControl}>
            Yeni Kontrol Ekle
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 3 }}>
          <Card withBorder padding="md" radius="md" style={{ borderLeft: '4px solid var(--mantine-color-red-6)' }}>
            <Group gap="xs">
              <IconAlertTriangle size={20} color="var(--mantine-color-red-6)" />
              <MantineText size="sm" c="dimmed" tt="uppercase" fw={600}>
                Gecikenler
              </MantineText>
            </Group>
            <MantineText fw={700} size="xl" mt="xs" c="red">
              {stats.overdue}
            </MantineText>
          </Card>
          <Card withBorder padding="md" radius="md" style={{ borderLeft: '4px solid var(--mantine-color-yellow-6)' }}>
            <Group gap="xs">
              <IconCalendarMonth size={20} color="var(--mantine-color-yellow-6)" />
              <MantineText size="sm" c="dimmed" tt="uppercase" fw={600}>
                Bu Ay Yapılacaklar
              </MantineText>
            </Group>
            <MantineText fw={700} size="xl" mt="xs" c="yellow.7">
              {stats.upcoming}
            </MantineText>
          </Card>
          <Card withBorder padding="md" radius="md" style={{ borderLeft: '4px solid var(--mantine-color-green-6)' }}>
            <Group gap="xs">
              <IconCircleCheck size={20} color="var(--mantine-color-green-6)" />
              <MantineText size="sm" c="dimmed" tt="uppercase" fw={600}>
                Uygun Olanlar
              </MantineText>
            </Group>
            <MantineText fw={700} size="xl" mt="xs" c="green">
              {stats.safe}
            </MantineText>
          </Card>
        </SimpleGrid>

        <Paper withBorder>
          <Table.ScrollContainer minWidth={700}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Ekipman</Table.Th>
                  <Table.Th>Tür</Table.Th>
                  <Table.Th>Konum</Table.Th>
                  <Table.Th>Son Kontrol</Table.Th>
                  <Table.Th>Sonraki Kontrol</Table.Th>
                  <Table.Th>Durum</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {upcomingList.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <MantineText size="sm" c="dimmed" ta="center" py="md">
                        Gecikmiş veya 30 gün içinde yapılacak kontrol yok.
                      </MantineText>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  upcomingList.map((eq) => {
                    const status = getControlStatus(eq);
                    const statusLabel = status === 'overdue' ? 'Gecikmiş' : status === 'upcoming' ? 'Yaklaşan' : 'Uygun';
                    const statusColor = status === 'overdue' ? 'red' : status === 'upcoming' ? 'yellow' : 'green';
                    return (
                      <Table.Tr key={eq.id}>
                        <Table.Td>{eq.name}</Table.Td>
                        <Table.Td>{TYPE_LABELS[eq.type]}</Table.Td>
                        <Table.Td>{eq.location || '—'}</Table.Td>
                        <Table.Td>{formatDate(eq.lastControlDate)}</Table.Td>
                        <Table.Td>
                          <MantineText size="sm" fw={status !== 'safe' ? 600 : undefined} c={status === 'overdue' ? 'red' : status === 'upcoming' ? 'yellow.7' : 'green.7'}>
                            {formatDate(eq.nextControlDate)}
                          </MantineText>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={statusColor} size="sm">
                            {statusLabel}
                          </Badge>
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

      {/* Yeni Kontrol Ekle Modal */}
      <Modal opened={addModalOpened} onClose={closeAddModal} title="Yeni Kontrol Ekle" size="md">
        <Stack gap="sm">
          <Select
            label="Ekipman"
            data={equipmentOptions}
            value={formEquipmentId}
            onChange={setFormEquipmentId}
            placeholder="Ekipman seçin"
            required
          />
          <DatePickerInput
            label="Kontrol Tarihi"
            value={formDate}
            onChange={setFormDate}
            valueFormat="DD.MM.YYYY"
            required
          />
          <Select
            label="Sonuç"
            data={[
              { value: 'Pass', label: 'Geçti' },
              { value: 'Fail', label: 'Kaldı' },
            ]}
            value={formResult}
            onChange={(v) => v && setFormResult(v as ControlResult)}
          />
          <MantineText size="sm" fw={500}>Rapor Dosyası</MantineText>
          <FileButton resetRef={fileResetRef} onChange={(f) => setFormReportFile(f?.name ?? '')}>
            {(props) => <Button variant="light" {...props}>Dosya Seç</Button>}
          </FileButton>
          {formReportFile && <MantineText size="xs" c="dimmed">Seçilen: {formReportFile}</MantineText>}
          <TextInput
            label="Kontrolü Yapan (Firma/Kişi)"
            placeholder="Firma veya kişi adı"
            value={formPerformedBy}
            onChange={(e) => setFormPerformedBy(e.target.value)}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeAddModal}>
              İptal
            </Button>
            <Button onClick={handleSaveControl}>Kaydet</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
