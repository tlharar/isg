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
import { IconPlus, IconEdit, IconTrash, IconAlertTriangle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import { useSubContractorStore, type SubContractor, getSubContractorStatus } from '@store/subContractorStore';
import { useCompanyStore } from '@store/companyStore';
import { useAppStore } from '@shared/stores/appStore';
import { SubContractorModal } from '@domains/company/components/SubContractorModal';

function formatDate(d: Date): string {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

export function SubcontractorsPage() {
  const { t } = useTranslation();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const fetchSubContractors = useSubContractorStore((s) => s.fetchSubContractors);
  const deleteSubContractor = useSubContractorStore((s) => s.deleteSubContractor);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingItem, setEditingItem] = useState<SubContractor | null>(null);

  const company = useMemo(
    () => (selectedCompanyId ? getCompanyById(selectedCompanyId) : null),
    [selectedCompanyId, getCompanyById]
  );

  const subContractors = useMemo(
    () => (selectedCompanyId ? fetchSubContractors(selectedCompanyId) : []),
    [selectedCompanyId, fetchSubContractors]
  );

  const handleAdd = () => {
    setEditingItem(null);
    openModal();
  };

  const handleEdit = (item: SubContractor) => {
    setEditingItem(item);
    openModal();
  };

  const handleDelete = (item: SubContractor) => {
    if (window.confirm(t('subcontractors.deleteConfirm'))) {
      deleteSubContractor(item.id);
      notifications.show({
        title: t('subcontractors.deleteSuccess'),
        message: t('subcontractors.deleteSuccessMessage'),
        color: 'green',
      });
    }
  };

  const handleModalClose = () => {
    setEditingItem(null);
    closeModal();
  };

  if (!selectedCompanyId) {
    return (
      <Stack align="center" p="xl" gap="md">
        <IconAlertTriangle size={48} color="var(--mantine-color-amber-5)" />
        <Text c="dimmed" size="sm" ta="center">
          {t('subcontractors.noCompanySelected')}
        </Text>
      </Stack>
    );
  }

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Box>
            <Title order={2}>{t('subcontractors.title')}</Title>
            <Text c="dimmed" size="sm" mt={4}>
              {company ? `${company.name} - ${t('subcontractors.subtitle')}` : t('subcontractors.subtitle')}
            </Text>
          </Box>
          <Button leftSection={<IconPlus size={18} />} color="teal" onClick={handleAdd}>
            {t('subcontractors.buttonAdd')}
          </Button>
        </Group>

        <Paper withBorder>
          {subContractors.length === 0 ? (
            <Stack align="center" p="xl" gap="md">
              <IconAlertTriangle size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" size="sm" ta="center">
                {t('subcontractors.noItems')}
              </Text>
              <Text c="dimmed" size="sm" ta="center" fw={500}>
                {t('subcontractors.noItemsHint')}
              </Text>
              <Button variant="light" leftSection={<IconPlus size={18} />} onClick={handleAdd}>
                {t('subcontractors.buttonAddFirst')}
              </Button>
            </Stack>
          ) : (
            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('subcontractors.table.name')}</Table.Th>
                    <Table.Th>{t('subcontractors.table.sgkNumber')}</Table.Th>
                    <Table.Th>{t('subcontractors.table.workDescription')}</Table.Th>
                    <Table.Th>{t('subcontractors.table.contractDates')}</Table.Th>
                    <Table.Th>{t('subcontractors.table.status')}</Table.Th>
                    <Table.Th>{t('subcontractors.table.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {subContractors.map((item) => {
                    const status = getSubContractorStatus(item.contractEndDate);
                    const isExpired = status === 'Passive';
                    return (
                      <Table.Tr
                        key={item.id}
                        style={{
                          opacity: isExpired ? 0.75 : 1,
                        }}
                      >
                        <Table.Td>
                          <Text size="sm" fw={600}>
                            {item.name}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" ff="monospace">
                            {item.sgkNumber}
                          </Text>
                        </Table.Td>
                        <Table.Td style={{ maxWidth: 280 }}>
                          <Text size="sm" lineClamp={2} title={item.workDescription}>
                            {item.workDescription || '—'}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {formatDate(item.contractStartDate)} – {formatDate(item.contractEndDate)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={status === 'Active' ? 'green' : 'gray'} size="sm">
                            {status === 'Active'
                              ? t('subcontractors.statusActive')
                              : t('subcontractors.statusPassive')}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => handleEdit(item)}
                              aria-label={t('common.edit')}
                            >
                              <IconEdit size={18} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(item)}
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
        <SubContractorModal
          opened={modalOpened}
          onClose={handleModalClose}
          mainCompanyId={selectedCompanyId}
          editSubContractor={editingItem}
        />
      )}
    </>
  );
}
