import { useState } from 'react';
import { Modal, Stack, MultiSelect, Button, Text, Group, Checkbox } from '@mantine/core';
import { pdf } from '@react-pdf/renderer';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { notifications } from '@mantine/notifications';
import type { EducationSession } from '@store/educationStore';
import { CertificateTemplate } from './CertificateTemplate';

/** Safe filename: replace spaces with underscores, remove non-word chars (keep Turkish letters). */
function safeFileName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^\w\u00C0-\u024F\-_]/g, '')
    || 'Sertifika';
}

/** Safe folder name for ZIP (avoid path separators). */
function safeFolderName(name: string): string {
  return safeFileName(name).replace(/[\\/]/g, '_');
}

interface CertificateModalProps {
  opened: boolean;
  onClose: () => void;
  /** The completed training session (attendees are participant display names or IDs). */
  session: EducationSession | null;
  /** Resolved display names for session.attendees (same order). */
  participantNames: string[];
}

export function CertificateModal({
  opened,
  onClose,
  session,
  participantNames,
}: CertificateModalProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const options = participantNames.map((name) => ({ value: name, label: name }));
  const allSelected = participantNames.length > 0 && selected.length === participantNames.length;
  const someSelected = selected.length > 0;

  const handleSelectAll = (checked: boolean) => {
    setSelected(checked ? [...participantNames] : []);
  };

  const handleGenerate = async () => {
    if (!session || selected.length === 0) {
      notifications.show({
        title: 'Katılımcı seçin',
        message: 'En az bir katılımcı seçmelisiniz.',
        color: 'yellow',
      });
      return;
    }

    setLoading(true);
    notifications.show({
      title: 'Sertifikalar hazırlanıyor...',
      message: `${selected.length} sertifika oluşturuluyor.`,
      color: 'blue',
      autoClose: 2000,
    });

    try {
      const zip = new JSZip();
      const trainingTitle = session.title ?? '';
      const folderName = trainingTitle
        ? safeFolderName(trainingTitle) || 'Sertifikalar'
        : 'Sertifikalar';
      const folder = zip.folder(folderName);
      if (!folder) throw new Error('Klasör oluşturulamadı');

      const date = session.date instanceof Date ? session.date : new Date(session.date);
      const durationHours = typeof session.durationHours === 'number' ? session.durationHours : 0;
      const location = session.location ?? '';
      const instructorName = session.trainer ?? '';

      console.log('[Certificate] Generating certificates for', selected.length, 'participants...');

      // Generate PDFs and add to folder one-by-one so zip never runs before all blobs are added.
      // folder is created above and stays in scope for the whole loop.
      for (const participant of selected) {
        const pName = participant?.trim() || 'İsimsiz';
        const element = (
          <CertificateTemplate
            participantName={pName}
            trainingTitle={trainingTitle}
            date={date}
            durationHours={durationHours}
            location={location}
            instructorName={instructorName}
          />
        );
        const blob = await pdf(element).toBlob();
        if (!blob) throw new Error(`Blob is null for participant: ${pName}`);
        if (blob.size === 0) throw new Error(`Blob size is 0 for participant: ${pName}`);
        const safeName = safeFileName(pName);
        const filename = `${safeName}_Sertifika.pdf`;
        folder.file(filename, blob);
        console.log('File added to zip:', filename);
      }

      console.log('[Certificate] All PDFs generated. Zipping...');
      const content = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `${folderName}_Sertifikalar.zip`;
      saveAs(content, zipFileName);

      notifications.show({
        title: 'Başarılı',
        message: 'Sertifikalar başarıyla indirildi.',
        color: 'green',
      });
      setSelected([]);
      onClose();
    } catch (error) {
      console.error('[Certificate] Main Error:', error);
      if (error instanceof Error) {
        console.error('[Certificate] Error message:', error.message);
        console.error('[Certificate] Error stack:', error.stack);
      }
      notifications.show({
        title: 'Hata',
        message: 'Sertifika oluşturulurken hata oluştu.',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelected([]);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Toplu Sertifika Oluştur"
      size="md"
    >
      {session ? (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            {session.title} — Tamamlanan eğitim için katılımcıları seçin. Seçilenler için PDF sertifikalar oluşturulup tek bir ZIP dosyasında indirilir.
          </Text>
          <Checkbox
            label="Tümünü seç"
            checked={allSelected}
            indeterminate={someSelected && !allSelected}
            onChange={() => handleSelectAll(!allSelected)}
          />
          <MultiSelect
            label="Katılımcılar"
            placeholder="Katılımcı seçin"
            data={options}
            value={selected}
            onChange={setSelected}
            searchable
            clearable
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleClose}>
              İptal
            </Button>
            <Button
              onClick={handleGenerate}
              loading={loading}
              disabled={selected.length === 0}
            >
              Sertifika Oluştur
            </Button>
          </Group>
        </Stack>
      ) : (
        <Text size="sm" c="dimmed">
          Eğitim bilgisi yok.
        </Text>
      )}
    </Modal>
  );
}
