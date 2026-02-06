import { useEffect, useRef, useState } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Select,
  Button,
  Group,
  Text,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { FileButton } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useAuthStore } from '@shared/stores/authStore';
import { notifications } from '@mantine/notifications';
import {
  useDocumentStore,
  OHS_CATEGORY_LABELS,
  type OHSDocumentCategory,
} from '../stores/documentStore';

const CATEGORY_OPTIONS = (Object.entries(OHS_CATEGORY_LABELS) as [OHSDocumentCategory, string][]).map(
  ([value, label]) => ({ value, label })
);

interface DocumentUploadModalProps {
  opened: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface FormValues {
  title: string;
  category: OHSDocumentCategory | null;
  preparationDate: Date | null;
  validUntilDate: Date | null;
}

export function DocumentUploadModal({ opened, onClose, onSaved }: DocumentUploadModalProps) {
  const currentUser = useAuthStore((s) => s.currentUser);
  const uploadDocument = useDocumentStore((s) => s.uploadDocument);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const fileResetRef = useRef<(() => void) | null>(null);

  const form = useForm<FormValues>({
    initialValues: {
      title: '',
      category: null,
      preparationDate: new Date(),
      validUntilDate: null,
    },
    validate: {
      title: (v) => (!v?.trim() ? 'Belge adı girin' : null),
      category: (v) => (!v ? 'Kategori seçin' : null),
      preparationDate: (v) => (!v ? 'Hazırlanma tarihi seçin' : null),
    },
  });

  const category = form.values.category;
  const preparationDate = form.values.preparationDate;

  // When Risk Assessment is selected, suggest validity end date (+2 years from preparation date)
  useEffect(() => {
    if (category === 'RISK_ASSESSMENT' && preparationDate) {
      const end = new Date(preparationDate);
      end.setFullYear(end.getFullYear() + 2);
      form.setFieldValue('validUntilDate', end);
    }
  }, [category, preparationDate]);

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
        message: 'Lütfen bir belge dosyası yükleyin.',
        color: 'red',
      });
      return;
    }
    const prep = values.preparationDate!;
    const validUntil = values.validUntilDate ?? null;
    const uploadedBy = currentUser
      ? `${currentUser.firstName} ${currentUser.lastName}`.trim() || currentUser.email
      : 'Bilinmiyor';
    uploadDocument({
      title: values.title.trim(),
      category: values.category!,
      preparationDate: prep,
      validUntilDate: validUntil,
      fileUrl: dataUrl,
      uploadedBy,
      revision: 1,
      fileName: selectedFile?.name,
    });
    notifications.show({
      title: 'Başarılı',
      message: 'Belge yüklendi.',
      color: 'green',
    });
    handleClose();
    onSaved?.();
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Belge Yükle"
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <TextInput
            label="Belge Adı"
            placeholder="Örn: 2024 Risk Değerlendirme Raporu"
            required
            {...form.getInputProps('title')}
          />
          <Select
            label="Kategori"
            placeholder="Kategori seçin"
            required
            data={CATEGORY_OPTIONS}
            {...form.getInputProps('category')}
          />
          <DatePickerInput
            label="Hazırlanma Tarihi"
            placeholder="Tarih seçin"
            valueFormat="DD.MM.YYYY"
            required
            {...form.getInputProps('preparationDate')}
          />
          <DatePickerInput
            label="Geçerlilik Bitiş Tarihi"
            placeholder="İsteğe bağlı"
            valueFormat="DD.MM.YYYY"
            clearable
            {...form.getInputProps('validUntilDate')}
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
