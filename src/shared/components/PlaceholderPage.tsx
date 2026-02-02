import { Title, Text, Paper } from '@mantine/core';
import { useTranslation } from '@shared/i18n';

interface PlaceholderPageProps {
  /** i18n key for the page title */
  titleKey: string;
  /** Optional i18n key for description (falls back to generic placeholder) */
  descriptionKey?: string;
}

export function PlaceholderPage({ titleKey, descriptionKey }: PlaceholderPageProps) {
  const { t } = useTranslation();
  const description = descriptionKey ? t(descriptionKey) : t('common.placeholderPage');
  return (
    <>
      <Title order={2} mb="md">
        {t(titleKey)}
      </Title>
      <Paper p="lg" withBorder>
        <Text c="dimmed" size="sm">
          {description}
        </Text>
      </Paper>
    </>
  );
}
