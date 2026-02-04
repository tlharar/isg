import { useMemo } from 'react';
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
import { useSubContractorStore } from '@store/subContractorStore';
import { useDofStore } from '@store/dofStore';
import { useIncidentStore } from '@store/incidentStore';
import { useRiskStore } from '@store/riskStore';
import { useWorkEquipmentStore } from '@store/workEquipmentStore';
import { useEducationStore } from '@store/educationStore';
import { useBoardStore } from '@store/boardStore';
import { useHealthStore } from '@domains/health/stores/healthStore';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RISK_LEVEL_COLORS: Record<string, string> = {
  'Düşük': '#51cf66',
  'Orta': '#ffd43b',
  'Yüksek': '#ff6b6b',
  'Çok Yüksek': '#c92a2a',
};

const RISK_LEVEL_ORDER = ['Düşük', 'Orta', 'Yüksek', 'Çok Yüksek'];

function getTurkishDate(): string {
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
  ];
  const now = new Date();
  return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${days[now.getDay()]}`;
}

function formatDateTr(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function toDateKey(d: Date | string): string {
  const x = typeof d === 'string' ? d : d.toISOString?.() ?? '';
  return x.slice(0, 10);
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from + 'T12:00:00').getTime();
  const b = new Date(to + 'T12:00:00').getTime();
  return Math.floor((b - a) / (24 * 60 * 60 * 1000));
}

export type ActivityItemType = 'Critical' | 'Warning' | 'Inspection' | 'Meeting' | 'Health';

export interface ActivityItem {
  id: string;
  date: string;
  dateLabel: string;
  message: string;
  detail: string;
  badge: string;
  badgeColor: string;
  type: ActivityItemType;
  to: string;
}

function buildUpcomingActivities(
  subcontractors: { id: string; name: string; contractEndDate: Date | string }[],
  sessions: { id: string; title: string; validUntil: Date | string }[],
  equipment: { id: string; name: string; nextControlDate: string | null }[],
  meetings: { id: string; date: string; agenda: string; status: string }[],
  healthExpiring: { id: string; employeeName?: string; validUntil?: string; examType?: string }[],
  withinDays: number
): ActivityItem[] {
  const today = new Date().toISOString().slice(0, 10);
  const limit = new Date();
  limit.setDate(limit.getDate() + withinDays);
  const limitStr = limit.toISOString().slice(0, 10);
  const items: ActivityItem[] = [];

  subcontractors.forEach((s) => {
    const endStr = toDateKey(s.contractEndDate);
    if (endStr <= limitStr) {
      const days = daysBetween(today, endStr);
      items.push({
        id: `sub-${s.id}`,
        date: endStr,
        dateLabel: formatDateTr(endStr),
        message: `${s.name} - Sözleşme Bitiyor`,
        detail: days < 0 ? 'Süresi doldu' : `${days} gün kaldı`,
        badge: 'Sözleşme',
        badgeColor: 'red',
        type: 'Critical',
        to: '/company/subcontractors',
      });
    }
  });

  sessions.forEach((s) => {
    const validStr = toDateKey(s.validUntil);
    if (validStr <= limitStr) {
      const days = daysBetween(today, validStr);
      items.push({
        id: `edu-${s.id}`,
        date: validStr,
        dateLabel: formatDateTr(validStr),
        message: `${s.title} - Eğitim Süresi Doluyor`,
        detail: days < 0 ? 'Süresi doldu' : `${days} gün kaldı`,
        badge: 'Eğitim',
        badgeColor: 'orange',
        type: 'Warning',
        to: '/training',
      });
    }
  });

  equipment.forEach((e) => {
    if (!e.nextControlDate) return;
    if (e.nextControlDate <= limitStr) {
      const days = daysBetween(today, e.nextControlDate);
      items.push({
        id: `eq-${e.id}`,
        date: e.nextControlDate,
        dateLabel: formatDateTr(e.nextControlDate),
        message: `${e.name} - Periyodik Kontrol`,
        detail: days < 0 ? 'Gecikti' : `${days} gün kaldı`,
        badge: 'Kontrol',
        badgeColor: 'yellow',
        type: 'Inspection',
        to: '/safety/equipment/controls',
      });
    }
  });

  meetings.filter((m) => m.status === 'Planned').forEach((m) => {
    if (m.date <= limitStr || m.date >= today) {
      const d = daysBetween(today, m.date);
      if (d <= withinDays) {
        items.push({
          id: `mtg-${m.id}`,
          date: m.date,
          dateLabel: formatDateTr(m.date),
          message: `Kurul Toplantısı - ${m.agenda?.slice(0, 40) ?? 'Planlandı'}${(m.agenda?.length ?? 0) > 40 ? '…' : ''}`,
          detail: d === 0 ? 'Bugün' : d === 1 ? 'Yarın' : `${d} gün sonra`,
          badge: 'Toplantı',
          badgeColor: 'blue',
          type: 'Meeting',
          to: '/safety/board/meetings',
        });
      }
    }
  });

  healthExpiring.forEach((e) => {
    const validStr = e.validUntil ?? '';
    if (validStr && validStr <= limitStr) {
      items.push({
        id: `health-${e.id}`,
        date: validStr,
        dateLabel: formatDateTr(validStr),
        message: `${e.employeeName ?? 'Çalışan'} - ${e.examType ?? 'Periyodik'} Muayene`,
        detail: `Geçerlilik: ${formatDateTr(validStr)}`,
        badge: 'Muayene',
        badgeColor: 'orange',
        type: 'Health',
        to: '/health/examination/entry-periodic',
      });
    }
  });

  return items
    .sort((a, b) => (a.date > b.date ? 1 : -1))
    .slice(0, 5);
}

export function HomePage() {
  const { t } = useTranslation();
  const currentUser = useAuthStore((s) => s.currentUser);
  const companies = useCompanyStore((s) => s.companies);
  const workers = useWorkerStore((s) => s.workers);
  const subcontractors = useSubContractorStore((s) => s.subContractors);
  const dofRecords = useDofStore((s) => s.records);
  const incidents = useIncidentStore((s) => s.incidents);
  const risks = useRiskStore((s) => s.risks);
  const equipment = useWorkEquipmentStore((s) => s.equipment);
  const sessions = useEducationStore((s) => s.sessions);
  const meetings = useBoardStore((s) => s.meetings);
  const getExamsExpiringWithinDays = useHealthStore((s) => s.getExamsExpiringWithinDays);
  const expiringExams = getExamsExpiringWithinDays(30);

  const totalFirms = subcontractors.length;
  const activeWorkers = workers.length;
  const pendingDof = useMemo(() => dofRecords.filter((r) => r.status !== 'Kapandı').length, [dofRecords]);
  const accidentFreeDays = useMemo(() => {
    if (incidents.length === 0) return 365;
    const dates = incidents.map((i) => (i.dateTime || i.createdAt || '').slice(0, 10)).filter(Boolean);
    if (dates.length === 0) return 365;
    const latest = dates.sort().reverse()[0];
    const today = new Date().toISOString().slice(0, 10);
    const days = daysBetween(latest, today);
    return Math.max(0, days);
  }, [incidents]);

  const lastIncidentDateLabel = useMemo(() => {
    if (incidents.length === 0) return null;
    const dates = incidents.map((i) => (i.dateTime || i.createdAt || '').slice(0, 10)).filter(Boolean);
    if (dates.length === 0) return null;
    const latest = dates.sort().reverse()[0];
    return formatDateTr(latest);
  }, [incidents]);

  const upcomingItems = useMemo(() => {
    return buildUpcomingActivities(
      subcontractors,
      sessions,
      equipment.filter((e) => e.status === 'Active'),
      meetings,
      expiringExams,
      15
    );
  }, [subcontractors, sessions, equipment, meetings, expiringExams]);

  const riskDistributionData = useMemo(() => {
    const byLevel: Record<string, number> = { Düşük: 0, Orta: 0, Yüksek: 0, 'Çok Yüksek': 0 };
    risks.forEach((r) => {
      if (byLevel[r.riskLevel] !== undefined) byLevel[r.riskLevel]++;
    });
    return RISK_LEVEL_ORDER.filter((level) => byLevel[level] > 0).map((name) => ({
      name: name === 'Düşük' ? 'Düşük Risk' : name === 'Orta' ? 'Orta Risk' : name === 'Yüksek' ? 'Yüksek Risk' : 'Çok Yüksek Risk',
      value: byLevel[name],
      color: RISK_LEVEL_COLORS[name] ?? '#868e96',
    }));
  }, [risks]);

  const dofStatusData = useMemo(() => {
    const months: { month: string; monthKey: string; open: number; closed: number }[] = [];
    const now = new Date();
    const monthNames = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = d.getMonth();
      const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
      const open = dofRecords.filter(
        (r) => r.status === 'Açık' && r.deadline && r.deadline.startsWith(monthKey)
      ).length;
      const closed = dofRecords.filter(
        (r) => r.status === 'Kapandı' && r.closingDate && r.closingDate.startsWith(monthKey)
      ).length;
      months.push({
        month: monthNames[month],
        monthKey,
        open,
        closed,
      });
    }
    return months;
  }, [dofRecords]);

  const quickActions = [
    { to: '/safety/incident/accident-records', labelKey: 'home.quickActions.reportAccident', icon: IconAlertTriangle, color: 'red' },
    { to: '/risk', labelKey: 'home.quickActions.addRisk', icon: IconAlertCircle, color: 'orange' },
    { to: '/safety/audit/dof-list', labelKey: 'home.quickActions.startDof', icon: IconClipboardCheck, color: 'blue' },
    { to: '/company/employees', labelKey: 'home.quickActions.addEmployee', icon: IconUserPlus, color: 'teal' },
  ];

  return (
    <Stack gap="xl">
      <Box>
        <Title order={1} mb={4}>
          {t('home.welcome').replace(
            '{{name}}',
            currentUser
              ? [currentUser.firstName, currentUser.lastName].filter(Boolean).join(' ') || currentUser.email
              : 'Kullanıcı'
          )}
        </Title>
        <Text c="dimmed" size="sm">
          {getTurkishDate()}
        </Text>
      </Box>

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <Card shadow="sm" padding="lg" withBorder>
          <Group justify="space-between" mb="xs">
            <Box>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                {t('home.kpi.totalCompanies')}
              </Text>
              <Text size="xl" fw={700} mt={4}>
                {totalFirms}
              </Text>
            </Box>
            <ThemeIcon size="xl" radius="md" variant="light" color="blue">
              <IconBuilding size={24} />
            </ThemeIcon>
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            {t('home.kpi.registeredCompanies')}
          </Text>
        </Card>

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
          <Text size="xs" c="dimmed" mt="xs">
            {t('home.kpi.registeredWorkers')}
          </Text>
        </Card>

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
          <Text size="xs" c="dimmed" mt="xs">
            {lastIncidentDateLabel
              ? `${t('home.kpi.lastAccident')}: ${lastIncidentDateLabel}`
              : incidents.length === 0
                ? t('home.kpi.noAccidents')
                : `${t('home.kpi.lastAccident')}: —`}
          </Text>
        </Card>
      </SimpleGrid>

      <SimpleGrid cols={{ base: 1, lg: 2 }} spacing="lg">
        <Paper shadow="sm" p="lg" withBorder>
          <Group justify="space-between" mb="md">
            <Title order={3}>{t('home.criticalActions.title')}</Title>
            <Badge variant="filled" color="red" size="lg">
              {upcomingItems.length}
            </Badge>
          </Group>
          <Stack gap="sm">
            {upcomingItems.length === 0 ? (
              <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
                <Text size="sm" c="dimmed">
                  {t('home.criticalActions.empty')}
                </Text>
              </Paper>
            ) : (
              upcomingItems.map((action) => (
                <Paper
                  key={action.id}
                  p="md"
                  withBorder
                  style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}
                  component={Link}
                  to={action.to}
                >
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
              ))
            )}
          </Stack>
          <Button variant="light" fullWidth mt="md" component={Link} to="/safety/audit/dof-list">
            {t('home.criticalActions.viewAll')}
          </Button>
        </Paper>

        <Paper shadow="sm" p="lg" withBorder>
          <Title order={3} mb="md">
            {t('home.charts.riskDistribution')}
          </Title>
          {riskDistributionData.length === 0 ? (
            <Box py="xl" style={{ textAlign: 'center' }}>
              <Text size="sm" c="dimmed">
                {t('home.charts.noRiskData')}
              </Text>
            </Box>
          ) : (
            <>
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
            </>
          )}
        </Paper>
      </SimpleGrid>

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
