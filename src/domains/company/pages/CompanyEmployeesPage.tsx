import { Title, Text } from '@mantine/core';
import { useTranslation } from '@shared/i18n';

export function CompanyEmployeesPage() {
  const { t } = useTranslation();
  return (
    <>
      <Title order={2} mb="xs">{t('company.menu.employees')}</Title>
      <Text c="dimmed" size="sm">{t('company.placeholder.employees')}</Text>
    </>
  );
}
