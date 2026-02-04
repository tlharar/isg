import { useMemo, useState } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Stack,
  Paper,
  SimpleGrid,
  Select,
  Card,
  Group,
  ThemeIcon,
} from '@mantine/core';
import { IconCalendar, IconSchool, IconClipboardList } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { usePlanStore, PLAN_TYPE_LABELS, type PlanType } from '@store/planStore';
import { useCompanyStore } from '@store/companyStore';
import { useAppStore } from '@shared/stores/appStore';

type PlanStatus = 'valid' | 'expired' | 'empty';

const PLAN_TYPE_ICONS: Record<PlanType, typeof IconCalendar> = {
  WORK: IconCalendar,
  TRAINING: IconSchool,
  ASSESSMENT: IconClipboardList,
};

function getPlanStatus(
  latestPlan: { year: number } | undefined,
  currentYear: number
): PlanStatus {
  if (!latestPlan) return 'empty';
  if (latestPlan.year < currentYear) return 'expired';
  return 'valid';
}

function getStatusText(status: PlanStatus): string {
  switch (status) {
    case 'valid':
      return 'Güncel';
    case 'expired':
      return 'Süresi Doldu';
    default:
      return 'Oluşturulmadı';
  }
}

function getStatusColor(status: PlanStatus): string {
  switch (status) {
    case 'valid':
      return 'blue';
    case 'expired':
      return 'red';
    default:
      return 'gray';
  }
}

export function PlanSummaryPage() {
  const navigate = useNavigate();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const companies = useCompanyStore((s) => s.companies);
  const getLatestPlanByCompanyAndType = usePlanStore((s) => s.getLatestPlanByCompanyAndType);

  const currentYear = new Date().getFullYear();
  const companyOptions = useMemo(
    () => companies.map((c) => ({ value: c.id, label: c.name })),
    [companies]
  );
  const [companyId, setCompanyId] = useState(selectedCompanyId ?? '');

  const planTypes: PlanType[] = ['WORK', 'TRAINING', 'ASSESSMENT'];

  const cards = useMemo(() => {
    return planTypes.map((type) => {
      const latest = companyId ? getLatestPlanByCompanyAndType(companyId, type) : undefined;
      const status = getPlanStatus(latest, currentYear);
      return {
        type,
        title: PLAN_TYPE_LABELS[type],
        status,
        statusText: getStatusText(status),
        statusColor: getStatusColor(status),
        Icon: PLAN_TYPE_ICONS[type],
      };
    });
  }, [companyId, getLatestPlanByCompanyAndType, currentYear]);

  const handleViewPlan = (type: PlanType) => {
    navigate(`/safety/plans/${type.toLowerCase()}`);
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Plan Özeti</Title>
          <MantineText c="dimmed" size="sm">
            Seçili firma için tüm plan türlerinin geçerlilik durumunu görüntüleyin.
          </MantineText>
        </div>
      </Group>

      <Paper withBorder p="md">
        <Select
          label="Firma"
          placeholder="Firma seçin"
          data={companyOptions}
          value={companyId || null}
          onChange={(v) => setCompanyId(v ?? '')}
          style={{ maxWidth: 320 }}
        />
        <MantineText size="xs" c="dimmed" mt="xs">
          Plan durumları seçili firmaya göre gösterilir.
        </MantineText>
      </Paper>

      <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="lg">
        {cards.map(({ type, title, statusText, statusColor, Icon }) => (
          <Card key={type} shadow="sm" padding="lg" withBorder>
            <Group justify="space-between" mb="md">
              <ThemeIcon size="xl" radius="md" variant="light" color={statusColor}>
                <Icon size={24} />
              </ThemeIcon>
              <MantineText size="xs" fw={600} tt="uppercase" c={statusColor}>
                {statusText}
              </MantineText>
            </Group>
            <MantineText fw={600} size="lg" mb="xs">
              {title}
            </MantineText>
            <MantineText size="sm" c="dimmed" mb="md">
              Durum: {statusText}
            </MantineText>
            <Button
              variant="light"
              color={statusColor}
              fullWidth
              onClick={() => handleViewPlan(type)}
            >
              Planı Görüntüle
            </Button>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
