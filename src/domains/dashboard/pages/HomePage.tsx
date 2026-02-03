import {
  Title,
  Text,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Badge,
  Paper,
  Box,
  Button,
  ThemeIcon,
  ActionIcon,
} from '@mantine/core';
import {
  IconBuilding,
  IconUsers,
  IconAlertCircle,
  IconCalendarCheck,
  IconTrendingUp,
  IconAlertTriangle,
  IconClipboardCheck,
  IconUserPlus,
  IconPlus,
} from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@shared/i18n';
import { useAuthStore } from '@shared/stores/authStore';
import { useCompanyStore } from '@store/companyStore';
import { useWorkerStore } from '@store/workerStore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock data for charts
const riskDistributionData = [
  { name: 'Düşük Risk', value: 45, color: '#51cf66' },
  { name: 'Orta Risk', value: 28, color: '#ffd43b' },
  { name: 'Yüksek Risk', value: 18, color: '#ff6b6b' },
  { name: 'Çok Yüksek Risk', value: 9, color: '#c92a2a' },
];

const dofStatusData = [
  { month: 'Ağu', open: 12, closed: 8 },
  { month: 'Eyl', open: 15, closed: 10 },
  { month: 'Eki', open: 8, closed: 14 },
  { month: 'Kas', open: 10, closed: 9 },
  { month: 'Ara', open: 7, closed: 11 },
  { month: 'Oca', open: 5, closed: 6 },
];

// Mock critical actions
const criticalActions = [
  {
    id: '1',
    message: 'ABC Şirketi - Sözleşme Bitiyor',
    detail: '3 Gün Kaldı',
    badge: 'Acil',
    badgeColor: 'red',
  },
  {
    id: '2',
    message: 'Ahmet Yılmaz - Yüksekte Çalışma Eğitimi',
    detail: 'Süresi Doldu',
    badge: 'Eğitim',
    badgeColor: 'orange',
  },
  {
    id: '3',
    message: 'Boya Bölümü - Periyodik Kontrol',
    detail: 'Gecikti',
    badge: 'Denetim',
    badgeColor: 'yellow',
  },
  {
    id: '4',
    message: 'XYZ Ltd. - İSG Kurul Toplantısı',
    detail: 'Yarın',
    badge: 'Toplantı',
    badgeColor: 'blue',
  },
];

function getTurkishDate(): string {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = [
    'Ocak',
    'Şubat',
    'Mart',
    'Nisan',
    'Mayıs',
    'Haziran',
    'Temmuz',
    'Ağustos',
    'Eylül',
    'Ekim',
    'Kasım',
    'Aralık',
  ];
  const now = new Date();
  const day = now.getDate();
  const month = months[now.getMonth()];
  const year = now.getFullYear();
  const dayName = days[now.getDay()];
  return `${day} ${month} ${year}, ${dayName}`;
}

export function HomePage() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const companies = useCompanyStore((s) => s.companies);
  const workers = useWorkerStore((s) => s.workers);

  // Calculate KPIs
  const totalCompanies = companies.length;
  const activeWorkers = workers.filter((w) => w.companyId).length;
  const pendingDof = 5; // Mock
  const accidentFreeDays = 124; // Mock

  const quickActions = [
    { to: '/safety/incident/accident-records', labelKey: 'home.quickActions.reportAccident', icon: IconAlertTriangle, color: 'red' },
    { to: '/risk', labelKey: 'home.quickActions.addRisk', icon: IconAlertCircle, color: 'orange' },
    { to: '/safety/audit/dof-list', labelKey: 'home.quickActions.startDof', icon: IconClipboardCheck, color: 'blue' },
    { to: '/company/employees', labelKey: 'home.quickActions.addEmployee', icon: IconUserPlus, color: 'teal' },
  ];

  return (
    <Stack gap="xl">
      {/* Welcome Section */}
      <Box>
        <Title order={1} mb={4}>
          {t('home.welcome').replace('{{name}}', user?.username || 'Kullanıcı')}
        </Title>
        <Text c="dimmed" size="sm">
          {getTurkishDate()}
        </Text>
      </Box>

      {/* KPI Cards */}
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        {/* Total Companies */}
        <Card shadow="sm" padding="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                {t('home.kpi.totalCompanies')}
              </Text>
              <Text size="xl" fw={700} mt={4}>
                {totalCompanies}
              </Text>
            </Box>
            <ThemeIcon size="xl" radius="md" variant="light" color="blue">
              <IconBuilding size={24} />
            </ThemeIcon>
          </Group>
          <Group gap={4} mt="xs">
            <IconTrendingUp size={14} color="var(--mantine-color-teal-6)" />
            <Text size="xs" c="teal">
              +2 {t('home.kpi.thisMonth')}
            </Text>
          </Group>
        </Card>

        {/* Active Workers */}
        <Card shadow="sm" padding="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                {t('home.kpi.activeWorkers')}
              </Text>
              <Text size="xl" fw={700} mt={4}>
                {activeWorkers.toLocaleString('tr-TR')}
              </Text>
            </Box>
            <ThemeIcon size="xl" radius="md" variant="light" color="cyan">
              <IconUsers size={24} />
            </ThemeIcon>
          </Group>
          <Group gap={4} mt="xs">
            <IconTrendingUp size={14} color="var(--mantine-color-teal-6)" />
            <Text size="xs" c="teal">
              +18 {t('home.kpi.thisWeek')}
            </Text>
          </Group>
        </Card>

        {/* Pending DOF */}
        <Card shadow="sm" padding="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                {t('home.kpi.pendingDof')}
              </Text>
              <Text size="xl" fw={700} mt={4} c={pendingDof > 0 ? 'red' : 'gray'}>
                {pendingDof}
              </Text>
            </Box>
            <ThemeIcon size="xl" radius="md" variant="light" color={pendingDof > 0 ? 'red' : 'gray'}>
              <IconAlertCircle size={24} />
            </ThemeIcon>
          </Group>
          <Group gap={4} mt="xs">
            {pendingDof > 0 ? (
              <>
                <IconTrendingUp size={14} color="var(--mantine-color-red-6)" />
                <Text size="xs" c="red">
                  {t('home.kpi.requiresAttention')}
                </Text>
              </>
            ) : (
              <Text size="xs" c="gray">
                {t('home.kpi.allClear')}
              </Text>
            )}
          </Group>
        </Card>

        {/* Accident-Free Days */}
        <Card shadow="sm" padding="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                {t('home.kpi.accidentFreeDays')}
              </Text>
              <Text size="xl" fw={700} mt={4} c="green">
                {accidentFreeDays}
              </Text>
            </Box>
            <ThemeIcon size="xl" radius="md" variant="light" color="green">
              <IconCalendarCheck size={24} />
            </ThemeIcon>
          </Group>
          <Group gap={4} mt="xs">
            <Text size="xs" c="dimmed">
              {t('home.kpi.lastAccident')}: 12 Eki 2025
            </Text>
          </Group>
        </Card>
      </SimpleGrid>

      {/* Main Content Grid */}
      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        {/* Critical Actions List */}
        <Paper shadow="sm" p="lg" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={3}>{t('home.criticalActions.title')}</Title>
            <Badge variant="filled" color="red" size="lg">
              {criticalActions.length}
            </Badge>
          </Group>
          <Stack gap="sm">
            {criticalActions.map((action) => (
              <Paper key={action.id} p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                  <Box style={{ flex: 1 }}>
                    <Text size="sm" fw={600}>
                      {action.message}
                    </Text>
                    <Text size="xs" c="dimmed" mt={2}>
                      {action.detail}
                    </Text>
                  </Box>
                  <Badge color={action.badgeColor} size="sm">
                    {action.badge}
                  </Badge>
                </Group>
              </Paper>
            ))}
          </Stack>
          <Button variant="light" fullWidth mt="md" component={Link} to="/safety/audit/dof-list">
            {t('home.criticalActions.viewAll')}
          </Button>
        </Paper>

        {/* Risk Distribution Chart */}
        <Paper shadow="sm" p="lg" withBorder>
          <Title order={3} mb="md">
            {t('home.charts.riskDistribution')}
          </Title>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={riskDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {riskDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <Stack gap="xs" mt="md">
            {riskDistributionData.map((item) => (
              <Group key={item.name} justify="space-between">
                <Group gap="xs">
                  <Box w={12} h={12} style={{ backgroundColor: item.color, borderRadius: 2 }} />
                  <Text size="sm">{item.name}</Text>
                </Group>
                <Text size="sm" fw={600}>
                  {item.value}
                </Text>
              </Group>
            ))}
          </Stack>
        </Paper>
      </SimpleGrid>

      {/* DOF Status Chart */}
      <Paper shadow="sm" p="lg" withBorder>
        <Title order={3} mb="md">
          {t('home.charts.dofStatus')}
        </Title>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={dofStatusData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="open" name={t('home.charts.openDof')} fill="#ff6b6b" />
            <Bar dataKey="closed" name={t('home.charts.closedDof')} fill="#51cf66" />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* Quick Actions */}
      <Paper shadow="sm" p="lg" withBorder style={{ backgroundColor: 'var(--mantine-color-teal-0)' }}>
        <Title order={3} mb="md">
          {t('home.quickActions.title')}
        </Title>
        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          {quickActions.map((action) => (
            <Button
              key={action.to}
              component={Link}
              to={action.to}
              variant="light"
              color={action.color}
              leftSection={<action.icon size={18} />}
              size="md"
              fullWidth
            >
              {t(action.labelKey)}
            </Button>
          ))}
        </SimpleGrid>
      </Paper>

      {/* Floating Action Button (Mobile) */}
      <ActionIcon
        size="xl"
        radius="xl"
        variant="filled"
        color="teal"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 100,
        }}
        component={Link}
        to="/risk"
        aria-label={t('home.fab.addRisk')}
        visibleFrom="xs"
        hiddenFrom="sm"
      >
        <IconPlus size={28} />
      </ActionIcon>
    </Stack>
  );
}
