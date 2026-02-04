import { useState, useRef } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Card,
  SegmentedControl,
  Textarea,
  FileButton,
  RingProgress,
  Box,
} from '@mantine/core';
import { useNavigate, useParams } from 'react-router-dom';
import { IconCamera, IconCheck } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useInspectionStore,
  type InspectionItem,
  type InspectionItemStatus,
} from '@store/inspectionStore';

const STATUS_OPTIONS: { value: InspectionItemStatus; label: string }[] = [
  { value: 'Compliant', label: 'Uygun' },
  { value: 'NonCompliant', label: 'Uygunsuz' },
  { value: 'NA', label: 'N/A' },
];

function getScoreColor(score: number): string {
  if (score >= 80) return 'green';
  if (score >= 50) return 'yellow';
  return 'red';
}

export function InspectionConductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const inspection = useInspectionStore((s) => s.getInspectionById(id ?? ''));
  const updateItemStatus = useInspectionStore((s) => s.updateItemStatus);
  const completeInspection = useInspectionStore((s) => s.completeInspection);

  const fileResetRefs = useRef<Record<string, () => void>>({});

  if (!id || !inspection) {
    return (
      <Box p="md">
        <MantineText c="dimmed">Denetim bulunamadı.</MantineText>
        <Button variant="light" mt="md" onClick={() => navigate('/safety/audit/inspections')}>
          Listeye dön
        </Button>
      </Box>
    );
  }

  if (inspection.completed) {
    return (
      <Box p="md">
        <MantineText c="dimmed">Bu denetim zaten tamamlandı.</MantineText>
        <Button variant="light" mt="md" onClick={() => navigate('/safety/audit/inspections')}>
          Listeye dön
        </Button>
      </Box>
    );
  }

  const score = inspection.score;
  const scoreColor = getScoreColor(score);
  const pendingCount = inspection.items.filter((i) => i.status === 'Pending').length;
  const canComplete = pendingCount === 0;

  const handleStatusChange = (itemId: string, status: InspectionItemStatus) => {
    updateItemStatus(id, itemId, status);
  };

  const handleNoteChange = (itemId: string, note: string) => {
    const item = inspection.items.find((i) => i.id === itemId);
    if (item?.status === 'NonCompliant') {
      updateItemStatus(id, itemId, 'NonCompliant', note || undefined);
    }
  };

  const handlePhotoUpload = (itemId: string, file: File | null) => {
    if (!file) return;
    const item = inspection.items.find((i) => i.id === itemId);
    updateItemStatus(id, itemId, item?.status ?? 'NonCompliant', item?.note, file.name);
  };

  const handleComplete = () => {
    if (!canComplete) {
      notifications.show({
        title: 'Eksik yanıtlar',
        message: `Tüm maddeleri yanıtlayın. ${pendingCount} adet bekliyor.`,
        color: 'red',
      });
      return;
    }
    completeInspection(id);
    notifications.show({
      title: 'Denetim tamamlandı',
      message: `Skor: ${inspection.score} - Listeye yönlendiriliyorsunuz.`,
      color: 'green',
    });
    navigate('/safety/audit/inspections');
  };

  return (
    <Stack gap="lg">
      <Group justify="space-between" wrap="nowrap">
        <div>
          <Title order={2}>Saha Denetimi</Title>
          <MantineText c="dimmed" size="sm">
            {inspection.templateName} · {inspection.auditor} · {inspection.date}
          </MantineText>
        </div>
        <RingProgress
          size={120}
          thickness={12}
          roundCaps
          sections={[{ value: score, color: scoreColor }]}
          label={
            <Box ta="center">
              <MantineText fw={700} size="xl">{score}</MantineText>
              <MantineText size="xs" c="dimmed">Skor</MantineText>
            </Box>
          }
        />
      </Group>

      <Stack gap="md">
        {inspection.items.map((item) => (
          <QuestionCard
            key={item.id}
            item={item}
            inspectionId={id}
            onStatusChange={handleStatusChange}
            onNoteChange={handleNoteChange}
            onPhotoUpload={handlePhotoUpload}
            fileResetRef={(fn) => { fileResetRefs.current[item.id] = fn; }}
          />
        ))}
      </Stack>

      <Group justify="space-between" mt="md">
        <MantineText size="sm" c={canComplete ? 'green' : 'orange'}>
          {canComplete ? 'Tüm maddeler yanıtlandı. Denetimi tamamlayabilirsiniz.' : `${pendingCount} madde bekliyor.`}
        </MantineText>
        <Button
          leftSection={<IconCheck size={16} />}
          onClick={handleComplete}
          disabled={!canComplete}
        >
          Denetimi Tamamla
        </Button>
      </Group>
    </Stack>
  );
}

interface QuestionCardProps {
  item: InspectionItem;
  inspectionId: string;
  onStatusChange: (itemId: string, status: InspectionItemStatus) => void;
  onNoteChange: (itemId: string, note: string) => void;
  onPhotoUpload: (itemId: string, file: File | null) => void;
  fileResetRef: (fn: () => void) => void;
}

function QuestionCard({
  item,
  onStatusChange,
  onNoteChange,
  onPhotoUpload,
  fileResetRef,
}: QuestionCardProps) {
  const isNonCompliant = item.status === 'NonCompliant';

  return (
    <Card withBorder padding="md" radius="md" shadow="sm">
      <Stack gap="md">
        <MantineText fw={500}>{item.question}</MantineText>
        <SegmentedControl
          value={item.status}
          onChange={(v) => onStatusChange(item.id, v as InspectionItemStatus)}
          data={STATUS_OPTIONS}
          color={item.status === 'Compliant' ? 'green' : item.status === 'NonCompliant' ? 'red' : 'gray'}
        />
        {isNonCompliant && (
          <Stack gap="xs">
            <Textarea
              label="Açıklama (uygunsuzluk detayı)"
              placeholder="Yapılan işlem veya tespit..."
              value={item.note ?? ''}
              onChange={(e) => onNoteChange(item.id, e.currentTarget.value)}
              minRows={2}
            />
            <FileButton
              resetRef={fileResetRef}
              onChange={(file) => onPhotoUpload(item.id, file)}
              accept="image/png,image/jpeg,image/webp"
            >
              {(props) => (
                <Button {...props} variant="light" size="sm" leftSection={<IconCamera size={14} />}>
                  {item.photoUrl ? `Fotoğraf: ${item.photoUrl}` : 'Kanıt fotoğrafı yükle'}
                </Button>
              )}
            </FileButton>
          </Stack>
        )}
      </Stack>
    </Card>
  );
}
