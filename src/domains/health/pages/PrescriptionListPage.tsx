import { useMemo, useState } from 'react';
import {
  Title,
  Text,
  Group,
  Stack,
  Paper,
  Table,
  TextInput,
  Badge,
  ActionIcon,
  Modal,
  List,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconEye, IconPrinter } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { usePrescriptionStore, type Prescription } from '@store/prescriptionStore';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function PrescriptionListPage() {
  const prescriptions = usePrescriptionStore((s) => s.prescriptions);
  const [patientFilter, setPatientFilter] = useState('');
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [detailPrescription, setDetailPrescription] = useState<Prescription | null>(null);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);

  const filteredPrescriptions = useMemo(() => {
    let list = [...prescriptions];
    const q = patientFilter.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.patientName.toLowerCase().includes(q) ||
          (p.tcNo && p.tcNo.includes(q))
      );
    }
    const [from, to] = dateRange;
    if (from) {
      const fromStr = from.toISOString().slice(0, 10);
      list = list.filter((p) => p.date >= fromStr);
    }
    if (to) {
      const toStr = to.toISOString().slice(0, 10);
      list = list.filter((p) => p.date <= toStr);
    }
    return list.sort((a, b) => (b.date > a.date ? 1 : -1));
  }, [prescriptions, patientFilter, dateRange]);

  const handleDetail = (p: Prescription) => {
    setDetailPrescription(p);
    openDetail();
  };

  const handlePrint = () => {
    notifications.show({
      title: 'Yazdır',
      message: 'Reçete PDF olarak hazırlanıyor...',
      color: 'blue',
    });
  };

  const handleCloseDetail = () => {
    closeDetail();
    setDetailPrescription(null);
  };

  return (
    <>
      <Stack gap="md">
        <div>
          <Title order={2}>Reçete Sorgula</Title>
          <Text c="dimmed" size="sm">
            Geçmiş reçeteleri görüntüleyin, filtreleyin ve yazdırın.
          </Text>
        </div>

        <Paper withBorder p="md">
          <Group align="flex-end" gap="md" mb="md" wrap="wrap">
            <TextInput
              placeholder="Hasta Adı / TC ile ara..."
              value={patientFilter}
              onChange={(e) => setPatientFilter(e.currentTarget.value)}
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

          <Table.ScrollContainer minWidth={700}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tarih</Table.Th>
                  <Table.Th>Hasta Adı</Table.Th>
                  <Table.Th>Tanı Sayısı</Table.Th>
                  <Table.Th>İlaç Sayısı</Table.Th>
                  <Table.Th>Durum</Table.Th>
                  <Table.Th>İşlemler</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredPrescriptions.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        Reçete bulunamadı.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredPrescriptions.map((p) => (
                    <Table.Tr key={p.id}>
                      <Table.Td>{formatDate(p.date)}</Table.Td>
                      <Table.Td>
                        <Text fw={600}>{p.patientName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" variant="light">
                          {p.diagnoses.length} Tanı
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge size="sm" variant="light" color="blue">
                          {p.drugs.length} İlaç
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge
                          size="sm"
                          color={p.status === 'Kaydedildi' ? 'green' : 'gray'}
                        >
                          {p.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={() => handleDetail(p)}
                            aria-label="Detay"
                          >
                            <IconEye size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            size="sm"
                            onClick={handlePrint}
                            aria-label="Yazdır"
                          >
                            <IconPrinter size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Stack>

      <Modal
        opened={detailOpened}
        onClose={handleCloseDetail}
        title="Reçete Detayı"
        size="md"
      >
        {detailPrescription && (
          <Stack gap="md">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">
                Tarih: {formatDate(detailPrescription.date)}
              </Text>
              <Badge
                color={detailPrescription.status === 'Kaydedildi' ? 'green' : 'gray'}
                size="sm"
              >
                {detailPrescription.status}
              </Badge>
            </Group>
            <Text fw={600}>{detailPrescription.patientName}</Text>
            {detailPrescription.tcNo && (
              <Text size="sm" c="dimmed">
                TC: {detailPrescription.tcNo}
              </Text>
            )}

            <div>
              <Text size="sm" fw={500} mb="xs">
                Tanılar
              </Text>
              {detailPrescription.diagnoses.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Tanı girilmemiş.
                </Text>
              ) : (
                <List size="sm" spacing="xs">
                  {detailPrescription.diagnoses.map((d, i) => (
                    <List.Item key={i}>{d}</List.Item>
                  ))}
                </List>
              )}
            </div>

            <div>
              <Text size="sm" fw={500} mb="xs">
                İlaçlar
              </Text>
              {detailPrescription.drugs.length === 0 ? (
                <Text size="sm" c="dimmed">
                  İlaç girilmemiş.
                </Text>
              ) : (
                <List size="sm" spacing="xs">
                  {detailPrescription.drugs.map((drug, i) => (
                    <List.Item key={i}>
                      {drug.name} — {drug.usageType}, {drug.dose}, {drug.boxCount} kutu, {drug.period} gün
                    </List.Item>
                  ))}
                </List>
              )}
            </div>
          </Stack>
        )}
      </Modal>
    </>
  );
}
