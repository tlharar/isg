import { useMemo } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  Modal,
  List,
  ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { IconPlus, IconUpload, IconTemplate } from '@tabler/icons-react';
import { usePlanStore, getTemplatesForType, PLAN_TYPE_LABELS, normalizePlanType } from '@store/planStore';
import { useCompanyStore } from '@store/companyStore';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function planStatus(plan: { items: { status: string }[] }): string {
  if (!plan.items.length) return 'Planlandı';
  const completed = plan.items.filter((i) => i.status === 'Completed').length;
  return completed === plan.items.length ? 'Tamamlandı' : `${completed}/${plan.items.length} Tamamlandı`;
}

export function PlanListPage() {
  const { planType: planTypeParam } = useParams<{ planType: string }>();
  const planType = useMemo(() => normalizePlanType(planTypeParam), [planTypeParam]);
  const navigate = useNavigate();
  const plans = usePlanStore((s) => s.plans);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const addAttachment = usePlanStore((s) => s.addAttachment);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => (p.type ?? 'WORK') === planType).sort((a, b) => b.year - a.year);
  }, [plans, planType]);

  const templates = useMemo(() => getTemplatesForType(planType), [planType]);
  const title = PLAN_TYPE_LABELS[planType];

  const [templatesOpened, { open: openTemplates, close: closeTemplates }] = useDisclosure(false);

  const handleNewPlan = () => {
    navigate(`/safety/plans/${planType.toLowerCase()}/new`);
  };

  const handleEdit = (planId: string) => {
    navigate(`/safety/plans/${planType.toLowerCase()}/${planId}`);
  };

  const handleFileUpload = (planId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,application/pdf';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        addAttachment(planId, file.name);
      }
    };
    input.click();
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>{title}</Title>
            <MantineText c="dimmed" size="sm">
              Planları listeleyin, oluşturun ve imzalı kopyaları yükleyin.
            </MantineText>
          </div>
          <Group>
            <Button variant="light" leftSection={<IconTemplate size={16} />} onClick={openTemplates}>
              Şablonlar
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={handleNewPlan}>
              Yeni Plan Oluştur
            </Button>
          </Group>
        </Group>

        <Paper withBorder p="md">
          <Table.ScrollContainer minWidth={600}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Yıl</Table.Th>
                  <Table.Th>Firma</Table.Th>
                  <Table.Th>Oluşturma Tarihi</Table.Th>
                  <Table.Th>Durum</Table.Th>
                  <Table.Th>İşlemler</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredPlans.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <MantineText size="sm" c="dimmed" ta="center" py="md">
                        Henüz plan oluşturulmamış. &quot;Yeni Plan Oluştur&quot; ile başlayın.
                      </MantineText>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredPlans.map((plan) => {
                    const company = getCompanyById(plan.companyId);
                    return (
                      <Table.Tr key={plan.id}>
                        <Table.Td>{plan.year}</Table.Td>
                        <Table.Td>{company?.name ?? plan.companyId}</Table.Td>
                        <Table.Td>{formatDate(plan.creationDate)}</Table.Td>
                        <Table.Td>{planStatus(plan)}</Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            <Button
                              variant="light"
                              size="xs"
                              onClick={() => handleEdit(plan.id)}
                            >
                              Düzenle
                            </Button>
                            <ActionIcon
                              variant="light"
                              size="sm"
                              onClick={() => handleFileUpload(plan.id)}
                              aria-label="Dosya yükle"
                            >
                              <IconUpload size={16} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Stack>

      <Modal opened={templatesOpened} onClose={closeTemplates} title={`${title} — Şablonlar`} size="md">
        <MantineText size="sm" c="dimmed" mb="md">
          Plan editöründe &quot;Şablondan Ekle&quot; ile bu faaliyetleri plana ekleyebilirsiniz.
        </MantineText>
        <List size="sm" spacing="xs">
          {templates.map((t, i) => (
            <List.Item key={i}>{t}</List.Item>
          ))}
        </List>
      </Modal>
    </>
  );
}
