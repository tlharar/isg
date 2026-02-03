import { useState, useMemo } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconFileText, IconAlertTriangle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import {
  useRepresentativeStore,
  type Representative,
  getRepresentativeStatus,
  type SelectionMethod,
} from '@store/representativeStore';
import { useCompanyStore } from '@store/companyStore';
import { useAppStore } from '@shared/stores/appStore';
import { RepresentativeModal } from '@domains/company/components/RepresentativeModal';

function formatDate(d: Date): string {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function getMethodBadgeColor(method: SelectionMethod): string {
  return method === 'Seçim' ? 'blue' : 'violet';
}

export function RepresentativePage() {
  const { t } = useTranslation();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const fetchByCompany = useRepresentativeStore((s) => s.fetchByCompany);
  const deleteRepresentative = useRepresentativeStore((s) => s.deleteRepresentative);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const company = useMemo(
    () => (selectedCompanyId ? getCompanyById(selectedCompanyId) : null),
    [selectedCompanyId, getCompanyById]
  );

  const representatives = useMemo(
    () => (selectedCompanyId ? fetchByCompany(selectedCompanyId) : []),
    [selectedCompanyId, fetchByCompany]
  );

  const handleAdd = () => {
    setEditingId(null);
    openModal();
  };

  const handleEdit = (rep: Representative) => {
    setEditingId(rep.id);
    openModal();
  };

  const handleDelete = (rep: Representative) => {
    if (window.confirm(t('representatives.deleteConfirm'))) {
      deleteRepresentative(rep.id);
      notifications.show({
        title: t('representatives.deleteSuccess'),
        message: t('representatives.deleteSuccessMessage'),
        color: 'green',
      });
    }
  };

  const handleDownloadTutanak = () => {
    notifications.show({
      title: t('representatives.tutanakDownload'),
      message: t('representatives.tutanakDownloadMessage'),
      color: 'blue',
    });
  };

  const handleModalClose = () => {
    setEditingId(null);
    closeModal();
  };

  if (!selectedCompanyId) {
    return (
      <Stack align="center" p="xl" gap="md">
        <IconAlertTriangle size={48} color="var(--mantine-color-amber-5)" />
        <Text c="dimmed" size="sm" ta="center">
          {t('representatives.noCompanySelected')}
        </Text>
      </Stack>
    );
  }

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Box>
            <Title order={2}>{t('representatives.title')}</Title>
            <Text c="dimmed" size="sm" mt={4}>
              {company ? `${company.name} - ${t('representatives.subtitle')}` : t('representatives.subtitle')}
            </Text>
          </Box>
          <Button leftSection={<IconPlus size={18} />} color="teal" onClick={handleAdd}>
            {t('representatives.buttonAdd')}
          </Button>
        </Group>

        <Paper withBorder>
          {representatives.length === 0 ? (
            <Stack align="center" p="xl" gap="md">
              <IconAlertTriangle size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" size="sm" ta="center">
                {t('representatives.noItems')}
              </Text>
              <Text c="dimmed" size="sm" ta="center" fw={500}>
                {t('representatives.noItemsHint')}
              </Text>
              <Button variant="light" leftSection={<IconPlus size={18} />} onClick={handleAdd}>
                {t('representatives.buttonAddFirst')}
              </Button>
            </Stack>
          ) : (
            <Table.ScrollContainer minWidth={900}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('representatives.table.name')}</Table.Th>
                    <Table.Th>{t('representatives.table.jobTitle')}</Table.Th>
                    <Table.Th>{t('representatives.table.method')}</Table.Th>
                    <Table.Th>{t('representatives.table.term')}</Table.Th>
                    <Table.Th>{t('representatives.table.status')}</Table.Th>
                    <Table.Th>{t('representatives.table.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {representatives.map((rep) => {
                    const status = getRepresentativeStatus(rep.validUntil);
                    const isExpired = status === 'Pasif';
                    return (
                      <Table.Tr
                        key={rep.id}
                        style={{ opacity: isExpired ? 0.8 : 1 }}
                      >
                        <Table.Td>
                          <Text size="sm" fw={600}>
                            {rep.employeeName}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{rep.jobTitle || '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getMethodBadgeColor(rep.selectionMethod)} size="sm">
                            {rep.selectionMethod}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {formatDate(rep.selectionDate)} – {formatDate(rep.validUntil)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={status === 'Aktif' ? 'green' : 'gray'} size="sm">
                            {status === 'Aktif'
                              ? t('representatives.statusActive')
                              : t('representatives.statusPassive')}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => handleDownloadTutanak()}
                              aria-label={t('representatives.downloadTutanak')}
                              title={t('representatives.downloadTutanak')}
                            >
                              <IconFileText size={18} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => handleEdit(rep)}
                              aria-label={t('common.edit')}
                            >
                              <IconEdit size={18} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(rep)}
                              aria-label={t('common.delete')}
                            >
                              <IconTrash size={18} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Paper>
      </Stack>

      {selectedCompanyId && (
        <RepresentativeModal
          opened={modalOpened}
          onClose={handleModalClose}
          companyId={selectedCompanyId}
          editRepresentativeId={editingId}
        />
      )}
    </>
  );
}
