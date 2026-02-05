import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  ActionIcon,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash, IconAlertTriangle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import { useCompanyStore, type SubContractor } from '@store/companyStore';
import { useAppStore } from '@shared/stores/appStore';
import { CompanySubContractorSimpleModal } from '@domains/company/components/CompanySubContractorSimpleModal';

export function SubcontractorsPage() {
  const { t } = useTranslation();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const removeSubContractor = useCompanyStore((s) => s.removeSubContractor);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);

  const company = selectedCompanyId ? getCompanyById(selectedCompanyId) : null;
  const subContractors: SubContractor[] = company?.subContractors ?? [];

  const handleAdd = () => {
    openModal();
  };

  const handleDelete = (item: SubContractor) => {
    if (window.confirm(t('subcontractors.deleteConfirm'))) {
      if (selectedCompanyId) {
        removeSubContractor(selectedCompanyId, item.id);
        notifications.show({
          title: t('subcontractors.deleteSuccess'),
          message: t('subcontractors.deleteSuccessMessage'),
          color: 'green',
        });
      }
    }
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
            <Table.ScrollContainer minWidth={600}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('subcontractors.table.name')}</Table.Th>
                    <Table.Th>{t('subcontractors.table.sgkNumber')}</Table.Th>
                    <Table.Th>{t('subcontractors.table.contactPerson')}</Table.Th>
                    <Table.Th style={{ width: 80 }}>{t('subcontractors.table.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {subContractors.map((item) => (
                    <Table.Tr key={item.id}>
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
                      <Table.Td>
                        <Text size="sm">{item.contactPerson || '—'}</Text>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => handleDelete(item)}
                          aria-label={t('common.delete')}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Paper>
      </Stack>

      {selectedCompanyId && (
        <CompanySubContractorSimpleModal
          opened={modalOpened}
          onClose={closeModal}
          companyId={selectedCompanyId}
        />
      )}
    </>
  );
}
