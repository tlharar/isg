import { Title, Text, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';

export function TrainingNewPage() {
  const { t } = useTranslation();

  return (
    <>
      <Button
        component={Link}
        to="/training"
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        mb="md"
        size="sm"
      >
        {t('training.newPage.back')}
      </Button>
      <Title order={2} mb="xs" size={{ base: 'h3', sm: 'h2' }}>{t('training.newPage.title')}</Title>
      <Text c="dimmed" size="sm" mb="lg">{t('training.newPage.placeholder')}</Text>
    </>
  );
}
