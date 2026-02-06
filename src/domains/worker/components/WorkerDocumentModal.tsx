import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Stack,
  Textarea,
  TextInput,
  Select,
  Button,
  Group,
  Text,
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { FileButton } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useWorkerStore } from '@store/workerStore';
import {
  useWorkerDocumentStore,
  WORKER_DOCUMENT_TYPE_LABELS,
  TYPES_WITH_EXPIRY,
  TYPE_REQUIRES_EXPIRY,
  type WorkerDocumentType,
} from '../stores/workerDocumentStore';

const TYPE_OPTIONS = (Object.entries(WORKER_DOCUMENT_TYPE_LABELS) as [WorkerDocumentType, string][]).map(
  ([value, label]) => ({ value, label })
);

interface WorkerDocumentModalProps {
  opened: boolean;
  onClose: () => void;
  /** When provided (e.g. from WorkerDocumentsTab), pre-select this worker and lock the field. When omitted (standalone from AllWorkerDocumentsPage), user must select a worker. */
  initialWorkerId?: string;
  onSaved?: () => void;
}

interface FormValues {
  workerId: string | null;
  type: WorkerDocumentType | null;
  documentNumber: string;
  notes: string;
  expiryDate: Date | null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function WorkerDocumentModal({
  opened,
  onClose,
  initialWorkerId,
  onSaved,
}: WorkerDocumentModalProps) {
  const workers = useWorkerStore((s) => s.workers);
  const addDocument = useWorkerDocumentStore((s) => s.addDocument);
  const checkDocumentExpirations = useWorkerDocumentStore((s) => s.checkDocumentExpirations);
  const checkAllExpirations = useWorkerDocumentStore((s) => s.checkAllExpirations);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const fileResetRef = useRef<(() => void) | null>(null);

  const workerOptions = workers.map((w) => ({
    value: w.id,
    label: w.nameSurname?.trim() || w.id,
  }));

  const form = useForm<FormValues>({
    initialValues: {
      workerId: initialWorkerId ?? null,
      type: null,
      documentNumber: '',
      notes: '',
      expiryDate: null,
    },
    validate: {
      workerId: (v) => (!v ? 'Personel seçin' : null),
      type: (v) => (!v ? 'Belge türü seçin' : null),
      expiryDate: (v, values) => {
        if (values.type === TYPE_REQUIRES_EXPIRY && !v) return 'MYK belgesi için geçerlilik tarihi zorunludur';
        return null;
      },
    },
  });

  const selectedWorkerId = form.values.workerId;
  const selectedType = form.values.type;
  const showExpiry = selectedType != null && TYPES_WITH_EXPIRY.includes(selectedType);
  const isWorkerLocked = Boolean(initialWorkerId);

  useEffect(() => {
    if (opened) {
      form.setValues({
        workerId: initialWorkerId ?? null,
        type: null,
        documentNumber: '',
        notes: '',
        expiryDate: null,
      });
      setSelectedFile(null);
      setFileDataUrl(null);
      fileResetRef.current?.();
    }
  }, [opened, initialWorkerId]);

  const handleFileChange = (file: File | null) => {
    setSelectedFile(file);
    setFileDataUrl(null);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setFileDataUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    form.reset();
    setSelectedFile(null);
    setFileDataUrl(null);
    fileResetRef.current?.();
    onClose();
  };

  const handleSubmit = form.onSubmit(async (values) => {
    const dataUrl = fileDataUrl || (selectedFile ? await readFileAsDataUrl(selectedFile) : null);
    if (!dataUrl) {
      notifications.show({
        title: 'Dosya gerekli',
        message: 'Lütfen bir belge dosyası seçin.',
        color: 'red',
      });
      return;
    }
    const workerId = values.workerId!;
    const type = values.type!;
    const title = WORKER_DOCUMENT_TYPE_LABELS[type];
    addDocument({
      workerId,
      type,
      title,
      documentNumber: (values.documentNumber ?? '').trim(),
      notes: values.notes?.trim() || undefined,
      fileUrl: dataUrl,
      uploadDate: new Date(),
      expiryDate: showExpiry ? values.expiryDate : null,
      fileName: selectedFile?.name,
    });
    notifications.show({
      title: 'Başarılı',
      message: 'Belge eklendi.',
      color: 'green',
    });
    handleClose();
    if (initialWorkerId) {
      checkDocumentExpirations(workerId);
    } else {
      checkAllExpirations();
    }
    onSaved?.();
  });

  return (
    <Modal opened={opened} onClose={handleClose} title="Belge Yükle" size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Select
            label="Personel Seç"
            placeholder="Personel seçin"
            required
            data={workerOptions}
            value={selectedWorkerId}
            onChange={(v) => form.setFieldValue('workerId', v)}
            disabled={isWorkerLocked}
            searchable
            clearable={!isWorkerLocked}
          />
          <Select
            label="Belge Türü"
            placeholder="Tür seçin"
            required
            data={TYPE_OPTIONS}
            {...form.getInputProps('type')}
          />
          <TextInput
            label="Belge No"
            placeholder="İsteğe bağlı"
            {...form.getInputProps('documentNumber')}
          />
          {showExpiry && (
            <DateInput
              label="Geçerlilik Tarihi"
              placeholder="Bitiş tarihi"
              valueFormat="DD.MM.YYYY"
              value={form.values.expiryDate}
              onChange={(d) => form.setFieldValue('expiryDate', d)}
              clearable={selectedType !== TYPE_REQUIRES_EXPIRY}
              required={selectedType === TYPE_REQUIRES_EXPIRY}
            />
          )}
          <Textarea
            label="Not / Açıklama"
            placeholder="İsteğe bağlı ek bilgi"
            minRows={2}
            {...form.getInputProps('notes')}
          />
          <div>
            <Text size="sm" fw={500} required mb={4}>
              Dosya
            </Text>
            <FileButton
              resetRef={fileResetRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,image/*"
            >
              {(props) => (
                <Button {...props} variant="light" size="sm">
                  {selectedFile ? `Dosya: ${selectedFile.name}` : 'Belge dosyası seç (PDF, Word, resim)'}
                </Button>
              )}
            </FileButton>
          </div>
          <Group justify="flex-end" mt="md">
            <Button variant="default" type="button" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" disabled={!selectedFile}>
              Yükle
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
