import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Title, Text, TextInput, PasswordInput, Button, Stack, Paper, Group, Image } from '@mantine/core';
import { useTranslation } from '@shared/i18n';
import { useAuthStore } from '@shared/stores/authStore';

export function LoginPage() {
  const { t } = useTranslation();
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
