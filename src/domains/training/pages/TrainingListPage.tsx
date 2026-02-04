import { useState } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  Badge,
  Modal,
  TextInput,
  ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconCheck, IconSettings, IconTrash } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@shared/i18n';
import {
  useEducationStore,
  type EducationStatus,
  type EducationTemplate,
} from '@store/educationStore';

function formatDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

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

export function TrainingListPage() {
  const { t } = useTranslation();
  const sessions = useEducationStore((s) => s.sessions);
  const templates = useEducationStore((s) => s.templates);
  const addTemplate = useEducationStore((s) => s.addTemplate);
  const deleteTemplate = useEducationStore((s) => s.deleteTemplate);
  const toggleComplete = useEducationStore((s) => s.toggleComplete);

  const [templatesOpened, { open: openTemplates, close: closeTemplates }] = useDisclosure(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const handleAddTemplate = () => {
    const name = newTemplateName.trim();
    if (!name) return;
    addTemplate(name);
    setNewTemplateName('');
  };

  const handleDeleteTemplate = (tmpl: EducationTemplate) => {
    if (window.confirm(`"${tmpl.name}" şablonunu silmek istediğinize emin misiniz?`)) {
      deleteTemplate(tmpl.id);
    }
  };

  return (
    <>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" wrap="wrap" gap="sm">
          <div>
            <Title order={2}>{t('training.title')}</Title>
            <Text c="dimmed" size="sm">
              {t('training.subtitle')}
            </Text>
          </div>
          {/* Action Bar */}
          <Group gap="xs">
            <Button
              variant="default"
              leftSection={<IconSettings size={16} />}
              onClick={openTemplates}
            >
              Şablonları Düzenle
            </Button>
            <Button
              component={Link}
              to="/training/new"
              variant="filled"
              leftSection={<IconPlus size={16} />}
            >
              Yeni Eğitim Ekle
            </Button>
          </Group>
        </Group>

        {/* Main Content */}
        <Paper withBorder p="md">
          {sessions.length === 0 ? (
            <Text size="sm" c="dimmed" py="xl" ta="center">
              {t('training.listPlaceholder')}
            </Text>
          ) : (
            <Table.ScrollContainer minWidth={500}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Eğitim Konusu</Table.Th>
                    <Table.Th>Tarih</Table.Th>
                    <Table.Th>Durum</Table.Th>
                    <Table.Th style={{ width: 120 }}>İşlemler</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {sessions.map((session) => {
                    const completed = session.isCompleted === true;
                    return (
                      <Table.Tr
                        key={session.id}
                        style={{
                          opacity: completed ? 0.85 : 1,
                          backgroundColor: completed
                            ? 'var(--mantine-color-green-0)'
                            : undefined,
                        }}
                      >
                        <Table.Td>
                          <Text size="sm" fw={600}>
                            {session.title}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{formatDate(session.date)}</Text>
                        </Table.Td>
                        <Table.Td>
                          {completed ? (
                            <Badge color="green" size="sm">
                              Tamamlandı
                            </Badge>
                          ) : (
                            <Badge color={getStatusBadgeColor(session.status)} size="sm">
                              {session.status}
                            </Badge>
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Button
                            variant={completed ? 'subtle' : 'light'}
                            size="xs"
                            color={completed ? 'gray' : 'green'}
                            leftSection={<IconCheck size={14} />}
                            onClick={() => toggleComplete(session.id)}
                          >
                            {completed ? 'Tamamlandı (iptal)' : 'Tamamlandı'}
                          </Button>
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

      {/* Template Management Modal */}
      <Modal
        opened={templatesOpened}
        onClose={closeTemplates}
        title="Şablon Yönetimi"
        size="md"
      >
        <Stack gap="md">
          {/* Add Section */}
          <Group align="flex-end" wrap="nowrap">
            <TextInput
              placeholder="Şablon Adı"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTemplate()}
              style={{ flex: 1 }}
            />
            <Button onClick={handleAddTemplate} disabled={!newTemplateName.trim()}>
              Ekle
            </Button>
          </Group>

          {/* List Section */}
          <div>
            <Text size="sm" fw={500} mb="xs">
              Mevcut şablonlar
            </Text>
            {templates.length === 0 ? (
              <Text size="sm" c="dimmed">
                Henüz şablon yok. Yukarıdan ekleyin.
              </Text>
            ) : (
              <Stack gap="xs">
                {templates.map((tmpl) => (
                  <Group key={tmpl.id} justify="space-between" wrap="nowrap">
                    <Text size="sm">{tmpl.name}</Text>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      size="sm"
                      onClick={() => handleDeleteTemplate(tmpl)}
                      aria-label="Şablonu sil"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            )}
          </div>
        </Stack>
      </Modal>
    </>
  );
}
