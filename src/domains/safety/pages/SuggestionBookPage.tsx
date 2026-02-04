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
  NumberInput,
  Textarea,
  Select,
  Badge,
  ActionIcon,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconCheck, IconPrinter } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useBoardStore,
  type BookEntry,
  type BookEntryCategory,
} from '@store/boardStore';

const CATEGORY_OPTIONS: { value: BookEntryCategory; label: string }[] = [
  { value: 'Technical', label: 'Teknik' },
  { value: 'Health', label: 'Sağlık' },
  { value: 'Administrative', label: 'İdari' },
];

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const today = (): string => new Date().toISOString().slice(0, 10);

export function SuggestionBookPage() {
  const bookEntries = useBoardStore((s) => s.bookEntries);
  const addBookEntry = useBoardStore((s) => s.addBookEntry);
  const closeBookEntry = useBoardStore((s) => s.closeBookEntry);
  const getNextPageNumber = useBoardStore((s) => s.getNextPageNumber);

  const [addOpened, { open: openAdd, close: closeAdd }] = useDisclosure(false);
  const [formPage, setFormPage] = useState(1);
  const [formDate, setFormDate] = useState<Date | null>(new Date());
  const [formDetection, setFormDetection] = useState('');
  const [formSuggestion, setFormSuggestion] = useState('');
  const [formCategory, setFormCategory] = useState<BookEntryCategory>('Technical');

  const sortedEntries = useMemo(() => [...bookEntries].sort((a, b) => a.pageNumber - b.pageNumber), [bookEntries]);

  const openAddModal = () => {
    setFormPage(getNextPageNumber());
    setFormDate(new Date());
    setFormDetection('');
    setFormSuggestion('');
    setFormCategory('Technical');
    openAdd();
  };

  const handleAddEntry = () => {
    if (!formDetection.trim()) {
      notifications.show({ title: 'Hata', message: 'Tespit alanı zorunludur.', color: 'red' });
      return;
    }
    const dateStr = formDate ? (formDate instanceof Date ? formDate.toISOString().slice(0, 10) : String(formDate).slice(0, 10)) : today();
    addBookEntry({
      pageNumber: formPage,
      date: dateStr,
      detection: formDetection.trim(),
      suggestion: formSuggestion.trim(),
      category: formCategory,
      status: 'Open',
      closingDate: null,
    });
    notifications.show({ title: 'Deftere yazıldı', message: 'Kayıt eklendi.', color: 'green' });
    closeAdd();
  };

  const handleCloseEntry = (entry: BookEntry) => {
    if (entry.status === 'Closed') return;
    closeBookEntry(entry.id, today());
    notifications.show({ title: 'Giderildi', message: 'Kayıt giderildi olarak işaretlendi.', color: 'green' });
  };

  const handlePrint = () => {
    window.print();
    notifications.show({ title: 'Yazdırma', message: 'Sayfa yazdırma başlatıldı (fiziksel ciltleme için PDF dışa aktarımı uygulamanızda eklenebilir).', color: 'blue' });
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Tespit ve Öneri Defteri (Onaylı Defter)</Title>
            <MantineText c="dimmed" size="sm">
              Noter onaylı defterin dijital karşılığı.
            </MantineText>
          </div>
          <Group>
            <Button variant="default" leftSection={<IconPrinter size={16} />} onClick={handlePrint}>
              Sayfayı Yazdır
            </Button>
            <Button leftSection={<IconPlus size={16} />} onClick={openAddModal}>
              Deftere Yaz
            </Button>
          </Group>
        </Group>

        <Paper withBorder className="suggestion-book-table" style={{ fontFamily: 'serif' }}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 90 }}>Sayfa / Sıra No</Table.Th>
                <Table.Th style={{ width: 100 }}>Tarih</Table.Th>
                <Table.Th>Tespit</Table.Th>
                <Table.Th>Öneri</Table.Th>
                <Table.Th style={{ width: 100 }}>Durum</Table.Th>
                <Table.Th style={{ width: 100 }}>İşlem</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {sortedEntries.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <MantineText size="sm" c="dimmed" ta="center" py="md">
                      Henüz kayıt yok.
                    </MantineText>
                  </Table.Td>
                </Table.Tr>
              ) : (
                sortedEntries.map((entry) => (
                  <Table.Tr key={entry.id}>
                    <Table.Td>
                      <Badge variant="outline" size="sm">{entry.pageNumber}</Badge>
                    </Table.Td>
                    <Table.Td>{formatDate(entry.date)}</Table.Td>
                    <Table.Td>
                      <MantineText size="sm" c={entry.status === 'Open' ? 'red' : undefined} fw={entry.status === 'Open' ? 500 : undefined}>
                        {entry.detection}
                      </MantineText>
                    </Table.Td>
                    <Table.Td>
                      <MantineText size="sm" fs="italic" c="dimmed">
                        {entry.suggestion || '—'}
                      </MantineText>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={entry.status === 'Open' ? 'red' : 'green'} size="sm">
                        {entry.status === 'Open' ? 'Açık' : 'Giderildi'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {entry.status === 'Open' ? (
                        <ActionIcon color="green" variant="light" title="Giderildi olarak işaretle" onClick={() => handleCloseEntry(entry)}>
                          <IconCheck size={18} />
                        </ActionIcon>
                      ) : (
                        <MantineText size="xs" c="dimmed">{formatDate(entry.closingDate)}</MantineText>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </Paper>
      </Stack>

      <Modal opened={addOpened} onClose={closeAdd} title="Deftere Yaz (Tespit ve Öneri)" size="md">
        <Stack gap="sm">
          <NumberInput label="Sayfa / Sıra No" min={1} value={formPage} onChange={(v) => setFormPage(Math.max(1, Number(v) || 1))} />
          <DatePickerInput
            label="Tarih"
            value={formDate}
            onChange={setFormDate}
            valueFormat="DD.MM.YYYY"
          />
          <Textarea
            label="Tespit (Tespit edilen eksiklik)"
            placeholder="Tespit edilen eksiklik..."
            value={formDetection}
            onChange={(e) => setFormDetection(e.target.value)}
            required
            minRows={2}
          />
          <Textarea
            label="Öneri"
            placeholder="Öneri..."
            value={formSuggestion}
            onChange={(e) => setFormSuggestion(e.target.value)}
            minRows={2}
          />
          <Select
            label="Kategori"
            data={CATEGORY_OPTIONS}
            value={formCategory}
            onChange={(v) => v && setFormCategory(v as BookEntryCategory)}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeAdd}>İptal</Button>
            <Button onClick={handleAddEntry}>Kaydet</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
