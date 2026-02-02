import { Title, Text } from '@mantine/core';
import { useTranslation } from '@shared/i18n';

export function MailGroupsPage() {
  const { t } = useTranslation();
  return (
    <>
      <Title order={2} mb="xs">{t('company.menu.mailGroups')}</Title>
      <Text c="dimmed" size="sm">{t('company.placeholder.mailGroups')}</Text>
    </>
  );
}
