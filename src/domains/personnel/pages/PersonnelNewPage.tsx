import { Title, Text, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';

export function PersonnelNewPage() {
  const { t } = useTranslation();

  return (
    <>
      <Button
        component={Link}
        to="/personnel"
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        mb="md"
        size="sm"
      >
        {t('personnel.newPage.back')}
      </Button>
      <Title order={2} mb="xs">{t('personnel.newPage.title')}</Title>
      <Text c="dimmed" size="sm" mb="lg">{t('personnel.newPage.placeholder')}</Text>
    </>
  );
}
