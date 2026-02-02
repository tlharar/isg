import { useNavigate } from 'react-router-dom';
import { Button, Title, Text, Stack, Paper, Box, Image } from '@mantine/core';
import { IconArrowLeft } from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';

export function SignUpPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <Box
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      <Paper shadow="md" p="xl" radius="md" w="100%" maw={400}>
        <Stack align="center" gap="lg">
          <Image src="/logo.svg" alt="" w={48} h={48} fit="contain" />
          <Title order={2}>{t('signUp.title')}</Title>
          <Text c="dimmed" size="sm" ta="center">
            {t('signUp.comingSoon')}
          </Text>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={() => navigate('/')}
          >
            {t('login.login')}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
