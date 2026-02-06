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
  SimpleGrid,
  Select,
} from '@mantine/core';
import { IconPlus, IconDownload, IconTrash } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { useDocumentStore, OHS_CATEGORY_LABELS, OHS_STATUS_LABELS, type OHSDocument, type OHSDocumentCategory, type OHSDocumentStatus } from '../stores/documentStore';
import { DocumentUploadModal } from '../components/DocumentUploadModal';

const CATEGORY_OPTIONS = [
  { value: '', label: 'Tümü' },
  ...(Object.entries(OHS_CATEGORY_LABELS) as [OHSDocumentCategory, string][]).map(([value, label]) => ({
    value,
    label,
  })),
];

const STATUS_OPTIONS: { value: '' | OHSDocumentStatus; label: string }[] = [
  { value: '', label: 'Tümü' },
  { value: 'VALID', label: OHS_STATUS_LABELS.VALID },
  { value: 'EXPIRING_SOON', label: OHS_STATUS_LABELS.EXPIRING_SOON },
  { value: 'EXPIRED', label: OHS_STATUS_LABELS.EXPIRED },
];

function formatDate(value: Date | string | null): string {
  if (value == null) return '—';
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusBadgeColor(status: OHSDocumentStatus): string {
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

function getRowBg(status: OHSDocumentStatus): string | undefined {
  switch (status) {
    case 'EXPIRED':
      return 'var(--mantine-color-red-0)';
    case 'EXPIRING_SOON':
      return 'var(--mantine-color-yellow-0)';
    default:
      return undefined;
  }
}

function downloadDocument(doc: OHSDocument) {
  const url = doc.fileUrl.startsWith('data:') ? doc.fileUrl : doc.fileUrl;
  const name = doc.fileName || `${doc.title}.pdf`;
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
}

export function DocumentListPage() {
  const documents = useDocumentStore((s) => s.documents);
  const deleteDocument = useDocumentStore((s) => s.deleteDocument);
  const checkExpirations = useDocumentStore((s) => s.checkExpirations);
  const [uploadOpened, setUploadOpened] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  useEffect(() => {
    checkExpirations();
  }, [checkExpirations]);

  const stats = useMemo(() => {
    const total = documents.length;
    const expired = documents.filter((d) => d.status === 'EXPIRED').length;
    const expiringSoon = documents.filter((d) => d.status === 'EXPIRING_SOON').length;
    return { total, expired, expiringSoon };
  }, [documents]);

  const filtered = useMemo(() => {
    return documents.filter((d) => {
      if (categoryFilter && d.category !== categoryFilter) return false;
      if (statusFilter && d.status !== statusFilter) return false;
      return true;
    });
  }, [documents, categoryFilter, statusFilter]);

  const handleDelete = (doc: OHSDocument) => {
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
      <Group justify="space-between" mb="lg">
        <Title order={3}>İSG Belgeleri</Title>
        <Button leftSection={<IconPlus size={18} />} onClick={() => setUploadOpened(true)}>
          Belge Yükle
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
            Yaklaşanlar (&lt; 30 gün)
          </Text>
          <Text fw={700} size="xl" c="yellow.7">
            {stats.expiringSoon}
          </Text>
        </Paper>
        <Paper p="md" withBorder style={{ borderColor: 'var(--mantine-color-red-4)' }}>
          <Text size="sm" c="dimmed">
            Süresi Dolanlar
          </Text>
          <Text fw={700} size="xl" c="red.7">
            {stats.expired}
          </Text>
        </Paper>
      </SimpleGrid>

      <Stack gap="md">
        <Group>
          <Select
            placeholder="Kategori"
            data={CATEGORY_OPTIONS}
            value={categoryFilter || null}
            onChange={(v) => setCategoryFilter(v ?? '')}
            clearable
            style={{ minWidth: 200 }}
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
                <Table.Th>Belge Adı</Table.Th>
                <Table.Th>Kategori</Table.Th>
                <Table.Th>Hazırlanma T.</Table.Th>
                <Table.Th>Bitiş T.</Table.Th>
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
                        ? 'Henüz belge yok. "Belge Yükle" ile ekleyin.'
                        : 'Filtreye uyan belge yok.'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filtered.map((doc) => (
                  <Table.Tr key={doc.id} style={{ backgroundColor: getRowBg(doc.status) }}>
                    <Table.Td>{doc.title}</Table.Td>
                    <Table.Td>{OHS_CATEGORY_LABELS[doc.category]}</Table.Td>
                    <Table.Td>{formatDate(doc.preparationDate)}</Table.Td>
                    <Table.Td>{formatDate(doc.validUntilDate)}</Table.Td>
                    <Table.Td>
                      <Badge color={getStatusBadgeColor(doc.status)} size="sm">
                        {OHS_STATUS_LABELS[doc.status]}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs" wrap="nowrap">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => downloadDocument(doc)}
                          aria-label="İndir"
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
      </Stack>

      <DocumentUploadModal
        opened={uploadOpened}
        onClose={() => setUploadOpened(false)}
        onSaved={() => checkExpirations()}
      />
    </Box>
  );
}
