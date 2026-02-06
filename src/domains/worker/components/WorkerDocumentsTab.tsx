import { useEffect, useMemo, useState } from 'react';
import {
  Title,
  Text,
  Button,
  Table,
  Badge,
  Group,
  ActionIcon,
  Paper,
  Stack,
  Box,
} from '@mantine/core';
import { IconPlus, IconDownload, IconTrash } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import {
  useWorkerDocumentStore,
  WORKER_DOCUMENT_TYPE_LABELS,
  WORKER_DOCUMENT_STATUS_LABELS,
  type WorkerDocument,
  type WorkerDocumentStatus,
} from '../stores/workerDocumentStore';
import { WorkerDocumentModal } from './WorkerDocumentModal';

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

function openDocumentInNewTab(doc: WorkerDocument) {
  const url = doc.fileUrl.startsWith('data:') ? doc.fileUrl : doc.fileUrl;
  window.open(url, '_blank', 'noopener,noreferrer');
}

interface WorkerDocumentsTabProps {
  workerId: string;
}

export function WorkerDocumentsTab({ workerId }: WorkerDocumentsTabProps) {
  const allDocuments = useWorkerDocumentStore((s) => s.documents);
  const deleteDocument = useWorkerDocumentStore((s) => s.deleteDocument);
  const checkDocumentExpirations = useWorkerDocumentStore((s) => s.checkDocumentExpirations);
  const [modalOpened, setModalOpened] = useState(false);

  const documents = useMemo(
    () => allDocuments.filter((d) => d.workerId === workerId),
    [allDocuments, workerId]
  );

  useEffect(() => {
    checkDocumentExpirations(workerId);
  }, [workerId, checkDocumentExpirations]);

  const handleDelete = (doc: WorkerDocument) => {
    modals.openConfirmModal({
      title: 'Belgeyi sil',
      children: (
        <Text size="sm">
          "{doc.title}" belgesini silmek istediğinize emin misiniz?
        </Text>
      ),
      labels: { confirm: 'Sil', cancel: 'İptal' },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteDocument(doc.id),
    });
  };

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <Title order={4}>Personel Belgeleri</Title>
        <Button leftSection={<IconPlus size={18} />} size="sm" onClick={() => setModalOpened(true)}>
          Belge Yükle
        </Button>
      </Group>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Belge Türü</Table.Th>
              <Table.Th>Açıklama / Ad</Table.Th>
              <Table.Th>Belge No</Table.Th>
              <Table.Th>Yüklenme T.</Table.Th>
              <Table.Th>Geçerlilik T.</Table.Th>
              <Table.Th>Durum</Table.Th>
              <Table.Th>İşlemler</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {documents.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={7}>
                  <Text size="sm" c="dimmed" ta="center" py="md">
                    Bu personel için henüz belge yok. "Belge Yükle" ile ekleyin.
                  </Text>
                </Table.Td>
              </Table.Tr>
            ) : (
              documents.map((doc) => (
                <Table.Tr key={doc.id} style={{ backgroundColor: getRowBg(doc.status) }}>
                  <Table.Td>{WORKER_DOCUMENT_TYPE_LABELS[doc.type]}</Table.Td>
                  <Table.Td>{doc.title}</Table.Td>
                  <Table.Td>{doc.documentNumber || '—'}</Table.Td>
                  <Table.Td>{formatDate(doc.uploadDate)}</Table.Td>
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
                        onClick={() => openDocumentInNewTab(doc)}
                        aria-label="İndir / Görüntüle"
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
              ))
            )}
          </Table.Tbody>
        </Table>
      </Paper>

      <WorkerDocumentModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        initialWorkerId={workerId}
        onSaved={() => checkDocumentExpirations(workerId)}
      />
    </Box>
  );
}
