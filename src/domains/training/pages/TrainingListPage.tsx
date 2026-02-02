import { Title, Text, Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@shared/i18n';

export function TrainingListPage() {
  const { t } = useTranslation();

  return (
    <>
      <Title order={2} mb="xs">{t('training.title')}</Title>
      <Text c="dimmed" size="sm" mb="lg">{t('training.subtitle')}</Text>
      <Button component={Link} to="/training/new" leftSection={<IconPlus size={16} />} size="sm">
        {t('training.newTraining')}
      </Button>
      <Text size="sm" c="dimmed" mt="md">{t('training.listPlaceholder')}</Text>
    </>
  );
}
