import { useState } from 'react';
import {
  Modal,
  Stack,
  Badge,
  Select,
  Textarea,
  Button,
  Text,
  Timeline,
  Divider,
  Group,
} from '@mantine/core';
import { useAuthStore } from '@shared/stores/authStore';
import {
  useCrmStore,
  type CRMLead,
  type CRMStatus,
  type CRMNote,
} from '../stores/crmStore';

const STATUS_OPTIONS: { value: CRMStatus; label: string }[] = [
  { value: 'NEW', label: 'Yeni' },
  { value: 'CONTACTED', label: 'Görüşüldü / Ulaşıldı' },
  { value: 'DEMO_DEFINED', label: 'Demo Tanımlandı' },
  { value: 'OFFER_SENT', label: 'Teklif Gönderildi' },
  { value: 'WON', label: 'Satış / Aktif Müşteri' },
  { value: 'LOST', label: 'Reddedildi / Olumsuz' },
];

function getStatusBadgeColor(status: CRMStatus): string {
  switch (status) {
    case 'WON':
      return 'green';
    case 'LOST':
      return 'red';
    case 'DEMO_DEFINED':
    case 'OFFER_SENT':
      return 'blue';
    case 'CONTACTED':
      return 'cyan';
    case 'NEW':
    default:
      return 'gray';
  }
}

function formatNoteDate(d: Date | string): string {
  const date = typeof d === 'string' ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface LeadDetailModalProps {
  opened: boolean;
  onClose: () => void;
  lead: CRMLead | null;
  onStatusChange?: () => void;
}

export function LeadDetailModal({ opened, onClose, lead, onStatusChange }: LeadDetailModalProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const updateLeadStatus = useCrmStore((s) => s.updateLeadStatus);
  const addLeadNote = useCrmStore((s) => s.addLeadNote);
  const getLeadById = useCrmStore((s) => s.getLeadById);

  const [newNoteContent, setNewNoteContent] = useState('');

  const latestLead = lead?.id ? getLeadById(lead.id) : null;
  const displayName = (latestLead ?? lead)?.name ?? '—';
  const currentStatus = (latestLead ?? lead)?.status ?? 'NEW';
  const createdBy = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email
    : 'Sistem';

  const handleStatusChange = (value: string | null) => {
    if (!lead || !value) return;
    updateLeadStatus(lead.id, value as CRMStatus);
    onStatusChange?.();
  };

  const handleAddNote = () => {
    const content = newNoteContent.trim();
    if (!lead || !content) return;
    addLeadNote(lead.id, content, createdBy);
    setNewNoteContent('');
  };

  const notes = (latestLead ?? lead)?.notes ?? [];
  const notesChronological = [...notes].sort((a, b) => {
    const da = typeof a.date === 'string' ? new Date(a.date).getTime() : a.date.getTime();
    const db = typeof b.date === 'string' ? new Date(b.date).getTime() : b.date.getTime();
    return db - da;
  });

  const effectiveStatus = currentStatus;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="sm">
          <Text fw={600} size="lg">
            {displayName}
          </Text>
          <Badge color={getStatusBadgeColor(effectiveStatus)} size="sm">
            {STATUS_OPTIONS.find((o) => o.value === effectiveStatus)?.label ?? effectiveStatus}
          </Badge>
        </Group>
      }
      size="md"
      centered
    >
      {!lead ? (
        <Text size="sm" c="dimmed">
          Lead seçilmedi.
        </Text>
      ) : (
        <Stack gap="md">
          {/* Section 1: Status Management */}
          <div>
            <Text fw={600} size="sm" c="dimmed" mb="xs">
              Durum
            </Text>
            <Select
              data={STATUS_OPTIONS}
              value={effectiveStatus}
              onChange={handleStatusChange}
              allowDeselect={false}
            />
          </div>

          <Divider />

          {/* Section 2: Interaction History (Notes) - newest first */}
          <div>
            <Text fw={600} size="sm" c="dimmed" mb="xs">
              İletişim Geçmişi
            </Text>
            {notesChronological.length === 0 ? (
              <Text size="sm" c="dimmed">
                Henüz not eklenmemiş.
              </Text>
            ) : (
              <Timeline active={-1} bulletSize={24} lineWidth={2}>
                {notesChronological.map((note: CRMNote) => (
                  <Timeline.Item key={note.id} title={formatNoteDate(note.date)}>
                    <Text size="sm" c="dimmed" mb={4}>
                      {note.createdBy}
                    </Text>
                    <Text size="sm">{note.content}</Text>
                  </Timeline.Item>
                ))}
              </Timeline>
            )}
          </div>

          <Divider />

          {/* Section 3: Add Note */}
          <div>
            <Text fw={600} size="sm" c="dimmed" mb="xs">
              Not Ekle
            </Text>
            <Textarea
              placeholder="Not içeriği..."
              minRows={3}
              value={newNoteContent}
              onChange={(e) => setNewNoteContent(e.currentTarget.value)}
            />
            <Button mt="xs" onClick={handleAddNote} disabled={!newNoteContent.trim()}>
              Not Ekle
            </Button>
          </div>
        </Stack>
      )}
    </Modal>
  );
}
