import { Link } from 'react-router-dom';
import { AppShell, Box, Group, Text, UnstyledButton } from '@mantine/core';
import { NavContent } from '../nav/NavContent';

interface ShellSidebarProps {
  /** Called when a nav item is selected (e.g. to close mobile navbar) */
  onCloseMobileNav?: () => void;
}

/**
 * ShellSidebar: Dark sidebar with --sidebar-bg background.
 * Layout: [Logo Area] -> [ScrollArea (Nav Links)] -> [Footer].
 * Logo and nav text use --sidebar-text (white/light). Active state uses cyan-9 + bold.
 */
export function ShellSidebar({ onCloseMobileNav }: ShellSidebarProps) {
  return (
    <AppShell.Navbar
      p={0}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: 'var(--sidebar-bg)',
      }}
    >
      {/* Logo / Brand at top */}
      <UnstyledButton
        component={Link}
        to="/"
        style={{ display: 'block', textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
        aria-label="Özartek"
      >
        <Group h={60} px="md" wrap="nowrap" gap={6} style={{ minWidth: 0, color: 'var(--sidebar-text)' }}>
          <img
            src="/logo.png"
            alt="Özartek Logo"
            height={36}
            style={{ display: 'block', flexShrink: 0, width: 'auto' }}
          />
          <Text
            component="span"
            fw={700}
            style={{
              fontFamily: "'Inter', system-ui, sans-serif",
              fontSize: 'var(--mantine-h4-font-size)',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              color: 'var(--sidebar-text)',
            }}
          >
            ÖZARTEK
          </Text>
        </Group>
      </UnstyledButton>

      <Box
        style={{
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          color: 'var(--sidebar-text)',
        }}
      >
        <NavContent onNavigate={onCloseMobileNav} />
      </Box>
    </AppShell.Navbar>
  );
}
