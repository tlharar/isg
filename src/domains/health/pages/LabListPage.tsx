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
  Select,
  Anchor,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconTrash, IconFileSearch } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useLabStore, type LabExam, type LabExamType, type LabExamStatus, type DoctorEvaluation } from '../stores/labStore';
import { useWorkerStore } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';
import { LabModal, LAB_EXAM_TYPE_OPTIONS } from '../components/LabModal';

const EXAM_TYPE_LABELS: Record<LabExamType, string> = {
  AUDIOMETRY: 'Odyometri',
  SFT: 'SFT',
  HEMOGRAM: 'Hemogram',
  XRAY: 'Röntgen',
  EYE: 'Göz Muayenesi',
  ECG: 'EKG',
  OTHER: 'Diğer',
};

const STATUS_LABELS: Record<LabExamStatus, string> = {
  REQUESTED: 'Bekliyor',
  UPLOADED: 'Yüklendi',
  REVIEWED: 'İncelendi',
};

const EVALUATION_LABELS: Record<NonNullable<DoctorEvaluation>, string> = {
  NORMAL: 'Normal',
  RISKY: 'Riskli',
  REFERRAL: 'Sevk',
};

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('tr-TR');
}

export function LabListPage() {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const exams = useLabStore((s) => s.exams);
  const deleteExam = useLabStore((s) => s.deleteExam);
  const getWorkerById = useWorkerStore((s) => s.getWorkerById);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingExam, setEditingExam] = useState<LabExam | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const filteredExams = useMemo(() => {
    let list = [...exams];
    const workers = useWorkerStore.getState().workers;
    if (selectedCompanyId) {
      list = list.filter((e) => {
        const w = workers.find((x) => x.id === e.workerId);
        return w?.companyId === selectedCompanyId;
      });
    }
    if (filterType) list = list.filter((e) => e.type === filterType);
    if (filterStatus) list = list.filter((e) => e.status === filterStatus);
    return list.sort((a, b) => {
      const da = new Date(a.requestDate).getTime();
      const db = new Date(b.requestDate).getTime();
      return db - da;
    });
  }, [exams, selectedCompanyId, filterType, filterStatus]);

  const handleAdd = () => {
    setEditingExam(null);
    openModal();
  };

  const handleReview = (exam: LabExam) => {
    setEditingExam(exam);
    openModal();
  };

  const handleModalClose = () => {
    closeModal();
    setEditingExam(null);
  };

  const handleDelete = (exam: LabExam) => {
    const worker = getWorkerById(exam.workerId);
    modals.openConfirmModal({
      title: 'Tetkik kaydını sil',
      children: (
        <Text size="sm">
          {worker?.nameSurname ?? exam.workerId} — {EXAM_TYPE_LABELS[exam.type]} kaydı silinecek.
        </Text>
      ),
      labels: { confirm: 'Sil', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        deleteExam(exam.id);
        notifications.show({ title: 'Kayıt silindi', message: '', color: 'gray' });
      },
    });
  };

  const getStatusBadge = (status: LabExamStatus) => {
    switch (status) {
      case 'REQUESTED':
        return <Badge color="yellow" size="sm">{STATUS_LABELS.REQUESTED}</Badge>;
      case 'UPLOADED':
        return <Badge color="blue" size="sm">{STATUS_LABELS.UPLOADED}</Badge>;
      case 'REVIEWED':
        return <Badge color="green" size="sm">{STATUS_LABELS.REVIEWED}</Badge>;
      default:
        return <Badge size="sm">{status}</Badge>;
    }
  };

  const getEvaluationBadge = (evaluation: DoctorEvaluation) => {
    if (evaluation === null) return <Text size="sm" c="dimmed">—</Text>;
    switch (evaluation) {
      case 'NORMAL':
        return <Badge color="green" size="sm">{EVALUATION_LABELS.NORMAL}</Badge>;
      case 'RISKY':
        return <Badge color="red" size="sm">{EVALUATION_LABELS.RISKY}</Badge>;
      case 'REFERRAL':
        return <Badge color="orange" size="sm">{EVALUATION_LABELS.REFERRAL}</Badge>;
      default:
        return <Badge size="sm">{evaluation}</Badge>;
    }
  };

  const typeFilterOptions = [
    { value: '', label: 'Tüm tetkik türleri' },
    ...LAB_EXAM_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
  ];
  const statusFilterOptions = [
    { value: '', label: 'Tüm durumlar' },
    { value: 'REQUESTED', label: STATUS_LABELS.REQUESTED },
    { value: 'UPLOADED', label: STATUS_LABELS.UPLOADED },
    { value: 'REVIEWED', label: STATUS_LABELS.REVIEWED },
  ];

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap">
          <div>
            <Title order={2}>Tetkik Yönetimi</Title>
            <Text c="dimmed" size="sm">
              Lab tetkik talepleri, dosya yükleme ve doktor değerlendirmesi
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleAdd}>
            Yeni Tetkik Talebi
          </Button>
        </Group>

        <Paper withBorder p="md">
          <Group align="flex-end" gap="md" wrap="wrap">
            <Select
              label="Tetkik türü"
              placeholder="Tür seçin"
              data={typeFilterOptions}
              value={filterType}
              onChange={(v) => setFilterType(v ?? '')}
              clearable
              style={{ minWidth: 220 }}
            />
            <Select
              label="Durum"
              placeholder="Durum seçin"
              data={statusFilterOptions}
              value={filterStatus}
              onChange={(v) => setFilterStatus(v ?? '')}
              clearable
              style={{ minWidth: 180 }}
            />
          </Group>
        </Paper>

        <Paper withBorder>
          <Table.ScrollContainer minWidth={900}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tarih</Table.Th>
                  <Table.Th>Personel</Table.Th>
                  <Table.Th>Tetkik Türü</Table.Th>
                  <Table.Th>Durum</Table.Th>
                  <Table.Th>Sonuç</Table.Th>
                  <Table.Th>Dosya</Table.Th>
                  <Table.Th style={{ width: 56 }}>İşlemler</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredExams.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={7}>
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        Kayıt bulunamadı.
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredExams.map((e) => {
                    const worker = getWorkerById(e.workerId);
                    return (
                      <Table.Tr key={e.id}>
                        <Table.Td>{formatDate(e.requestDate)}</Table.Td>
                        <Table.Td>{worker?.nameSurname ?? e.workerId}</Table.Td>
                        <Table.Td>{EXAM_TYPE_LABELS[e.type]}</Table.Td>
                        <Table.Td>{getStatusBadge(e.status)}</Table.Td>
                        <Table.Td>{getEvaluationBadge(e.doctorEvaluation)}</Table.Td>
                        <Table.Td>
                          {e.fileUrl ? (
                            <Anchor href={e.fileUrl} target="_blank" rel="noopener noreferrer" size="sm">
                              Görüntüle
                            </Anchor>
                          ) : (
                            <Text size="sm" c="dimmed">—</Text>
                          )}
                        </Table.Td>
                        <Table.Td>
                          {e.status === 'UPLOADED' ? (
                            <Button
                              size="xs"
                              variant="light"
                              leftSection={<IconFileSearch size={14} />}
                              onClick={() => handleReview(e)}
                            >
                              İncele
                            </Button>
                          ) : (
                            <Menu shadow="md" width={120} position="bottom-end">
                              <Menu.Target>
                                <ActionIcon variant="subtle" size="sm">
                                  <IconDots size={16} />
                                </ActionIcon>
                              </Menu.Target>
                              <Menu.Dropdown>
                                <Menu.Item
                                  leftSection={<IconTrash size={14} />}
                                  color="red"
                                  onClick={() => handleDelete(e)}
                                >
                                  Sil
                                </Menu.Item>
                              </Menu.Dropdown>
                            </Menu>
                          )}
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

      <LabModal
        opened={modalOpened}
        onClose={handleModalClose}
        exam={editingExam}
        onSaved={() => {}}
      />
    </>
  );
}
