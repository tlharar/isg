import { useState, useMemo } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  Modal,
  TextInput,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { IconPlus, IconUpload, IconSettings, IconTrash, IconCheck } from '@tabler/icons-react';
import { usePlanStore, getTemplatesForType, PLAN_TYPE_LABELS, normalizePlanType, type PlanTemplate } from '@store/planStore';
import { useCompanyStore } from '@store/companyStore';
import { exportTableToExcel } from '@shared/utils';

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
  const planTemplates = usePlanStore((s) => s.templates);
  const addTemplate = usePlanStore((s) => s.addTemplate);
  const deleteTemplate = usePlanStore((s) => s.deleteTemplate);
  const toggleComplete = usePlanStore((s) => s.toggleComplete);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const addAttachment = usePlanStore((s) => s.addAttachment);

  const filteredPlans = useMemo(() => {
    return plans.filter((p) => (p.type ?? 'WORK') === planType).sort((a, b) => b.year - a.year);
  }, [plans, planType]);

  const templateNames = useMemo(
    () => getTemplatesForType(planType, planType === 'WORK' ? planTemplates : undefined),
    [planType, planTemplates]
  );
  const title = PLAN_TYPE_LABELS[planType];

  const [templatesOpened, { open: openTemplates, close: closeTemplates }] = useDisclosure(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const handleAddTemplate = () => {
    const name = newTemplateName.trim();
    if (!name) return;
    addTemplate(name);
    setNewTemplateName('');
  };

  const handleDeleteTemplate = (t: PlanTemplate) => {
    if (window.confirm(`"${t.name}" şablonunu silmek istediğinize emin misiniz?`)) {
      deleteTemplate(t.id);
    }
  };

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

  const handleExcelDownload = () => {
    const PLAN_EXPORT_COLUMNS = ['Faaliyet Konusu', 'Sorumlu', 'Tarih', 'Durum'] as const;
    const mappedData = filteredPlans.map((plan) => {
      const company = getCompanyById(plan.companyId);
      const firstItem = plan.items[0];
      return {
        'Faaliyet Konusu': plan.items.length
          ? plan.items.map((i) => i.activity).join('; ')
          : `${plan.year} - ${company?.name ?? plan.companyId}`,
        'Sorumlu': firstItem?.responsible ?? '—',
        'Tarih': formatDate(plan.creationDate),
        'Durum': plan.isCompleted ? 'Tamamlandı' : 'Bekliyor',
      };
    });
    const filename = `Yillik_Plan_${planType}_${new Date().toISOString().slice(0, 10)}`;
    exportTableToExcel(mappedData, [...PLAN_EXPORT_COLUMNS], filename);
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
            <Button variant="light" leftSection={<IconCheck size={16} />} onClick={handleExcelDownload} disabled={filteredPlans.length === 0}>
              Excel İndir
            </Button>
            {planType === 'WORK' && (
              <Button variant="light" leftSection={<IconSettings size={16} />} onClick={openTemplates}>
                Şablonları Düzenle
              </Button>
            )}
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
                    const completed = plan.isCompleted === true;
                    return (
                      <Table.Tr
                        key={plan.id}
                        style={{
                          opacity: completed ? 0.85 : 1,
                          backgroundColor: completed ? 'var(--mantine-color-green-0)' : undefined,
                        }}
                      >
                        <Table.Td>{plan.year}</Table.Td>
                        <Table.Td>{company?.name ?? plan.companyId}</Table.Td>
                        <Table.Td>{formatDate(plan.creationDate)}</Table.Td>
                        <Table.Td>
                          {completed ? (
                            <Badge color="green" size="sm">Tamamlandı</Badge>
                          ) : (
                            planStatus(plan)
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs">
                            {completed ? (
                              <Button
                                variant="subtle"
                                size="xs"
                                color="gray"
                                leftSection={<IconCheck size={14} />}
                                onClick={() => toggleComplete(plan.id)}
                              >
                                Tamamlandı (iptal)
                              </Button>
                            ) : (
                              <Button
                                variant="light"
                                size="xs"
                                color="green"
                                leftSection={<IconCheck size={14} />}
                                onClick={() => toggleComplete(plan.id)}
                              >
                                Tamamlandı
                              </Button>
                            )}
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

      <Modal opened={templatesOpened} onClose={closeTemplates} title="Şablon Yönetimi" size="md">
        <Stack gap="md">
          <Group align="flex-end" wrap="nowrap">
            <TextInput
              label="Şablon Adı"
              placeholder="Yeni şablon adı"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.currentTarget.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddTemplate()}
              style={{ flex: 1 }}
            />
            <Button onClick={handleAddTemplate} disabled={!newTemplateName.trim()}>
              Ekle
            </Button>
          </Group>
          <MantineText size="sm" fw={500}>Mevcut şablonlar</MantineText>
          {planTemplates.length === 0 ? (
            <MantineText size="sm" c="dimmed">Henüz şablon yok. Yukarıdan ekleyin.</MantineText>
          ) : (
            <Table withTableBorder withColumnBorders>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Şablon Adı</Table.Th>
                  <Table.Th style={{ width: 60 }}>İşlem</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {planTemplates.map((t) => (
                  <Table.Tr key={t.id}>
                    <Table.Td>{t.name}</Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="sm"
                        onClick={() => handleDeleteTemplate(t)}
                        aria-label="Sil"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}
        </Stack>
      </Modal>
    </>
  );
}
