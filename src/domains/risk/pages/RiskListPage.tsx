import { useState } from 'react';
import { Title, Text, Button, Table, Badge, Group, ActionIcon, Paper, Stack, Box } from '@mantine/core';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { useTranslation } from '@shared/i18n';
import { useRiskStore, type RiskItem } from '@store/riskStore';
import { RiskModal, type RiskFormValues } from '../components/RiskModal';

/**
 * Get badge color based on risk score
 */
function getRiskBadgeColor(score: number): string {
  if (score <= 6) return 'green';
  if (score <= 12) return 'yellow';
  if (score <= 20) return 'orange';
  return 'red';
}

/**
 * Get status badge color
 */
function getStatusBadgeColor(status: RiskItem['status']): string {
  return status === 'Open' ? 'blue' : 'gray';
}

export function RiskListPage() {
  const { t } = useTranslation();
  const risks = useRiskStore((s) => s.risks);
  const addRisk = useRiskStore((s) => s.addRisk);
  const updateRisk = useRiskStore((s) => s.updateRisk);
  const deleteRisk = useRiskStore((s) => s.deleteRisk);

  const [modalOpened, setModalOpened] = useState(false);
  const [editingRisk, setEditingRisk] = useState<RiskItem | null>(null);

  const handleAddRisk = () => {
    setEditingRisk(null);
    setModalOpened(true);
  };

  const handleEditRisk = (risk: RiskItem) => {
    setEditingRisk(risk);
    setModalOpened(true);
  };

  const handleDeleteRisk = (risk: RiskItem) => {
    modals.openConfirmModal({
      title: t('risk.deleteConfirm'),
      children: (
        <Text size="sm">
          {t('risk.deleteConfirmMessage').replace('{{activity}}', risk.activity)}
        </Text>
      ),
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => deleteRisk(risk.id),
    });
  };

  const handleSubmit = (values: RiskFormValues) => {
    // Calculate risk score and level (will be recalculated in store, but we need them for type safety)
    const riskScore = values.probability * values.severity;
    const riskLevel =
      riskScore <= 6 ? 'Düşük' : riskScore <= 12 ? 'Orta' : riskScore <= 20 ? 'Yüksek' : 'Çok Yüksek';

    if (editingRisk) {
      updateRisk(editingRisk.id, values);
    } else {
      addRisk({
        ...values,
        riskScore,
        riskLevel,
      });
    }
  };

  const rows = risks.map((risk) => (
    <Table.Tr key={risk.id}>
      <Table.Td>{risk.activity}</Table.Td>
      <Table.Td>{risk.hazard}</Table.Td>
      <Table.Td style={{ maxWidth: 250 }}>
        <Text size="sm" lineClamp={2}>
          {risk.risk}
        </Text>
      </Table.Td>
      <Table.Td>
        <Badge size="lg" color={getRiskBadgeColor(risk.riskScore)}>
          {risk.riskScore}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Badge size="md" color={getRiskBadgeColor(risk.riskScore)}>
          {risk.riskLevel}
        </Badge>
      </Table.Td>
      <Table.Td>{risk.responsiblePerson}</Table.Td>
      <Table.Td>
        {new Date(risk.deadline).toLocaleDateString('tr-TR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })}
      </Table.Td>
      <Table.Td>
        <Badge color={getStatusBadgeColor(risk.status)}>
          {risk.status === 'Open' ? t('risk.statusOpen') : t('risk.statusClosed')}
        </Badge>
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
          <ActionIcon
            variant="subtle"
            color="blue"
            onClick={() => handleEditRisk(risk)}
            aria-label={t('common.edit')}
          >
            <IconEdit size={18} />
          </ActionIcon>
          <ActionIcon
            variant="subtle"
            color="red"
            onClick={() => handleDeleteRisk(risk)}
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
            <Title order={2}>{t('risk.title')}</Title>
            <Text c="dimmed" size="sm" mt={4}>
              {t('risk.subtitle')}
            </Text>
          </Box>
          <Button leftSection={<IconPlus size={18} />} onClick={handleAddRisk}>
            {t('risk.addRisk')}
          </Button>
        </Group>

        {/* Risk Matrix Legend */}
        <Paper p="md" withBorder>
          <Text fw={600} size="sm" mb="xs">
            {t('risk.matrixLegend')}
          </Text>
          <Group gap="md">
            <Badge color="green" size="lg">
              1-6: {t('risk.levelLow')}
            </Badge>
            <Badge color="yellow" size="lg">
              8-12: {t('risk.levelMedium')}
            </Badge>
            <Badge color="orange" size="lg">
              15-20: {t('risk.levelHigh')}
            </Badge>
            <Badge color="red" size="lg">
              25: {t('risk.levelVeryHigh')}
            </Badge>
          </Group>
        </Paper>

        {/* Risk Table */}
        <Paper withBorder>
          {risks.length === 0 ? (
            <Box p="xl" style={{ textAlign: 'center' }}>
              <Text c="dimmed" size="sm">
                {t('risk.noRisks')}
              </Text>
              <Button
                variant="light"
                leftSection={<IconPlus size={18} />}
                onClick={handleAddRisk}
                mt="md"
              >
                {t('risk.addFirstRisk')}
              </Button>
            </Box>
          ) : (
            <Table.ScrollContainer minWidth={1200}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('risk.table.activity')}</Table.Th>
                    <Table.Th>{t('risk.table.hazard')}</Table.Th>
                    <Table.Th>{t('risk.table.risk')}</Table.Th>
                    <Table.Th>{t('risk.table.score')}</Table.Th>
                    <Table.Th>{t('risk.table.level')}</Table.Th>
                    <Table.Th>{t('risk.table.responsible')}</Table.Th>
                    <Table.Th>{t('risk.table.deadline')}</Table.Th>
                    <Table.Th>{t('risk.table.status')}</Table.Th>
                    <Table.Th>{t('risk.table.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>{rows}</Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Paper>
      </Stack>

      {/* Add/Edit Risk Modal */}
      <RiskModal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setEditingRisk(null);
        }}
        onSubmit={handleSubmit}
        initialValues={editingRisk}
        title={editingRisk ? t('risk.editRisk') : t('risk.addRisk')}
      />
    </>
  );
}
