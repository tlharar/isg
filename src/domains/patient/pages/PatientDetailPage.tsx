import { useMemo, useState } from 'react';
import {
  Title,
  Text,
  Stack,
  Paper,
  Table,
  Button,
  Tabs,
  Group,
} from '@mantine/core';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { IconArrowLeft, IconFileDescription } from '@tabler/icons-react';
import { useReportsByPatient } from '@store/patientStore';
import { useWorkerStore } from '@store/workerStore';
import { useMedicalReportStore, type MedicalReport } from '@store/medicalReportStore';
import { MedicalReportModal } from '@domains/health/components/MedicalReportModal';

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function PatientDetailPage() {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const reports = useReportsByPatient(patientId);
  const getWorkerById = useWorkerStore((s) => s.getWorkerById);

  const [viewReport, setViewReport] = useState<MedicalReport | null>(null);
  const [reportModalOpened, setReportModalOpened] = useState(false);

  const patientDisplayName = useMemo(() => {
    if (reports.length > 0) return reports[0].patientName;
    if (patientId) {
      const worker = getWorkerById(patientId);
      if (worker) return worker.nameSurname;
    }
    return patientId ?? 'Hasta';
  }, [reports, patientId, getWorkerById]);

  const handleViewPrint = (report: MedicalReport) => {
    setViewReport(report);
    setReportModalOpened(true);
  };

  const handleCloseReportModal = () => {
    setReportModalOpened(false);
    setViewReport(null);
  };

  return (
    <Stack gap="lg">
      <Group>
        <Button
          component={Link}
          to="/health/prescription/query"
          variant="subtle"
          size="sm"
          leftSection={<IconArrowLeft size={16} />}
        >
          Geri
        </Button>
      </Group>

      <div>
        <Title order={2}>Hasta Detayı</Title>
        <Text c="dimmed" size="sm">
          {patientDisplayName}
          {patientId?.startsWith('tc-') && (
            <span> · TC: {patientId.replace('tc-', '')}</span>
          )}
        </Text>
      </div>

      <Tabs defaultValue="reports">
        <Tabs.List>
          <Tabs.Tab value="reports" leftSection={<IconFileDescription size={16} />}>
            İstirahat Raporları
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="reports" pt="md">
          <Paper withBorder p="md">
            {reports.length === 0 ? (
              <Text size="sm" c="dimmed" py="md">
                Bu hasta için kayıtlı istirahat raporu yok.
              </Text>
            ) : (
              <Table.ScrollContainer minWidth={600}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Başlangıç Tarihi</Table.Th>
                      <Table.Th>Bitiş Tarihi</Table.Th>
                      <Table.Th>Süre</Table.Th>
                      <Table.Th>Tanı</Table.Th>
                      <Table.Th>İşlemler</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {reports.map((r) => (
                      <Table.Tr key={r.id}>
                        <Table.Td>{formatDate(r.startDate)}</Table.Td>
                        <Table.Td>{formatDate(r.endDate)}</Table.Td>
                        <Table.Td>{r.days} Gün</Table.Td>
                        <Table.Td>{r.diagnosis || '—'}</Table.Td>
                        <Table.Td>
                          <Button
                            variant="light"
                            size="xs"
                            leftSection={<IconFileDescription size={14} />}
                            onClick={() => handleViewPrint(r)}
                          >
                            Görüntüle / Yazdır
                          </Button>
                        </Table.Td>
                      </Table.Tr>
                    ))}
                  </Table.Tbody>
                </Table>
              </Table.ScrollContainer>
            )}
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <MedicalReportModal
        opened={reportModalOpened}
        onClose={handleCloseReportModal}
        report={viewReport ?? undefined}
        viewMode={!!viewReport}
      />
    </Stack>
  );
}
