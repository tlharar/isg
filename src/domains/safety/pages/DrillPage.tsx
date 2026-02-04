import { useState, useMemo, useRef } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Card,
  SimpleGrid,
  Tabs,
  Modal,
  Select,
  Textarea,
  NumberInput,
  Rating,
  FileButton,
  Badge,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconFlame,
  IconActivity,
  IconRun,
  IconDroplet,
  IconDownload,
  IconCheck,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useDrillStore,
  type Drill,
  type DrillType,
} from '@store/drillStore';

const DRILL_TYPE_OPTIONS: { value: DrillType; label: string }[] = [
  { value: 'Fire', label: 'Yangın' },
  { value: 'Earthquake', label: 'Deprem' },
  { value: 'Evacuation', label: 'Tahliye' },
  { value: 'Leak', label: 'Sızıntı' },
];

const DRILL_TYPE_ICONS: Record<DrillType, typeof IconFlame> = {
  Fire: IconFlame,
  Earthquake: IconActivity,
  Evacuation: IconRun,
  Leak: IconDroplet,
};

const DRILL_TYPE_LABELS: Record<DrillType, string> = {
  Fire: 'Yangın',
  Earthquake: 'Deprem',
  Evacuation: 'Tahliye',
  Leak: 'Sızıntı',
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getSuccessBadgeColor(rating: number): string {
  if (rating >= 4) return 'green';
  if (rating >= 3) return 'orange';
  return 'red';
}

function getSuccessBadgeLabel(rating: number): string {
  if (rating >= 4) return 'Başarılı';
  if (rating >= 3) return 'Orta';
  return 'İyileştirme gerekli';
}

export function DrillPage() {
  // All hooks at top (unconditional)
  const drills = useDrillStore((s) => s.drills);
  const scheduleDrill = useDrillStore((s) => s.scheduleDrill);
  const completeDrill = useDrillStore((s) => s.completeDrill);
  const getDrillById = useDrillStore((s) => s.getDrillById);

  const [planModalOpened, { open: openPlanModal, close: closePlanModal }] = useDisclosure(false);
  const [reportModalOpened, { open: openReportModal, close: closeReportModal }] = useDisclosure(false);
  const [selectedDrillId, setSelectedDrillId] = useState<string | null>(null);

  const [planType, setPlanType] = useState<DrillType>('Fire');
  const [planDate, setPlanDate] = useState<Date | null>(null);
  const [planLocation, setPlanLocation] = useState('');

  const [reportDuration, setReportDuration] = useState<number>(0);
  const [reportParticipants, setReportParticipants] = useState<number>(0);
  const [reportRating, setReportRating] = useState<number>(0);
  const [reportNotes, setReportNotes] = useState('');
  const [reportPhotos, setReportPhotos] = useState<string[]>([]);
  const fileResetRef = useRef<() => void>(null);

  const upcoming = useMemo(
    () => drills.filter((d) => d.status === 'Planned' && d.plannedDate >= new Date().toISOString().slice(0, 10)),
    [drills]
  );
  const completed = useMemo(
    () => drills.filter((d) => d.status === 'Completed'),
    [drills]
  );

  const reportDrill = useMemo(
    () => (selectedDrillId ? getDrillById(selectedDrillId) ?? null : null),
    [selectedDrillId, getDrillById, drills]
  );

  const handleOpenCompleteModal = (drillId: string) => {
    setSelectedDrillId(drillId);
    setReportDuration(0);
    setReportParticipants(0);
    setReportRating(3);
    setReportNotes('');
    setReportPhotos([]);
    openReportModal();
  };

  const openPlan = () => {
    setPlanType('Fire');
    setPlanDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setPlanLocation('');
    openPlanModal();
  };

  const handleSchedule = () => {
    if (!planDate) {
      notifications.show({ title: 'Tarih seçin', message: 'Planlanan tarih gerekli.', color: 'red' });
      return;
    }
    scheduleDrill({
      type: planType,
      plannedDate: planDate.toISOString().slice(0, 10),
      status: 'Planned',
      targetLocation: planLocation.trim() || undefined,
    });
    notifications.show({ title: 'Tatbikat planlandı', message: 'Kayıt eklendi.', color: 'green' });
    closePlanModal();
  };

  const handleComplete = () => {
    if (!selectedDrillId || !reportDrill) return;
    if (reportDuration < 0 || reportParticipants < 0) {
      notifications.show({ title: 'Geçersiz değer', message: 'Süre ve katılımcı sayısı 0 veya üzeri olmalı.', color: 'red' });
      return;
    }
    const rating = Math.max(1, Math.min(5, reportRating || 1));
    completeDrill(selectedDrillId, {
      completionDate: new Date().toISOString().slice(0, 10),
      durationMinutes: reportDuration,
      participantsCount: reportParticipants,
      successRating: rating,
      notes: reportNotes.trim(),
      photos: reportPhotos,
    });
    notifications.show({ title: 'Tatbikat tamamlandı', message: 'Rapor kaydedildi.', color: 'green' });
    closeReportModal();
    setSelectedDrillId(null);
  };

  const handleDownloadReport = (drill: Drill) => {
    notifications.show({
      title: 'Rapor indiriliyor',
      message: `${DRILL_TYPE_LABELS[drill.type]} tatbikat raporu (Demo).`,
      color: 'blue',
    });
  };

  const handlePhotoUpload = (payload: File[]) => {
    payload.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setReportPhotos((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Tatbikatlar</Title>
            <MantineText c="dimmed" size="sm">
              Zorunlu güvenlik tatbikatlarının planlanması ve raporlanması.
            </MantineText>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openPlan}>
            Yeni Tatbikat Planla
          </Button>
        </Group>

        <Tabs defaultValue="upcoming">
          <Tabs.List>
            <Tabs.Tab value="upcoming">Planlananlar ({upcoming.length})</Tabs.Tab>
            <Tabs.Tab value="completed">Tamamlananlar ({completed.length})</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="upcoming" pt="md">
            {upcoming.length === 0 ? (
              <MantineText size="sm" c="dimmed" py="xl" ta="center">
                Planlanan tatbikat yok.
              </MantineText>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {upcoming.map((drill) => {
                  const Icon = DRILL_TYPE_ICONS[drill.type];
                  return (
                    <Card key={drill.id} withBorder padding="md" radius="md" shadow="sm">
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Icon size={24} />
                          <Badge size="sm" color="blue" variant="light">Planlandı</Badge>
                        </Group>
                        <MantineText fw={600}>{DRILL_TYPE_LABELS[drill.type]} Tatbikatı</MantineText>
                        <MantineText size="xs" c="dimmed">
                          {formatDate(drill.plannedDate)}
                          {drill.targetLocation ? ` · ${drill.targetLocation}` : ''}
                        </MantineText>
                        <Button
                          variant="light"
                          size="xs"
                          leftSection={<IconCheck size={14} />}
                          onClick={() => handleOpenCompleteModal(drill.id)}
                        >
                          Tatbikatı Tamamla
                        </Button>
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="completed" pt="md">
            {completed.length === 0 ? (
              <MantineText size="sm" c="dimmed" py="xl" ta="center">
                Tamamlanan tatbikat yok.
              </MantineText>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {completed.map((drill) => {
                  const Icon = DRILL_TYPE_ICONS[drill.type];
                  const rating = drill.successRating ?? 0;
                  const badgeColor = getSuccessBadgeColor(rating);
                  return (
                    <Card key={drill.id} withBorder padding="md" radius="md" shadow="sm">
                      <Stack gap="sm">
                        <Group justify="space-between">
                          <Icon size={24} />
                          <Badge size="sm" color={badgeColor} variant="light">
                            {getSuccessBadgeLabel(rating)}
                          </Badge>
                        </Group>
                        <MantineText fw={600}>{DRILL_TYPE_LABELS[drill.type]} Tatbikatı</MantineText>
                        <MantineText size="xs" c="dimmed">
                          {formatDate(drill.completionDate ?? drill.plannedDate)}
                          {drill.targetLocation ? ` · ${drill.targetLocation}` : ''}
                        </MantineText>
                        <Group gap="xs">
                          <MantineText size="xs">{drill.durationMinutes} dk</MantineText>
                          <MantineText size="xs" c="dimmed">·</MantineText>
                          <MantineText size="xs">{drill.participantsCount} katılımcı</MantineText>
                        </Group>
                        <Rating value={rating} count={5} size="xs" readOnly />
                        <Button
                          variant="light"
                          size="xs"
                          leftSection={<IconDownload size={14} />}
                          onClick={() => handleDownloadReport(drill)}
                        >
                          Raporu İndir
                        </Button>
                      </Stack>
                    </Card>
                  );
                })}
              </SimpleGrid>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Planning Modal */}
      <Modal opened={planModalOpened} onClose={closePlanModal} title="Yeni tatbikat planla" size="sm">
        <Stack gap="md">
          <Select
            label="Tür"
            data={DRILL_TYPE_OPTIONS}
            value={planType}
            onChange={(v) => setPlanType((v as DrillType) ?? 'Fire')}
          />
          <DatePickerInput
            label="Planlanan tarih"
            valueFormat="DD.MM.YYYY"
            value={planDate}
            onChange={setPlanDate}
          />
          <Select
            label="Hedef konum"
            placeholder="Seçin veya boş bırakın"
            data={[
              { value: 'Merkez Bina', label: 'Merkez Bina' },
              { value: 'Tüm binalar', label: 'Tüm binalar' },
              { value: 'Üretim hangarı', label: 'Üretim hangarı' },
              { value: 'Ofis katı', label: 'Ofis katı' },
            ]}
            value={planLocation || null}
            onChange={(v) => setPlanLocation(v ?? '')}
            clearable
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closePlanModal}>İptal</Button>
            <Button onClick={handleSchedule}>Planla</Button>
          </Group>
        </Stack>
      </Modal>

      {/* Reporting Modal */}
      <Modal
        opened={reportModalOpened}
        onClose={() => { closeReportModal(); setSelectedDrillId(null); }}
        title={reportDrill ? `${DRILL_TYPE_LABELS[reportDrill.type]} Tatbikatı - Rapor` : 'Tatbikat raporu'}
        size="md"
      >
        {reportDrill && (
          <Stack gap="md">
            <MantineText size="sm" c="dimmed">
              {formatDate(reportDrill.plannedDate)}
              {reportDrill.targetLocation ? ` · ${reportDrill.targetLocation}` : ''}
            </MantineText>
            <NumberInput
              label="Tahliye süresi (dk)"
              value={reportDuration}
              onChange={(v) => setReportDuration(typeof v === 'string' ? parseInt(v, 10) || 0 : v ?? 0)}
              min={0}
            />
            <NumberInput
              label="Katılımcı sayısı"
              value={reportParticipants}
              onChange={(v) => setReportParticipants(typeof v === 'string' ? parseInt(v, 10) || 0 : v ?? 0)}
              min={0}
            />
            <div>
              <MantineText size="sm" fw={500} mb={4}>Genel başarı puanı (1-5)</MantineText>
              <Rating value={reportRating} onChange={setReportRating} count={5} />
            </div>
            <Textarea
              label="Gözlemler / Eksiklikler"
              placeholder="Örn: Kapı sıkıştı, kuzey çıkış kullanıldı..."
              value={reportNotes}
              onChange={(e) => setReportNotes(e.currentTarget.value)}
              minRows={3}
            />
            <FileButton resetRef={fileResetRef} onChange={handlePhotoUpload} accept="image/*" multiple>
              {(props) => (
                <Button {...props} variant="light" size="sm">
                  Kanıt fotoğrafları yükle
                  {reportPhotos.length > 0 ? ` (${reportPhotos.length})` : ''}
                </Button>
              )}
            </FileButton>
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => { closeReportModal(); setSelectedDrillId(null); }}>İptal</Button>
              <Button leftSection={<IconCheck size={14} />} onClick={handleComplete}>Kaydet</Button>
            </Group>
          </Stack>
        )}
      </Modal>
    </>
  );
}
