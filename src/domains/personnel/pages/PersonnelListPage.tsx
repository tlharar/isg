import { Title, Text, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@shared/i18n';

export function PersonnelListPage() {
  const { t } = useTranslation();

  return (
    <>
      <Title order={2} mb="xs">{t('personnel.title')}</Title>
      <Text c="dimmed" size="sm" mb="lg">{t('personnel.subtitle')}</Text>
      <Button component={Link} to="/personnel/new" leftSection={<IconPlus size={16} />} size="sm">
        {t('personnel.add')}
      </Button>
      <Text size="sm" c="dimmed" mt="md">{t('personnel.listPlaceholder')}</Text>
    </>
  );
}
