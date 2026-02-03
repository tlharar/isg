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
import { useMailGroupStore, type MailGroup } from '@store/mailGroupStore';
import { useCompanyStore } from '@store/companyStore';
import { useAppStore } from '@shared/stores/appStore';
import { MailGroupModal } from '@domains/company/components/MailGroupModal';

const VISIBLE_EMAILS = 2;

export function MailGroupsPage() {
  const { t } = useTranslation();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const fetchByCompany = useMailGroupStore((s) => s.fetchByCompany);
  const deleteGroup = useMailGroupStore((s) => s.deleteGroup);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const company = useMemo(
    () => (selectedCompanyId ? getCompanyById(selectedCompanyId) : null),
    [selectedCompanyId, getCompanyById]
  );

  const mailGroups = useMemo(
    () => (selectedCompanyId ? fetchByCompany(selectedCompanyId) : []),
    [selectedCompanyId, fetchByCompany]
  );

  const handleAdd = () => {
    setEditingId(null);
    openModal();
  };

  const handleEdit = (group: MailGroup) => {
    setEditingId(group.id);
    openModal();
  };

  const handleDelete = (group: MailGroup) => {
    if (window.confirm(t('mailGroups.deleteConfirm'))) {
      deleteGroup(group.id);
      notifications.show({
        title: t('mailGroups.deleteSuccess'),
        message: t('mailGroups.deleteSuccessMessage'),
        color: 'green',
      });
    }
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
          {t('mailGroups.noCompanySelected')}
        </Text>
      </Stack>
    );
  }

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Box>
            <Title order={2}>{t('mailGroups.title')}</Title>
            <Text c="dimmed" size="sm" mt={4}>
              {company ? `${company.name} - ${t('mailGroups.subtitle')}` : t('mailGroups.subtitle')}
            </Text>
          </Box>
          <Button leftSection={<IconPlus size={18} />} color="teal" onClick={handleAdd}>
            {t('mailGroups.buttonAdd')}
          </Button>
        </Group>

        <Paper withBorder>
          {mailGroups.length === 0 ? (
            <Stack align="center" p="xl" gap="md">
              <IconAlertTriangle size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" size="sm" ta="center">
                {t('mailGroups.emptyState')}
              </Text>
              <Button variant="light" leftSection={<IconPlus size={18} />} onClick={handleAdd}>
                {t('mailGroups.buttonAddFirst')}
              </Button>
            </Stack>
          ) : (
            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('mailGroups.table.groupName')}</Table.Th>
                    <Table.Th>{t('mailGroups.table.emails')}</Table.Th>
                    <Table.Th>{t('mailGroups.table.description')}</Table.Th>
                    <Table.Th>{t('mailGroups.table.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {mailGroups.map((group) => (
                    <Table.Tr key={group.id}>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {group.name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="wrap">
                          {group.emails.slice(0, VISIBLE_EMAILS).map((email) => (
                            <Badge key={email} variant="light" size="sm" color="gray">
                              {email}
                            </Badge>
                          ))}
                          {group.emails.length > VISIBLE_EMAILS && (
                            <Text size="xs" c="dimmed">
                              +{group.emails.length - VISIBLE_EMAILS} {t('mailGroups.more')}
                            </Text>
                          )}
                          {group.emails.length === 0 && (
                            <Text size="sm" c="dimmed">
                              —
                            </Text>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" lineClamp={2}>
                          {group.description || '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleEdit(group)}
                            aria-label={t('common.edit')}
                          >
                            <IconEdit size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleDelete(group)}
                            aria-label={t('common.delete')}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
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
        <MailGroupModal
          opened={modalOpened}
          onClose={handleModalClose}
          companyId={selectedCompanyId}
          editGroupId={editingId}
        />
      )}
    </>
  );
}
