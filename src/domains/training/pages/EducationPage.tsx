import { useState, useMemo } from 'react';
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
  Tooltip,
  Modal,
  TextInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconSettings, IconCertificate } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import {
  useEducationStore,
  type EducationSession,
  type EducationStatus,
  type PlanTemplate,
} from '@store/educationStore';
import { useWorkerStore } from '@store/workerStore';
import { EducationModal, type EducationFormValues } from '../components/EducationModal';
import { CertificateModal } from '../components/CertificateModal';

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

/**
 * Resolve attendee IDs (or legacy names) to display names using workers.
 */
function getAttendeeDisplayNames(
  attendeeIdsOrNames: string[],
  workersById: Map<string, string>
): string[] {
  return attendeeIdsOrNames.map((idOrName) => workersById.get(idOrName) ?? idOrName);
}

/**
 * Format attendees for table: "Name1, Name2, Name3" or "X Kişi" when more than 3.
 */
function formatAttendeesForTable(
  attendeeIdsOrNames: string[],
  workersById: Map<string, string>,
  maxNames = 3
): string {
  const names = getAttendeeDisplayNames(attendeeIdsOrNames, workersById);
  if (names.length === 0) return '—';
  if (names.length <= maxNames) return names.join(', ');
  return `${names.length} Kişi`;
}

export function EducationPage() {
  const { t } = useTranslation();
  const sessions = useEducationStore((s) => s.sessions);
  const templates = useEducationStore((s) => s.templates);
  const addSession = useEducationStore((s) => s.addSession);
  const updateSession = useEducationStore((s) => s.updateSession);
  const deleteSession = useEducationStore((s) => s.deleteSession);
  const addTemplate = useEducationStore((s) => s.addTemplate);
  const deleteTemplate = useEducationStore((s) => s.deleteTemplate);

  const workers = useWorkerStore((s) => s.workers);
  const workersById = useMemo(
    () => new Map(workers.map((w) => [w.id, w.nameSurname])),
    [workers]
  );

  const [modalOpened, setModalOpened] = useState(false);
  const [editingSession, setEditingSession] = useState<EducationSession | null>(null);
  const [templatesOpened, { open: openTemplates, close: closeTemplates }] = useDisclosure(false);
  const [certificateModalOpened, { open: openCertificateModal, close: closeCertificateModal }] = useDisclosure(false);
  const [certificateSession, setCertificateSession] = useState<EducationSession | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');

  const handleAddTemplate = () => {
    const name = newTemplateName.trim();
    if (!name) return;
    addTemplate(name);
    setNewTemplateName('');
  };

  const handleDeleteTemplate = (tmpl: PlanTemplate) => {
    if (window.confirm(`"${tmpl.name}" şablonunu silmek istediğinize emin misiniz?`)) {
      deleteTemplate(tmpl.id);
    }
  };

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

  const handleOpenCertificates = (session: EducationSession) => {
    setCertificateSession(session);
    openCertificateModal();
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

  const rows = sessions.map((session) => {
    const attendeeLabel = formatAttendeesForTable(session.attendees, workersById);
    const allNames = getAttendeeDisplayNames(session.attendees, workersById);
    const hasMany = session.attendees.length > 3;

    return (
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
        <Table.Td>
          {hasMany ? (
            <Tooltip label={allNames.join(', ')}>
              <Badge size="lg" variant="light" color="blue">
                {attendeeLabel}
              </Badge>
            </Tooltip>
          ) : (
            <Text size="sm">{attendeeLabel}</Text>
          )}
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
              color="teal"
              onClick={() => handleOpenCertificates(session)}
              aria-label="Sertifika Oluştur"
              title="Sertifika Oluştur"
              disabled={session.status !== 'Tamamlandı' || session.attendees.length === 0}
            >
              <IconCertificate size={18} />
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
    );
  });

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
          <Group gap="sm" wrap="wrap">
            <Button
              variant="light"
              leftSection={<IconSettings size={18} />}
              onClick={openTemplates}
            >
              Şablonları Düzenle
            </Button>
            <Button leftSection={<IconPlus size={18} />} onClick={handleAddSession}>
              {t('education.addSession')}
            </Button>
          </Group>
        </Group>

        <Modal opened={templatesOpened} onClose={closeTemplates} title="Şablon Yönetimi" size="md">
          <Stack gap="md">
            <Group align="flex-end" wrap="nowrap">
              <TextInput
                label="Şablon Adı"
                placeholder="Yeni şablon adı"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.currentTarget.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTemplate()}
                style={{ flex: 1 }}
              />
              <Button onClick={handleAddTemplate} disabled={!newTemplateName.trim()}>
                Ekle
              </Button>
            </Group>
            <Text size="sm" fw={500}>
              Mevcut şablonlar
            </Text>
            {templates.length === 0 ? (
              <Text size="sm" c="dimmed">
                Henüz şablon yok. Yukarıdan ekleyin.
              </Text>
            ) : (
              <Table withTableBorder withColumnBorders>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Şablon Adı</Table.Th>
                    <Table.Th style={{ width: 60 }}>İşlem</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {templates.map((tmpl) => (
                    <Table.Tr key={tmpl.id}>
                      <Table.Td>{tmpl.name}</Table.Td>
                      <Table.Td>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          size="sm"
                          onClick={() => handleDeleteTemplate(tmpl)}
                          aria-label="Sil"
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        </Modal>

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
                    <Table.Th>{t('education.table.attendees')}</Table.Th>
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

      {/* Bulk Certificate Modal */}
      <CertificateModal
        opened={certificateModalOpened}
        onClose={() => {
          closeCertificateModal();
          setCertificateSession(null);
        }}
        session={certificateSession}
        participantNames={
          certificateSession
            ? getAttendeeDisplayNames(certificateSession.attendees, workersById)
            : []
        }
      />
    </>
  );
}
