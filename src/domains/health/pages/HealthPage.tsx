import { useState } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  ActionIcon,
  Menu,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDots, IconEdit, IconTrash, IconFileText, IconCloudUpload, IconAmbulance, IconPill } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import { useHealthStore, type Examination } from '../stores/healthStore';
import { HealthModal } from '../components/HealthModal';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR');
}

export function HealthPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const examinations = useHealthStore((s) => s.examinations);
  const deleteExamination = useHealthStore((s) => s.deleteExamination);
  const markSentToIbys = useHealthStore((s) => s.markSentToIbys);
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleNewExam = () => {
    setEditingId(null);
    openModal();
  };

  const handleEdit = (exam: Examination) => {
    setEditingId(exam.id);
    openModal();
  };

  const handleModalClose = () => {
    closeModal();
    setEditingId(null);
  };

  const handleDelete = (exam: Examination) => {
    deleteExamination(exam.id);
    notifications.show({
      title: 'Muayene silindi',
      message: `${exam.employeeName} kaydı silindi.`,
      color: 'gray',
    });
  };

  const handleDownloadEk2 = () => {
    notifications.show({
      title: 'EK-2 Formu indiriliyor...',
      message: 'PDF hazırlanıyor.',
      color: 'blue',
    });
  };

  const handleSendToIbys = (exam: Examination) => {
    markSentToIbys(exam.id);
    notifications.show({
      title: 'İBYS\'ye gönderildi',
      message: 'Muayene sonucu Bakanlığa iletildi.',
      color: 'green',
    });
  };

  const handleSevk = (exam: Examination) => {
    notifications.show({
      title: 'Sevk kaydı açıldı',
      message: `${exam.employeeName} için sevk işlemi başlatıldı.`,
      color: 'blue',
    });
  };

  const handleRecepte = () => {
    navigate('/health/prescription/write');
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>{t('health.examination.title')}</Title>
            <Text c="dimmed" size="sm">
              {t('health.examination.subtitle')}
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleNewExam}>
            {t('health.examination.newExamination')} (EK-2)
          </Button>
        </Group>

        <Paper withBorder p="md">
          <Text size="sm" fw={500} mb="sm">
            {t('health.examination.recentExaminations')}
          </Text>
          {examinations.length === 0 ? (
            <Text size="sm" c="dimmed">
              {t('health.examination.noExaminations')}
            </Text>
          ) : (
            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('health.examination.table.employee')}</Table.Th>
                    <Table.Th>Muayene türü</Table.Th>
                    <Table.Th>{t('health.examination.table.reportDate')}</Table.Th>
                    <Table.Th>Geçerlilik</Table.Th>
                    <Table.Th>{t('health.examination.table.conclusion')}</Table.Th>
                    <Table.Th>İBYS</Table.Th>
                    <Table.Th w={60} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {examinations.map((e) => (
                    <Table.Tr key={e.id}>
                      <Table.Td>{e.employeeName || e.employeeId}</Table.Td>
                      <Table.Td>{e.examType ?? 'Periyodik'}</Table.Td>
                      <Table.Td>{formatDate(e.date)}</Table.Td>
                      <Table.Td>{formatDate(e.validUntil ?? e.date)}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            e.conclusion.result === 'Elverişsiz'
                              ? 'red'
                              : e.conclusion.result === 'Şartlı'
                                ? 'yellow'
                                : 'green'
                          }
                          size="sm"
                        >
                          {e.conclusion.result}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {e.sentToIbys ? (
                          <Badge size="sm" color="green">Gönderildi</Badge>
                        ) : (
                          <Badge size="sm" color="gray">Bekliyor</Badge>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Menu position="bottom-end" shadow="md" width={220}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" size="sm" aria-label="İşlemler">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => handleEdit(e)}
                            >
                              {t('common.edit')}
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color="red"
                              onClick={() => handleDelete(e)}
                            >
                              {t('common.delete')}
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              leftSection={<IconFileText size={14} />}
                              onClick={handleDownloadEk2}
                            >
                              EK-2 İndir
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconCloudUpload size={14} />}
                              onClick={() => handleSendToIbys(e)}
                              disabled={e.sentToIbys}
                            >
                              Bakanlığa Gönder
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconAmbulance size={14} />}
                              onClick={() => handleSevk(e)}
                            >
                              Sevk Et
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconPill size={14} />}
                              onClick={handleRecepte}
                            >
                              Reçete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Paper>
      </Stack>

      <HealthModal
        opened={modalOpened}
        onClose={handleModalClose}
        examinationId={editingId}
        onSaved={() => {}}
      />
    </>
  );
}
