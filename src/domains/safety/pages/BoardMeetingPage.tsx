import { useState, useCallback, useRef } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  Modal,
  Textarea,
  Card,
  Tabs,
  ActionIcon,
  TextInput,
  FileButton,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconDownload, IconPlayerPlay, IconTrash } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useBoardStore,
  type Meeting,
  type MeetingDecision,
} from '@store/boardStore';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso + 'T12:00:00');
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function generateDecisionId(): string {
  return `dec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function BoardMeetingPage() {
  const meetings = useBoardStore((s) => s.meetings);
  const completeMeeting = useBoardStore((s) => s.completeMeeting);

  const [completeModalOpened, { open: openCompleteModal, close: closeCompleteModal }] = useDisclosure(false);
  const [completingMeeting, setCompletingMeeting] = useState<Meeting | null>(null);
  const [generalNotes, setGeneralNotes] = useState('');
  const [decisions, setDecisions] = useState<MeetingDecision[]>([]);
  const [minutesFileName, setMinutesFileName] = useState('');
  const fileResetRef = useRef<(() => void) | null>(null);

  const plannedMeetings = meetings.filter((m) => m.status === 'Planned');
  const completedMeetings = meetings.filter((m) => m.status === 'Completed').sort((a, b) => (b.date > a.date ? 1 : -1));

  const openComplete = (meeting: Meeting) => {
    setCompletingMeeting(meeting);
    setGeneralNotes('');
    setDecisions(meeting.decisions.length > 0 ? meeting.decisions.map((d) => ({ ...d })) : [{ id: generateDecisionId(), text: '', responsible: '', deadline: new Date().toISOString().slice(0, 10) }]);
    setMinutesFileName('');
    openCompleteModal();
  };

  const addDecision = useCallback(() => {
    setDecisions((prev) => [
      ...prev,
      { id: generateDecisionId(), text: '', responsible: '', deadline: new Date().toISOString().slice(0, 10) },
    ]);
  }, []);

  const updateDecision = useCallback((id: string, field: keyof MeetingDecision, value: string) => {
    setDecisions((prev) => prev.map((d) => (d.id === id ? { ...d, [field]: value } : d)));
  }, []);

  const removeDecision = useCallback((id: string) => {
    setDecisions((prev) => prev.filter((d) => d.id !== id).length === 0 ? [{ id: generateDecisionId(), text: '', responsible: '', deadline: new Date().toISOString().slice(0, 10) }] : prev.filter((d) => d.id !== id));
  }, []);

  const handleSaveAndClose = () => {
    if (!completingMeeting) return;
    const validDecisions = decisions.filter((d) => d.text.trim());
    completeMeeting(completingMeeting.id, {
      decisions: validDecisions,
      minutesFile: minutesFileName || null,
      generalNotes: generalNotes.trim() || undefined,
    });
    notifications.show({ title: 'Toplantı sonuçlandı', message: 'Tutanak kaydedildi.', color: 'green' });
    closeCompleteModal();
    setCompletingMeeting(null);
  };

  return (
    <>
      <Stack gap="md">
        <div>
          <Title order={2}>İSG Kurul Toplantıları</Title>
          <MantineText c="dimmed" size="sm">
            Toplantı planlama ve tutanak yönetimi.
          </MantineText>
        </div>

        <Tabs defaultValue="planned">
          <Tabs.List>
            <Tabs.Tab value="planned">Gelecek Toplantılar</Tabs.Tab>
            <Tabs.Tab value="completed">Geçmiş Tutanaklar</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="planned" pt="md">
            {plannedMeetings.length === 0 ? (
              <MantineText c="dimmed" size="sm" py="md">
                Planlanmış toplantı yok.
              </MantineText>
            ) : (
              <Stack gap="sm" mt="md">
                {plannedMeetings.map((m) => (
                  <Card key={m.id} withBorder padding="md" radius="md" shadow="sm">
                    <Group justify="space-between">
                      <div>
                        <MantineText fw={600}>{formatDate(m.date)}</MantineText>
                        <MantineText size="sm" c="dimmed" mt="xs" lineClamp={2}>
                          {m.agenda}
                        </MantineText>
                      </div>
                      <Button leftSection={<IconPlayerPlay size={16} />} variant="light" onClick={() => openComplete(m)}>
                        Toplantıyı Başlat / Sonuçlandır
                      </Button>
                    </Group>
                  </Card>
                ))}
              </Stack>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="completed" pt="md">
            <Paper withBorder mt="md">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Tarih</Table.Th>
                    <Table.Th>Karar Sayısı</Table.Th>
                    <Table.Th>İşlem</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {completedMeetings.length === 0 ? (
                    <Table.Tr>
                      <Table.Td colSpan={3}>
                        <MantineText size="sm" c="dimmed" ta="center" py="md">
                          Henüz tutanak yok.
                        </MantineText>
                      </Table.Td>
                    </Table.Tr>
                  ) : (
                    completedMeetings.map((m) => (
                      <Table.Tr key={m.id}>
                        <Table.Td>{formatDate(m.date)}</Table.Td>
                        <Table.Td>{m.decisions.length} karar</Table.Td>
                        <Table.Td>
                          {m.minutesFile ? (
                            <Button size="xs" variant="subtle" leftSection={<IconDownload size={14} />}>
                              Tutanak İndir
                            </Button>
                          ) : (
                            <MantineText size="xs" c="dimmed">Dosya yok</MantineText>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    ))
                  )}
                </Table.Tbody>
              </Table>
            </Paper>
          </Tabs.Panel>
        </Tabs>
      </Stack>

      <Modal
        opened={completeModalOpened}
        onClose={() => { closeCompleteModal(); setCompletingMeeting(null); }}
        title={completingMeeting ? `Toplantı Sonuçlandır — ${formatDate(completingMeeting.date)}` : 'Toplantı Sonuçlandır'}
        size="lg"
      >
        {completingMeeting && (
          <Stack gap="md">
            <Textarea
              label="Genel Notlar"
              placeholder="Toplantı özeti, notlar..."
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              minRows={2}
            />
            <div>
              <Group justify="space-between" mb="xs">
                <MantineText size="sm" fw={600}>Alınan Kararlar</MantineText>
                <Button size="xs" variant="light" leftSection={<IconPlus size={14} />} onClick={addDecision}>
                  + Karar Ekle
                </Button>
              </Group>
              <Stack gap="xs">
                {decisions.map((d) => (
                  <Group key={d.id} align="flex-start" wrap="nowrap" gap="xs">
                    <TextInput
                      placeholder="Karar metni"
                      value={d.text}
                      onChange={(e) => updateDecision(d.id, 'text', e.target.value)}
                      style={{ flex: 2 }}
                    />
                    <TextInput
                      placeholder="Sorumlu"
                      value={d.responsible}
                      onChange={(e) => updateDecision(d.id, 'responsible', e.target.value)}
                      style={{ flex: 1 }}
                    />
                    <DatePickerInput
                      placeholder="Termin"
                      value={d.deadline ? new Date(d.deadline + 'T12:00:00') : null}
                      onChange={(date) => updateDecision(d.id, 'deadline', date ? date.toISOString().slice(0, 10) : '')}
                      valueFormat="DD.MM.YYYY"
                      style={{ minWidth: 140 }}
                    />
                    <ActionIcon color="red" variant="subtle" onClick={() => removeDecision(d.id)}>
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                ))}
              </Stack>
            </div>
            <MantineText size="sm" fw={500}>Tutanak dosyası (PDF)</MantineText>
            <FileButton resetRef={fileResetRef as React.MutableRefObject<(() => void) | null>} accept="application/pdf" onChange={(f) => setMinutesFileName(f?.name ?? '')}>
              {(props) => <Button variant="light" {...props}>Dosya Seç</Button>}
            </FileButton>
            {minutesFileName && <MantineText size="xs" c="dimmed">Seçilen: {minutesFileName}</MantineText>}
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => { closeCompleteModal(); setCompletingMeeting(null); }}>
                İptal
              </Button>
              <Button onClick={handleSaveAndClose}>Toplantıyı Kaydet ve Kapat</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
