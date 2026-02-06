import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Text, TextInput, PasswordInput, Button, Stack, Paper, Group } from '@mantine/core';
import { useTranslation } from '@shared/i18n';
import { useAuthStore, DEFAULT_WORKER_USER_PASSWORD } from '@shared/stores/authStore';
import { initializeUserData } from '@shared/dataManager';
import { ForcePasswordChangeModal } from '@auth/ForcePasswordChangeModal';

/** Brand colors for ÖZARTEK dual-tone text (matches ShellHeader) */
const BRAND_TURQUOISE = '#00C2CB';
const BRAND_TEAL = '#006064';

export function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showForcePasswordModal, setShowForcePasswordModal] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const user = login(email.trim(), password);
      if (user) {
        if (user.mustChangePassword === true) {
          setShowForcePasswordModal(true);
          return;
        }
        if (user.password === DEFAULT_WORKER_USER_PASSWORD) {
          setShowForcePasswordModal(true);
          return;
        }
        initializeUserData(user.role);
        navigate('/dashboard');
      } else {
        setError(t('login.invalidCredentials'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('login.invalidCredentials'));
    }
  };

  const handleForcePasswordSuccess = () => {
    const user = useAuthStore.getState().currentUser;
    if (user) initializeUserData(user.role);
    setShowForcePasswordModal(false);
    navigate('/dashboard');
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
          <img
            src="/logo.png"
            alt="Özartek Logo"
            height={60}
            style={{ display: 'block', width: 'auto' }}
          />
          <Text
            component="span"
            fw={700}
            style={{
              fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
              fontSize: 'var(--mantine-h2-font-size)',
              lineHeight: 1.2,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            <Text component="span" inherit style={{ color: BRAND_TURQUOISE }}>
              ÖZAR
            </Text>
            <Text component="span" inherit style={{ color: BRAND_TEAL }}>
              TEK
            </Text>
          </Text>
        </Stack>
        <form onSubmit={handleLogin}>
          <Stack gap="md">
            <TextInput
              label={t('login.username')}
              placeholder="ornek@firma.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
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
      <ForcePasswordChangeModal
        opened={showForcePasswordModal}
        onClose={() => setShowForcePasswordModal(false)}
        onSuccess={handleForcePasswordSuccess}
      />
    </Box>
  );
}
