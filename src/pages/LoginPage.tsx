import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Title, Text, TextInput, PasswordInput, Button, Stack, Paper, Group, Image, SegmentedControl } from '@mantine/core';
import { useTranslation } from '@shared/i18n';
import { useAuthStore } from '@shared/stores/authStore';
import { useAppStore } from '@shared/stores/appStore';

export function LoginPage() {
  const { t, locale } = useTranslation();
  const setLocale = useAppStore((s) => s.setLocale);
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (login(username.trim(), password)) {
      navigate('/dashboard');
    } else {
      setError(t('login.invalidCredentials'));
    }
  };

  const handleSignUp = () => {
    navigate('/signup');
  };

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
        <Stack align="center" gap="md" mb="xl">
          <Group justify="flex-end" w="100%" style={{ alignSelf: 'stretch' }}>
            <SegmentedControl
              size="xs"
              value={locale}
              onChange={(v) => setLocale(v === 'en' ? 'en' : 'tr')}
              data={[
                { label: t('common.en'), value: 'en' },
                { label: t('common.tr'), value: 'tr' },
              ]}
              aria-label={t('common.language')}
            />
          </Group>
          <Image src="/logo.svg" alt="" w={56} h={56} fit="contain" />
          <Title order={2} ta="center">
            {t('login.title')}
          </Title>
        </Stack>
        <form onSubmit={handleLogin}>
          <Stack gap="md">
            <TextInput
              label={t('login.username')}
              placeholder={t('login.username')}
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              required
              autoComplete="username"
            />
            <PasswordInput
              label={t('login.password')}
              placeholder={t('login.password')}
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
              autoComplete="current-password"
            />
            {error && (
              <Text size="sm" c="red">
                {error}
              </Text>
            )}
            <Group justify="space-between" mt="md">
              <Button variant="default" onClick={handleSignUp}>
                {t('login.signUp')}
              </Button>
              <Button type="submit">{t('login.login')}</Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
