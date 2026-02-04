import { Link } from 'react-router-dom';
import { AppShell, Box, Group, Text } from '@mantine/core';
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
      <Group
        component={Link}
        to="/"
        h={60}
        px="md"
        wrap="nowrap"
        gap={6}
        style={{
          flexShrink: 0,
          textDecoration: 'none',
          cursor: 'pointer',
          color: 'var(--sidebar-text)',
          minWidth: 0,
        }}
        aria-label="Özartek"
      >
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
