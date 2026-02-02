import { Title, Text, Button, Group, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useExportExcel } from '@shared/utils';
import { useTranslation } from '@shared/i18n';

export function RiskListPage() {
  const { exportTableToExcel } = useExportExcel();
  const { t } = useTranslation();

  const handleExport = () => {
    exportTableToExcel(
      [
        { id: 'R-001', title: 'Sample Risk', severity: 'High', status: 'Open' },
        { id: 'R-002', title: 'Another Risk', severity: 'Medium', status: 'Closed' },
      ],
      ['id', 'title', 'severity', 'status'],
      'risk-list'
    );
  };

  return (
    <>
      <Stack gap="md" mb="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <div>
            <Title order={2} size={{ base: 'h3', sm: 'h2' }}>{t('risk.title')}</Title>
            <Text c="dimmed" size="sm">{t('risk.subtitle')}</Text>
          </div>
          <Group gap="xs" wrap="wrap">
            <Button variant="light" onClick={handleExport} size="sm">
              {t('risk.exportExcel')}
            </Button>
            <Button component={Link} to="/risk/new" leftSection={<IconPlus size={16} />} size="sm">
              {t('risk.newRisk')}
            </Button>
          </Group>
        </Group>
      </Stack>
      <Text size="sm" c="dimmed">
        {t('risk.listPlaceholder')}
      </Text>
    </>
  );
}
