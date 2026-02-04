import { useState, useMemo } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  TextInput,
  NumberInput,
  Modal,
  Checkbox,
  Badge,
  Progress,
  ActionIcon,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { useEquipmentStore, PPE_TEMPLATES, type Equipment } from '@store/equipmentStore';
import { useCompanyStore } from '@store/companyStore';
import { useAppStore } from '@shared/stores/appStore';

export function EquipmentListPage() {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const items = useEquipmentStore((s) => s.items);
  const addEquipment = useEquipmentStore((s) => s.addEquipment);
  const updateEquipment = useEquipmentStore((s) => s.updateEquipment);
  const deleteEquipment = useEquipmentStore((s) => s.deleteEquipment);
  const addFromTemplate = useEquipmentStore((s) => s.addFromTemplate);

  const [templateOpened, { open: openTemplate, close: closeTemplate }] = useDisclosure(false);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateSelected, setTemplateSelected] = useState<string[]>([]);
  const [defaultStock, setDefaultStock] = useState(50);
  const [form, setForm] = useState({ name: '', standard: '', totalStock: 10 });

  const filteredItems = useMemo(() => {
    const cid = selectedCompanyId ?? '';
    if (!cid) return items;
    return items.filter((e) => e.companyId === cid);
  }, [items, selectedCompanyId]);

  const editingItem = useMemo(
    () => (editingId ? items.find((e) => e.id === editingId) : null),
    [editingId, items]
  );

  const companyOptions = useCompanyStore((s) => s.companies).map((c) => ({ value: c.id, label: c.name }));
  const companyId = selectedCompanyId ?? companyOptions[0]?.value ?? '';

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ name: '', standard: '', totalStock: 10 });
    openForm();
  };

  const handleOpenEdit = (eq: Equipment) => {
    setEditingId(eq.id);
    setForm({
      name: eq.name,
      standard: eq.standard,
      totalStock: eq.totalStock,
    });
    openForm();
  };

  const handleSaveForm = () => {
    if (!form.name.trim()) return;
    const total = Math.max(0, form.totalStock);
    if (editingItem) {
      updateEquipment(editingItem.id, {
        name: form.name.trim(),
        standard: form.standard.trim(),
        totalStock: total,
        currentStock: Math.min(editingItem.currentStock, total),
      });
    } else {
      if (!companyId) return;
      addEquipment({
        companyId,
        name: form.name.trim(),
        standard: form.standard.trim(),
        totalStock: total,
        currentStock: total,
      });
    }
    closeForm();
  };

  const handleTemplateAdd = () => {
    if (templateSelected.length === 0 || !companyId) return;
    addFromTemplate(templateSelected, defaultStock, companyId);
    setTemplateSelected([]);
    closeTemplate();
  };

  const toggleTemplate = (name: string) => {
    setTemplateSelected((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const fillPercent = (eq: Equipment) =>
    eq.totalStock > 0 ? Math.round((eq.currentStock / eq.totalStock) * 100) : 0;

  const getStockColor = (eq: Equipment) => {
    if (eq.currentStock === 0) return 'red';
    if (eq.currentStock < 5) return 'orange';
    return undefined;
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Ekipman & Stok Takibi</Title>
            <MantineText c="dimmed" size="sm">
              KKD stok seviyelerini takip edin; düşük stokta uyarı gösterilir.
            </MantineText>
          </div>
          <Group>
            <Button variant="default" leftSection={<IconPlus size={16} />} onClick={openTemplate}>
              Şablondan Hızlı Ekle
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={handleOpenAdd}>
              Yeni Ekipman Ekle
            </Button>
          </Group>
        </Group>

        <Paper withBorder p="md">
          {!selectedCompanyId && (
            <MantineText size="sm" c="dimmed" mb="md">
              Firma seçerek ilgili ekipman listesini görüntüleyebilirsiniz.
            </MantineText>
          )}
          <Table.ScrollContainer minWidth={700}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Ekipman Adı</Table.Th>
                  <Table.Th>Standart</Table.Th>
                  <Table.Th>Toplam Stok</Table.Th>
                  <Table.Th>Kalan Stok</Table.Th>
                  <Table.Th>Doluluk Oranı</Table.Th>
                  <Table.Th>İşlemler</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredItems.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <MantineText size="sm" c="dimmed" ta="center" py="md">
                        Henüz ekipman eklenmemiş. &quot;Yeni Ekipman Ekle&quot; veya &quot;Şablondan Hızlı Ekle&quot; ile başlayın.
                      </MantineText>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredItems.map((eq) => (
                    <Table.Tr key={eq.id}>
                      <Table.Td>
                        <MantineText fw={600}>{eq.name}</MantineText>
                      </Table.Td>
                      <Table.Td>
                        <MantineText size="sm" c="dimmed">
                          {eq.standard || '—'}
                        </MantineText>
                      </Table.Td>
                      <Table.Td>{eq.totalStock}</Table.Td>
                      <Table.Td>
                        {eq.currentStock === 0 ? (
                          <Badge color="red" size="sm">
                            Tükendi
                          </Badge>
                        ) : eq.currentStock < 5 ? (
                          <MantineText size="sm" fw={500} c="red">
                            {eq.currentStock}
                          </MantineText>
                        ) : (
                          eq.currentStock
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Progress
                          value={fillPercent(eq)}
                          color={getStockColor(eq) ?? 'green'}
                          size="sm"
                          radius="xl"
                        />
                        <MantineText size="xs" c="dimmed" mt={2}>
                          %{fillPercent(eq)}
                        </MantineText>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          <ActionIcon
                            variant="light"
                            size="sm"
                            onClick={() => handleOpenEdit(eq)}
                            aria-label="Stok düzenle"
                          >
                            <IconEdit size={16} />
                          </ActionIcon>
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            onClick={() => deleteEquipment(eq.id)}
                            aria-label="Sil"
                          >
                            <IconTrash size={16} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Stack>

      {/* Template modal */}
      <Modal opened={templateOpened} onClose={closeTemplate} title="Şablondan Hızlı Ekle" size="md">
        <Stack gap="md">
          <MantineText size="sm" c="dimmed">
            Eklemek istediğiniz ekipmanları seçin. Hepsi aynı varsayılan stok adedi ile eklenecektir.
          </MantineText>
          <NumberInput
            label="Varsayılan Stok Adedi"
            min={0}
            value={defaultStock}
            onChange={(v) => setDefaultStock(typeof v === 'number' ? v : 0)}
          />
          <Stack gap="xs">
            {PPE_TEMPLATES.map((name) => (
              <Checkbox
                key={name}
                label={name}
                checked={templateSelected.includes(name)}
                onChange={() => toggleTemplate(name)}
              />
            ))}
          </Stack>
          <Group justify="flex-end">
            <Button variant="default" onClick={closeTemplate}>
              İptal
            </Button>
            <Button
              onClick={handleTemplateAdd}
              disabled={templateSelected.length === 0 || !companyId}
            >
              Seçilenleri Ekle ({templateSelected.length})
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Add/Edit modal */}
      <Modal
        opened={formOpened}
        onClose={closeForm}
        title={editingItem ? 'Stok Düzenle' : 'Yeni Ekipman Ekle'}
        size="sm"
      >
        <Stack gap="md">
          <TextInput
            label="Ekipman Adı"
            placeholder="Örn: Baret, Çelik Burunlu Ayakkabı"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))}
          />
          <TextInput
            label="Standart"
            placeholder="Örn: EN 397"
            value={form.standard}
            onChange={(e) => setForm((f) => ({ ...f, standard: e.currentTarget.value }))}
          />
          <NumberInput
            label="Toplam Stok"
            min={0}
            value={form.totalStock}
            onChange={(v) => setForm((f) => ({ ...f, totalStock: typeof v === 'number' ? v : 0 }))}
            description={editingItem ? undefined : 'İlk eklemede kalan stok = toplam stok olarak ayarlanır.'}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeForm}>
              İptal
            </Button>
            <Button onClick={handleSaveForm} disabled={!form.name.trim()}>
              {editingItem ? 'Güncelle' : 'Ekle'}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
