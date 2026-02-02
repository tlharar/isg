import { Title, Text, Card, Group, SimpleGrid } from '@mantine/core';
import { IconAlertTriangle, IconUsers, IconSchool, IconUsersGroup, IconBuildingStore, IconBuilding } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@shared/i18n';

const moduleCards = [
  { to: '/risk', labelKey: 'dashboard.riskLabel', descKey: 'dashboard.riskDesc', icon: IconAlertTriangle },
  { to: '/personnel', labelKey: 'dashboard.personnelLabel', descKey: 'dashboard.personnelDesc', icon: IconUsers },
  { to: '/training', labelKey: 'dashboard.trainingLabel', descKey: 'dashboard.trainingDesc', icon: IconSchool },
  { to: '/worker', labelKey: 'dashboard.workerLabel', descKey: 'dashboard.workerDesc', icon: IconUsersGroup },
  { to: '/customer', labelKey: 'dashboard.customerLabel', descKey: 'dashboard.customerDesc', icon: IconBuildingStore },
  { to: '/company', labelKey: 'dashboard.companyLabel', descKey: 'dashboard.companyDesc', icon: IconBuilding },
] as const;

export function DashboardPage() {
  const { t } = useTranslation();

  return (
    <>
      <Title order={2} mb="md">
        {t('dashboard.title')}
      </Title>
      <Text c="dimmed" mb="lg" size="sm">
        {t('dashboard.subtitle')}
      </Text>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        {moduleCards.map(({ to, labelKey, descKey, icon: Icon }) => (
          <Card
            key={to}
            component={Link}
            to={to}
            shadow="sm"
            padding="lg"
            withBorder
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Group justify="space-between" mb="xs">
              <Text fw={500}>{t(labelKey)}</Text>
              <Icon size={24} />
            </Group>
            <Text size="sm" c="dimmed">
              {t(descKey)}
            </Text>
          </Card>
        ))}
      </SimpleGrid>
    </>
  );
}
