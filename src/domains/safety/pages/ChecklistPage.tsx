import { useState, useCallback } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Card,
  SimpleGrid,
  Modal,
  TextInput,
  Select,
  ActionIcon,
  Box,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useChecklistStore,
  CHECKLIST_CATEGORIES,
  generateItemId,
  type ChecklistTemplate,
  type ChecklistItem,
} from '@store/checklistStore';

const CATEGORY_OPTIONS = CHECKLIST_CATEGORIES.map((c) => ({ value: c, label: c }));

export function ChecklistPage() {
  const templates = useChecklistStore((s) => s.templates);
  const addTemplate = useChecklistStore((s) => s.addTemplate);
  const updateTemplate = useChecklistStore((s) => s.updateTemplate);
  const deleteTemplate = useChecklistStore((s) => s.deleteTemplate);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<string>(CHECKLIST_CATEGORIES[0]);
  const [formItems, setFormItems] = useState<ChecklistItem[]>([]);

  const isEditing = editingId !== null;

  const openCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormCategory(CHECKLIST_CATEGORIES[0]);
    setFormItems([{ id: generateItemId(), text: '' }]);
    openModal();
  };

  const openEdit = (template: ChecklistTemplate) => {
    setEditingId(template.id);
    setFormTitle(template.title);
    setFormCategory(template.category);
    setFormItems(
      template.items.length > 0
        ? template.items.map((i) => ({ ...i }))
        : [{ id: generateItemId(), text: '' }]
    );
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
    setEditingId(null);
  };

  const addQuestion = useCallback(() => {
    setFormItems((prev) => [...prev, { id: generateItemId(), text: '' }]);
  }, []);

  const removeQuestion = useCallback((itemId: string) => {
    setFormItems((prev) => {
      const next = prev.filter((i) => i.id !== itemId);
      return next.length === 0 ? [{ id: generateItemId(), text: '' }] : next;
    });
  }, []);

  const updateQuestionText = useCallback((itemId: string, text: string) => {
    setFormItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, text } : i))
    );
  }, []);

  const handleSave = () => {
    const title = formTitle.trim();
    if (!title) {
      notifications.show({
        title: 'Eksik alan',
        message: 'Liste adı girin.',
        color: 'red',
      });
      return;
    }
    const items = formItems.filter((i) => i.text.trim() !== '');
    if (items.length === 0) {
      notifications.show({
        title: 'En az bir soru',
        message: 'En az bir soru metni girin.',
        color: 'red',
      });
      return;
    }

    if (editingId) {
      updateTemplate(editingId, {
        title,
        category: formCategory,
        items,
      });
      notifications.show({
        title: 'Liste güncellendi',
        message: 'Kontrol listesi kaydedildi.',
        color: 'green',
      });
    } else {
      addTemplate({
        title,
        category: formCategory,
        items,
      });
      notifications.show({
        title: 'Liste oluşturuldu',
        message: 'Yeni kontrol listesi eklendi.',
        color: 'green',
      });
    }
    handleCloseModal();
  };

  const handleDelete = (template: ChecklistTemplate) => {
    if (!window.confirm(`"${template.title}" listesini silmek istediğinize emin misiniz?`)) return;
    deleteTemplate(template.id);
    notifications.show({
      title: 'Liste silindi',
      message: 'Kontrol listesi kaldırıldı.',
      color: 'gray',
    });
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Kontrol Listeleri</Title>
            <MantineText c="dimmed" size="sm">
              Denetim şablonları (soru setleri) oluşturun ve düzenleyin.
            </MantineText>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Yeni Liste Oluştur
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {templates.map((t) => (
            <Card key={t.id} withBorder padding="md" radius="md" shadow="sm">
              <Stack gap="xs">
                <MantineText fw={600} lineClamp={2}>
                  {t.title}
                </MantineText>
                <Group gap="xs">
                  <Badge size="sm" variant="light">
                    {t.category}
                  </Badge>
                  <MantineText size="xs" c="dimmed">
                    {t.items.length} Soru
                  </MantineText>
                </Group>
                <Group gap="xs" mt="sm">
                  <ActionIcon
                    variant="light"
                    size="sm"
                    onClick={() => openEdit(t)}
                    aria-label="Düzenle"
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                  <ActionIcon
                    variant="light"
                    color="red"
                    size="sm"
                    onClick={() => handleDelete(t)}
                    aria-label="Sil"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        {templates.length === 0 && (
          <MantineText size="sm" c="dimmed" py="xl" ta="center">
            Henüz kontrol listesi yok. Yeni liste oluşturun.
          </MantineText>
        )}
      </Stack>

      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={isEditing ? 'Listeyi düzenle' : 'Yeni kontrol listesi'}
        size="md"
      >
        <Stack gap="md">
          <TextInput
            label="Liste adı (şablon başlığı)"
            placeholder="Örn: Yangın Tüpü Kontrolü"
            value={formTitle}
            onChange={(e) => setFormTitle(e.currentTarget.value)}
            required
          />
          <Select
            label="Kategori"
            data={CATEGORY_OPTIONS}
            value={formCategory}
            onChange={(v) => setFormCategory(v ?? formCategory)}
          />

          <Box>
            <MantineText size="sm" fw={500} mb="xs" required>
              Sorular
            </MantineText>
            <Stack gap="xs">
              {formItems.map((item) => (
                <Group key={item.id} gap="xs" align="flex-start" wrap="nowrap">
                  <TextInput
                    placeholder="Soru metni..."
                    value={item.text}
                    onChange={(e) => updateQuestionText(item.id, e.currentTarget.value)}
                    style={{ flex: 1 }}
                  />
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="lg"
                    onClick={() => removeQuestion(item.id)}
                    aria-label="Soru sil"
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
            <Button
              variant="light"
              size="xs"
              leftSection={<IconPlus size={14} />}
              onClick={addQuestion}
              mt="sm"
            >
              Soru Ekle
            </Button>
          </Box>

          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleCloseModal}>
              İptal
            </Button>
            <Button onClick={handleSave}>Kaydet</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
