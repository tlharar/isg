import { useState } from 'react';
import { Title, Text, Button, Table, Badge, Group, ActionIcon, Paper, Stack, Box } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash, IconFileText } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import { useEducationStore, type EducationSession, type EducationStatus } from '@store/educationStore';
import { EducationModal, type EducationFormValues } from '../components/EducationModal';

/**
 * Get status badge color
 */
function getStatusBadgeColor(status: EducationStatus): string {
  switch (status) {
    case 'Planlandı':
      return 'blue';
    case 'Tamamlandı':
      return 'green';
    case 'İptal':
      return 'red';
    default:
      return 'gray';
  }
}

export function EducationPage() {
  const { t } = useTranslation();
  const sessions = useEducationStore((s) => s.sessions);
  const addSession = useEducationStore((s) => s.addSession);
  const updateSession = useEducationStore((s) => s.updateSession);
  const deleteSession = useEducationStore((s) => s.deleteSession);

  const [modalOpened, setModalOpened] = useState(false);
  const [editingSession, setEditingSession] = useState<EducationSession | null>(null);

  const handleAddSession = () => {
    setEditingSession(null);
    setModalOpened(true);
  };

  const handleEditSession = (session: EducationSession) => {
    setEditingSession(session);
    setModalOpened(true);
  };

  const handleDeleteSession = (session: EducationSession) => {
    modals.openConfirmModal({
      title: t('education.deleteConfirm'),
      children: (
        <Text size="sm">
          {t('education.deleteConfirmMessage').replace('{{title}}', session.title)}
        </Text>
      ),
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteSession(session.id),
    });
  };

  const handleGenerateCertificate = (session: EducationSession) => {
    // Placeholder for certificate generation
    notifications.show({
      title: t('education.certificateGenerating'),
      message: `${session.title} - ${session.attendees.length} ${t('education.participants')}`,
      color: 'blue',
    });
    // In real app: Generate PDF certificate with attendee names, date, duration, etc.
  };

  const handleSubmit = (values: EducationFormValues) => {
    if (editingSession) {
      updateSession(editingSession.id, values);
      notifications.show({
        title: t('education.updateSuccess'),
        message: t('education.updateSuccessMessage'),
        color: 'green',
      });
    } else {
      addSession(values);
      notifications.show({
        title: t('education.addSuccess'),
        message: t('education.addSuccessMessage'),
        color: 'green',
      });
    }
  };

  const rows = sessions.map((session) => (
    <Table.Tr key={session.id}>
      <Table.Td>{session.title}</Table.Td>
      <Table.Td>
        <Badge variant="light" color="cyan">
          {session.type}
        </Badge>
      </Table.Td>
      <Table.Td>
        {new Date(session.date).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}
      </Table.Td>
      <Table.Td>{session.trainer}</Table.Td>
      <Table.Td style={{ textAlign: 'center' }}>
        <Badge size="lg" variant="filled" color="blue">
          {session.attendees.length}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge color={getStatusBadgeColor(session.status)}>
          {session.status}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => handleEditSession(session)}
            aria-label={t('common.edit')}
          >
            <IconEdit size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="green"
            onClick={() => handleGenerateCertificate(session)}
            aria-label={t('education.generateCertificate')}
            disabled={session.status !== 'Tamamlandı'}
          >
            <IconFileText size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => handleDeleteSession(session)}
            aria-label={t('common.delete')}
          >
            <IconTrash size={18} />
          </ActionIcon>
        </Group>
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Box>
            <Title order={2}>{t('education.title')}</Title>
            <Text c="dimmed" size="sm" mt={4}>
              {t('education.subtitle')}
            </Text>
          </Box>
          <Button leftSection={<IconPlus size={18} />} onClick={handleAddSession}>
            {t('education.addSession')}
          </Button>
        </Group>

        {/* Education Table */}
        <Paper withBorder>
          {sessions.length === 0 ? (
            <Box p="xl" style={{ textAlign: 'center' }}>
              <Text c="dimmed" size="sm">
                {t('education.noSessions')}
              </Text>
              <Button
                variant="light"
                leftSection={<IconPlus size={18} />}
                onClick={handleAddSession}
                mt="md"
              >
                {t('education.addFirstSession')}
              </Button>
            </Box>
          ) : (
            <Table.ScrollContainer minWidth={1000}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('education.table.title')}</Table.Th>
                    <Table.Th>{t('education.table.type')}</Table.Th>
                    <Table.Th>{t('education.table.date')}</Table.Th>
                    <Table.Th>{t('education.table.trainer')}</Table.Th>
                    <Table.Th style={{ textAlign: 'center' }}>{t('education.table.attendees')}</Table.Th>
                    <Table.Th>{t('education.table.status')}</Table.Th>
                    <Table.Th>{t('education.table.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Paper>
      </Stack>

      {/* Add/Edit Education Modal */}
      <EducationModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingSession(null);
        }}
        onSubmit={handleSubmit}
        initialValues={editingSession}
        title={editingSession ? t('education.editSession') : t('education.addSession')}
      />
    </>
  );
}
