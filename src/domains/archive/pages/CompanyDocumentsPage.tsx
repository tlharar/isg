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
import { IconPlus, IconDownload, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useDisclosure } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import { useCompanyDocumentStore } from '../stores/companyDocumentStore';
import {
  COMPANY_DOCUMENT_TYPE_LABELS,
  COMPANY_DOCUMENT_STATUS_LABELS,
  type CompanyDocument,
  type CompanyDocumentType,
  type CompanyDocumentStatus,
} from '../stores/companyDocumentStore';
import { CompanyDocumentModal } from '../components/CompanyDocumentModal';

const TYPE_OPTIONS = [
  { value: '', label: 'Tümü' },
  ...(Object.entries(COMPANY_DOCUMENT_TYPE_LABELS) as [CompanyDocumentType, string][]).map(
    ([value, label]) => ({ value, label })
  ),
];

function formatDate(value: Date | string | null): string {
  if (value == null) return '—';
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusBadgeColor(status: CompanyDocumentStatus): string {
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

function getRowBg(status: CompanyDocumentStatus): string | undefined {
  if (status === 'EXPIRED') return 'var(--mantine-color-red-0)';
  if (status === 'EXPIRING_SOON') return 'var(--mantine-color-yellow-0)';
  return undefined;
}

function downloadDocument(doc: CompanyDocument) {
  const url = doc.fileUrl.startsWith('data:') ? doc.fileUrl : doc.fileUrl;
  const name = doc.fileName || `${doc.title}.pdf`;
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
}

export function CompanyDocumentsPage() {
  const documents = useCompanyDocumentStore((s) => s.documents);
  const deleteDocument = useCompanyDocumentStore((s) => s.deleteDocument);
  const checkExpirations = useCompanyDocumentStore((s) => s.checkExpirations);
  const getExpiredCount = useCompanyDocumentStore((s) => s.getExpiredCount);
  const getExpiringSoonCount = useCompanyDocumentStore((s) => s.getExpiringSoonCount);
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);

  const [companyNameSearch, setCompanyNameSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');

  useEffect(() => {
    checkExpirations();
  }, [checkExpirations]);

  const expiredCount = getExpiredCount();
  const expiringSoonCount = getExpiringSoonCount();
  const criticalCount = expiredCount + expiringSoonCount;

  const filtered = useMemo(() => {
    const search = companyNameSearch.trim().toLowerCase();
    return documents.filter((d) => {
      if (typeFilter && d.type !== typeFilter) return false;
      if (search && !d.companyName.toLowerCase().includes(search)) return false;
      return true;
    });
  }, [documents, typeFilter, companyNameSearch]);

  const handleDelete = (doc: CompanyDocument) => {
    modals.openConfirmModal({
      title: 'Evrakı sil',
      children: (
        <Text size="sm">
          "{doc.title}" evrakını silmek istediğinize emin misiniz?
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
        <Title order={3}>Firma Evrakları</Title>
        <Button leftSection={<IconPlus size={18} />} onClick={openAddModal}>
          Yeni Evrak Ekle
        </Button>
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="lg">
        <Paper p="md" withBorder>
          <Text size="sm" c="dimmed">
            Toplam Evrak
          </Text>
          <Text fw={700} size="xl">
            {documents.length}
          </Text>
        </Paper>
        <Paper p="md" withBorder style={{ borderColor: 'var(--mantine-color-red-4)' }}>
          <Text size="sm" c="dimmed">
            Eksik / Süresi Dolanlar
          </Text>
          <Text fw={700} size="xl" c="red.7">
            {criticalCount}
          </Text>
        </Paper>
      </SimpleGrid>

      <Stack gap="md">
        <Group>
          <TextInput
            placeholder="Firma adına göre ara..."
            value={companyNameSearch}
            onChange={(e) => setCompanyNameSearch(e.currentTarget.value)}
            style={{ minWidth: 240 }}
          />
          <Select
            placeholder="Belge türü"
            data={TYPE_OPTIONS}
            value={typeFilter || null}
            onChange={(v) => setTypeFilter(v ?? '')}
            clearable
            style={{ minWidth: 220 }}
          />
        </Group>

        <Paper withBorder>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Firma Adı</Table.Th>
                <Table.Th>Belge Türü</Table.Th>
                <Table.Th>Belge Adı</Table.Th>
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
                        ? 'Henüz firma evrakı yok. "Yeni Evrak Ekle" ile ekleyin.'
                        : 'Filtreye uyan evrak yok.'}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filtered.map((doc) => (
                  <Table.Tr key={doc.id} style={{ backgroundColor: getRowBg(doc.status) }}>
                    <Table.Td>
                      <Anchor
                        component={Link}
                        to={`/company?companyId=${doc.companyId}`}
                        size="sm"
                      >
                        {doc.companyName}
                      </Anchor>
                    </Table.Td>
                    <Table.Td>{COMPANY_DOCUMENT_TYPE_LABELS[doc.type]}</Table.Td>
                    <Table.Td>{doc.title}</Table.Td>
                    <Table.Td>{formatDate(doc.validUntilDate)}</Table.Td>
                    <Table.Td>
                      <Badge color={getStatusBadgeColor(doc.status)} size="sm">
                        {COMPANY_DOCUMENT_STATUS_LABELS[doc.status]}
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

      <CompanyDocumentModal
        opened={addModalOpened}
        onClose={closeAddModal}
        onSaved={() => checkExpirations()}
      />
    </Box>
  );
}
