import { useState, useMemo } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  TextInput,
  Select,
  ActionIcon,
  Modal,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconTrash } from '@tabler/icons-react';
import { useDrugStore, type Drug, type DrugType, DRUG_TYPES } from '../stores/drugStore';

export function DrugListPage() {
  const drugs = useDrugStore((s) => s.drugs);
  const searchDrugs = useDrugStore((s) => s.searchDrugs);
  const addDrug = useDrugStore((s) => s.addDrug);
  const deleteDrug = useDrugStore((s) => s.deleteDrug);

  const [search, setSearch] = useState('');
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [form, setForm] = useState({
    barcode: '',
    name: '',
    type: 'Tablet' as DrugType,
    activeIngredient: '',
  });

  const filteredDrugs = useMemo(() => searchDrugs(search), [search, searchDrugs, drugs]);

  const handleAdd = () => {
    if (!form.name.trim()) return;
    addDrug({
      barcode: form.barcode.trim(),
      name: form.name.trim(),
      type: form.type,
      activeIngredient: form.activeIngredient.trim(),
    });
    setForm({ barcode: '', name: '', type: 'Tablet', activeIngredient: '' });
    closeModal();
  };

  const handleDelete = (drug: Drug) => {
    deleteDrug(drug.id);
  };

  const typeOptions = DRUG_TYPES.map((t) => ({ value: t, label: t }));

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>İlaç Listesi</Title>
            <Text c="dimmed" size="sm">
              Reçetede kullanılabilecek ilaçların listesini yönetin.
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
            Yeni İlaç Ekle
          </Button>
        </Group>

        <Paper withBorder p="md">
          <TextInput
            placeholder="İlaç adı veya barkod ile ara..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            mb="md"
          />
          <Table.ScrollContainer minWidth={600}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Barkod</Table.Th>
                  <Table.Th>İlaç Adı</Table.Th>
                  <Table.Th>Tür</Table.Th>
                  <Table.Th>Etken Madde</Table.Th>
                  <Table.Th w={60} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredDrugs.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <Text size="sm" c="dimmed" ta="center" py="md">
                        {search ? 'Arama sonucu bulunamadı.' : 'Henüz ilaç eklenmemiş.'}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredDrugs.map((d) => (
                    <Table.Tr key={d.id}>
                      <Table.Td>{d.barcode || '—'}</Table.Td>
                      <Table.Td>{d.name}</Table.Td>
                      <Table.Td>{d.type}</Table.Td>
                      <Table.Td>{d.activeIngredient || '—'}</Table.Td>
                      <Table.Td>
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          onClick={() => handleDelete(d)}
                          aria-label="Sil"
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
        </Paper>
      </Stack>

      <Modal opened={modalOpened} onClose={closeModal} title="Yeni İlaç Ekle" size="sm">
        <Stack gap="sm">
          <TextInput
            label="Barkod"
            placeholder="Opsiyonel"
            value={form.barcode}
            onChange={(e) => setForm((f) => ({ ...f, barcode: e.currentTarget.value }))}
          />
          <TextInput
            label="İlaç Adı"
            placeholder="Örn: Parol 500 mg"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.currentTarget.value }))}
          />
          <Select
            label="Tür"
            data={typeOptions}
            value={form.type}
            onChange={(v) => setForm((f) => ({ ...f, type: (v as DrugType) ?? 'Tablet' }))}
          />
          <TextInput
            label="Etken Madde"
            placeholder="Örn: Parasetamol"
            value={form.activeIngredient}
            onChange={(e) => setForm((f) => ({ ...f, activeIngredient: e.currentTarget.value }))}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeModal}>
              İptal
            </Button>
            <Button onClick={handleAdd} disabled={!form.name.trim()}>
              Ekle
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
