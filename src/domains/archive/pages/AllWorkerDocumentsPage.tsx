import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Title,
  Text,
  Table,
  Badge,
  Group,
  ActionIcon,
  Paper,
  Stack,
  Box,
  SimpleGrid,
  Select,
  TextInput,
  Anchor,
} from '@mantine/core';
import { IconDownload, IconPlus, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { WorkerDocumentModal } from '@domains/worker/components/WorkerDocumentModal';
import { useWorkerDocumentStore } from '@domains/worker/stores/workerDocumentStore';
import {
  WORKER_DOCUMENT_TYPE_LABELS,
  WORKER_DOCUMENT_STATUS_LABELS,
  type WorkerDocument,
  type WorkerDocumentType,
  type WorkerDocumentStatus,
} from '@domains/worker/stores/workerDocumentStore';
import { useWorkerStore } from '@store/workerStore';

const TYPE_OPTIONS = [
  { value: '', label: 'Tümü' },
  ...(Object.entries(WORKER_DOCUMENT_TYPE_LABELS) as [WorkerDocumentType, string][]).map(
    ([value, label]) => ({ value, label })
  ),
];

const STATUS_OPTIONS: { value: '' | WorkerDocumentStatus; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'VALID', label: WORKER_DOCUMENT_STATUS_LABELS.VALID },
  { value: 'EXPIRING_SOON', label: WORKER_DOCUMENT_STATUS_LABELS.EXPIRING_SOON },
  { value: 'EXPIRED', label: WORKER_DOCUMENT_STATUS_LABELS.EXPIRED },
];

function formatDate(value: Date | string | null): string {
  if (value == null) return '—';
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusBadgeColor(status: WorkerDocumentStatus): string {
  switch (status) {
    case 'VALID':
      return 'green';
    case 'EXPIRING_SOON':
      return 'yellow';
    case 'EXPIRED':
      return 'red';
    default:
      return 'gray';
  }
}

function getRowBg(status: WorkerDocumentStatus): string | undefined {
  switch (status) {
    case 'EXPIRED':
      return 'var(--mantine-color-red-0)';
    case 'EXPIRING_SOON':
      return 'var(--mantine-color-yellow-0)';
    default:
      return undefined;
  }
}

/**
 * Global Worker Documents page (Çalışan Belgeleri).
 * Documents are listed with worker name and job title (from workerStore). Title is auto from type.
 */
function downloadDocument(doc: WorkerDocument) {
  const url = doc.fileUrl.startsWith('data:') ? doc.fileUrl : doc.fileUrl;
  const name = doc.fileName || `${doc.title}.pdf`;
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
}

export function AllWorkerDocumentsPage() {
  const documents = useWorkerDocumentStore((s) => s.documents);
  const deleteDocument = useWorkerDocumentStore((s) => s.deleteDocument);
  const getExpiredDocumentsCount = useWorkerDocumentStore((s) => s.getExpiredDocumentsCount);
  const getExpiringSoonDocumentsCount = useWorkerDocumentStore((s) => s.getExpiringSoonDocumentsCount);
  const checkAllExpirations = useWorkerDocumentStore((s) => s.checkAllExpirations);
  const getWorkerById = useWorkerStore((s) => s.getWorkerById);
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);

  const [workerNameSearch, setWorkerNameSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    checkAllExpirations();
  }, [checkAllExpirations]);

  const stats = useMemo(() => {
    const total = documents.length;
    const expired = getExpiredDocumentsCount();
    const expiringSoon = getExpiringSoonDocumentsCount();
    return { total, expired, expiringSoon };
  }, [documents.length, getExpiredDocumentsCount, getExpiringSoonDocumentsCount]);

  const filtered = useMemo(() => {
    const search = workerNameSearch.trim().toLowerCase();
    return documents.filter((d) => {
      if (typeFilter && d.type !== typeFilter) return false;
      if (statusFilter && d.status !== statusFilter) return false;
      if (search) {
        const name = getWorkerById(d.workerId)?.nameSurname ?? d.workerId;
        const jobTitle = getWorkerById(d.workerId)?.jobTitle ?? '';
        const combined = `${name} ${jobTitle}`.toLowerCase();
        if (!combined.includes(search)) return false;
      }
      return true;
    });
  }, [documents, typeFilter, statusFilter, workerNameSearch, getWorkerById]);

  const handleDelete = (doc: WorkerDocument) => {
    const workerName = getWorkerById(doc.workerId)?.nameSurname ?? doc.workerId;
    modals.openConfirmModal({
      title: 'Belgeyi sil',
      children: (
        <Text size="sm">
          {workerName} — {WORKER_DOCUMENT_TYPE_LABELS[doc.type]} belgesini silmek istediğinize emin misiniz?
        </Text>
      ),
      labels: { confirm: 'Sil', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteDocument(doc.id),
    });
  };

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <Title order={3}>Çalışan Belgeleri (Tümü)</Title>
        <Button leftSection={<IconPlus size={18} />} onClick={openAddModal}>
          Yeni Belge Ekle
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="lg">
        <Paper p="md" withBorder>
          <Text size="sm" c="dimmed">
            Toplam Belge
          </Text>
          <Text fw={700} size="xl">
            {stats.total}
          </Text>
        </Paper>
        <Paper p="md" withBorder style={{ borderColor: 'var(--mantine-color-yellow-4)' }}>
          <Text size="sm" c="dimmed">
            Yaklaşanlar (&lt; 60 gün)
          </Text>
          <Text fw={700} size="xl" c="yellow.7">
            {stats.expiringSoon}
          </Text>
        </Paper>
        <Paper p="md" withBorder style={{ borderColor: 'var(--mantine-color-red-4)' }}>
          <Text size="sm" c="dimmed">
            Süresi Bitenler
          </Text>
          <Text fw={700} size="xl" c="red.7">
            {stats.expired}
          </Text>
        </Paper>
      </SimpleGrid>

      <Stack gap="md">
        <Group>
          <TextInput
            placeholder="Personel veya görev adına göre ara..."
            value={workerNameSearch}
            onChange={(e) => setWorkerNameSearch(e.currentTarget.value)}
            style={{ minWidth: 260 }}
          />
          <Select
            placeholder="Belge türü"
            data={TYPE_OPTIONS}
            value={typeFilter || null}
            onChange={(v) => setTypeFilter(v ?? '')}
            clearable
            style={{ minWidth: 220 }}
          />
          <Select
            placeholder="Durum"
            data={STATUS_OPTIONS}
            value={statusFilter || null}
            onChange={(v) => setStatusFilter(v ?? '')}
            clearable
            style={{ minWidth: 160 }}
          />
        </Group>

        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Personel</Table.Th>
                <Table.Th>Görevi</Table.Th>
                <Table.Th>Belge Türü</Table.Th>
                <Table.Th>Geçerlilik Tarihi</Table.Th>
                <Table.Th>Durum</Table.Th>
                <Table.Th>İşlemler</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filtered.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text size="sm" c="dimmed" ta="center" py="md">
                      {documents.length === 0
                        ? 'Henüz çalışan belgesi yok. "Yeni Belge Ekle" ile ekleyin.'
                        : 'Filtreye uyan belge yok.'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filtered.map((doc) => {
                  const worker = getWorkerById(doc.workerId);
                  const workerName = worker?.nameSurname ?? doc.workerId;
                  const jobTitle = worker?.jobTitle ?? '—';
                  return (
                    <Table.Tr key={doc.id} style={{ backgroundColor: getRowBg(doc.status) }}>
                      <Table.Td>
                        <Anchor
                          component={Link}
                          to={`/company/employees?workerId=${doc.workerId}`}
                          size="sm"
                        >
                          {workerName}
                        </Anchor>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {jobTitle}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {WORKER_DOCUMENT_TYPE_LABELS[doc.type]}
                        </Text>
                      </Table.Td>
                      <Table.Td>{formatDate(doc.expiryDate)}</Table.Td>
                      <Table.Td>
                        <Badge color={getStatusBadgeColor(doc.status)} size="sm">
                          {WORKER_DOCUMENT_STATUS_LABELS[doc.status]}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => downloadDocument(doc)}
                            aria-label="Dosyayı İndir"
                          >
                            <IconDownload size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleDelete(doc)}
                            aria-label="Sil"
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>

      <WorkerDocumentModal
        opened={addModalOpened}
        onClose={closeAddModal}
        onSaved={() => checkAllExpirations()}
      />
    </Box>
  );
}
