import { useState, useMemo, useEffect } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  TextInput,
  Select,
  Checkbox,
  ActionIcon,
  Modal,
  ScrollArea,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate, useParams } from 'react-router-dom';
import { IconPlus, IconTrash, IconTemplate, IconDeviceFloppy, IconFileSpreadsheet } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  usePlanStore,
  getTemplatesForType,
  PLAN_TYPE_LABELS,
  RESPONSIBLE_OPTIONS,
  MONTHS,
  normalizePlanType,
  type PlanItem,
} from '@store/planStore';
import { useCompanyStore } from '@store/companyStore';

function generateItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const MONTH_LABELS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];

export function PlanEditorPage() {
  const { planType: planTypeParam, id } = useParams<{ planType: string; id: string }>();
  const planType = useMemo(() => normalizePlanType(planTypeParam), [planTypeParam]);
  const navigate = useNavigate();
  const companies = useCompanyStore((s) => s.companies);
  const getPlanById = usePlanStore((s) => s.getPlanById);
  const addPlan = usePlanStore((s) => s.addPlan);
  const updatePlan = usePlanStore((s) => s.updatePlan);

  const isNew = id === 'new';
  const existingPlan = useMemo(() => (id && !isNew ? getPlanById(id) : null), [id, isNew, getPlanById]);

  const [companyId, setCompanyId] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [items, setItems] = useState<PlanItem[]>([]);
  const [templateModalOpened, { open: openTemplateModal, close: closeTemplateModal }] = useDisclosure(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);

  const templates = useMemo(() => getTemplatesForType(planType), [planType]);
  const title = PLAN_TYPE_LABELS[planType];
  const listPath = `/safety/plans/${planType.toLowerCase()}`;

  useEffect(() => {
    if (existingPlan) {
      setCompanyId(existingPlan.companyId);
      setYear(existingPlan.year);
      setItems(existingPlan.items.map((i) => ({ ...i })));
    }
  }, [existingPlan?.id]);

  const companyOptions = useMemo(
    () => companies.map((c) => ({ value: c.id, label: c.name })),
    [companies]
  );

  const addEmptyRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: generateItemId(),
        activity: '',
        responsible: RESPONSIBLE_OPTIONS[0]?.value ?? 'İSG Uzmanı',
        months: [],
        status: 'Planned',
      },
    ]);
  };

  const addFromTemplates = () => {
    const newItems: PlanItem[] = selectedTemplates.map((activity) => ({
      id: generateItemId(),
      activity,
      responsible: RESPONSIBLE_OPTIONS[0]?.value ?? 'İSG Uzmanı',
      months: [],
      status: 'Planned',
    }));
    setItems((prev) => [...prev, ...newItems]);
    setSelectedTemplates([]);
    closeTemplateModal();
  };

  const removeRow = (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  const updateItem = (itemId: string, patch: Partial<PlanItem>) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, ...patch } : i))
    );
  };

  const toggleMonth = (itemId: string, month: number) => {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== itemId) return i;
        const has = i.months.includes(month);
        return {
          ...i,
          months: has ? i.months.filter((m) => m !== month) : [...i.months, month].sort((a, b) => a - b),
        };
      })
    );
  };

  const handleSave = () => {
    if (!companyId.trim()) {
      notifications.show({ title: 'Eksik bilgi', message: 'Firma seçin.', color: 'red' });
      return;
    }
    if (year < 2000 || year > 2100) {
      notifications.show({ title: 'Geçersiz yıl', message: 'Yıl 2000-2100 arasında olmalı.', color: 'red' });
      return;
    }
    if (existingPlan) {
      updatePlan(existingPlan.id, { companyId, year, items });
      notifications.show({ title: 'Plan güncellendi', message: `${title} kaydedildi.`, color: 'green' });
    } else {
      addPlan({ companyId, year, type: planType, items, attachments: [] });
      notifications.show({ title: 'Plan oluşturuldu', message: `${title} kaydedildi.`, color: 'green' });
    }
    navigate(listPath);
  };

  const handleExcelDownload = () => {
    notifications.show({
      title: 'Excel indiriliyor',
      message: `${title} Excel olarak hazırlanıyor...`,
      color: 'blue',
    });
  };

  const toggleTemplate = (name: string) => {
    setSelectedTemplates((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>{existingPlan ? `${title} — Düzenle` : `Yeni ${title}`}</Title>
            <MantineText c="dimmed" size="sm">
              Firma ve yıl seçin, faaliyetleri ekleyin ve ayları işaretleyin.
            </MantineText>
          </div>
          <Button variant="default" onClick={() => navigate(listPath)}>
            Listeye Dön
          </Button>
        </Group>

        <Paper withBorder p="md">
          <Group align="flex-end" gap="md" mb="md">
            <Select
              label="Firma"
              placeholder="Firma seçin"
              data={companyOptions}
              value={companyId || null}
              onChange={(v) => setCompanyId(v ?? '')}
              style={{ minWidth: 220 }}
            />
            <TextInput
              label="Yıl"
              type="number"
              min={2000}
              max={2100}
              value={year}
              onChange={(e) => setYear(parseInt(e.currentTarget.value, 10) || new Date().getFullYear())}
              style={{ width: 100 }}
            />
          </Group>

          <Group gap="xs" mb="md">
            <Button
              variant="light"
              size="sm"
              leftSection={<IconTemplate size={16} />}
              onClick={openTemplateModal}
            >
              Şablondan Ekle
            </Button>
            <Button variant="light" size="sm" leftSection={<IconPlus size={16} />} onClick={addEmptyRow}>
              Satır Ekle
            </Button>
          </Group>

          <ScrollArea.Autosize mah={500} type="scroll" offsetScrollbars>
            <Table.ScrollContainer minWidth={900}>
              <Table striped highlightOnHover layout="fixed">
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ minWidth: 200 }}>Faaliyet Konusu</Table.Th>
                    <Table.Th style={{ width: 140 }}>Sorumlu</Table.Th>
                    <Table.Th style={{ width: 280 }}>
                      <Group gap="xs">
                        {MONTH_LABELS.map((m) => (
                          <Box key={m} w={20} ta="center">
                            <MantineText size="xs">{m}</MantineText>
                          </Box>
                        ))}
                      </Group>
                    </Table.Th>
                    <Table.Th w={60} />
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {items.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={4}>
                        <MantineText size="sm" c="dimmed" ta="center" py="md">
                          &quot;Şablondan Ekle&quot; veya &quot;Satır Ekle&quot; ile satır ekleyin.
                        </MantineText>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    items.map((item) => (
                      <Table.Tr key={item.id}>
                        <Table.Td>
                          <TextInput
                            size="xs"
                            placeholder="Faaliyet"
                            value={item.activity}
                            onChange={(e) => updateItem(item.id, { activity: e.currentTarget.value })}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Select
                            size="xs"
                            data={RESPONSIBLE_OPTIONS}
                            value={item.responsible}
                            onChange={(v) => updateItem(item.id, { responsible: v ?? item.responsible })}
                          />
                        </Table.Td>
                        <Table.Td>
                          <Group gap={4}>
                            {MONTHS.map((m) => (
                              <Checkbox
                                key={m}
                                size="xs"
                                checked={item.months.includes(m)}
                                onChange={() => toggleMonth(item.id, m)}
                                aria-label={`Ay ${m}`}
                              />
                            ))}
                          </Group>
                        </Table.Td>
                        <Table.Td>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => removeRow(item.id)}
                            aria-label="Satırı sil"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </ScrollArea.Autosize>

          <Group mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
            <Button leftSection={<IconDeviceFloppy size={16} />} onClick={handleSave}>
              Kaydet
            </Button>
            <Button
              variant="light"
              leftSection={<IconFileSpreadsheet size={16} />}
              onClick={handleExcelDownload}
            >
              Excel Olarak İndir
            </Button>
          </Group>
        </Paper>
      </Stack>

      <Modal opened={templateModalOpened} onClose={closeTemplateModal} title={`${title} — Şablondan Ekle`} size="md">
        <Stack gap="md">
          <MantineText size="sm" c="dimmed">
            Eklemek istediğiniz faaliyetleri seçin. Aylar plana eklendikten sonra işaretleyebilirsiniz.
          </MantineText>
          <Stack gap="xs">
            {templates.map((name) => (
              <Checkbox
                key={name}
                label={name}
                checked={selectedTemplates.includes(name)}
                onChange={() => toggleTemplate(name)}
              />
            ))}
          </Stack>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeTemplateModal}>
              İptal
            </Button>
            <Button onClick={addFromTemplates} disabled={selectedTemplates.length === 0}>
              Seçilenleri Ekle ({selectedTemplates.length})
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
