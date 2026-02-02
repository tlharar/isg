import { Title, Text, Button } from '@mantine/core';
import { Link } from 'react-router-dom';
import { IconArrowLeft } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';

export function RiskNewPage() {
  const { t } = useTranslation();

  return (
    <>
      <Button
        component={Link}
        to="/risk"
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        mb="md"
        size="sm"
      >
        {t('risk.newPage.back')}
      </Button>
      <Title order={2} mb="xs" size={{ base: 'h3', sm: 'h2' }}>{t('risk.newPage.title')}</Title>
      <Text c="dimmed" size="sm" mb="lg">{t('risk.newPage.placeholder')}</Text>
    </>
  );
}
