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
import { DateInput } from '@mantine/dates';
import { FileButton } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCompanyStore } from '@store/companyStore';
import {
  useCompanyDocumentStore,
  COMPANY_DOCUMENT_TYPE_LABELS,
  TYPES_REQUIRING_VALID_UNTIL,
  type CompanyDocumentType,
} from '../stores/companyDocumentStore';

const TYPE_OPTIONS = (Object.entries(COMPANY_DOCUMENT_TYPE_LABELS) as [CompanyDocumentType, string][]).map(
  ([value, label]) => ({ value, label })
);

interface CompanyDocumentModalProps {
  opened: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

interface FormValues {
  companyId: string | null;
  type: CompanyDocumentType | null;
  title: string;
  validUntilDate: Date | null;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function CompanyDocumentModal({ opened, onClose, onSaved }: CompanyDocumentModalProps) {
  const companies = useCompanyStore((s) => s.companies);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const uploadDocument = useCompanyDocumentStore((s) => s.uploadDocument);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState<string | null>(null);
  const fileResetRef = useRef<(() => void) | null>(null);

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  const form = useForm<FormValues>({
    initialValues: {
      companyId: null,
      type: null,
      title: '',
      validUntilDate: null,
    },
    validate: {
      companyId: (v) => (!v ? 'Firma seçin' : null),
      type: (v) => (!v ? 'Belge türü seçin' : null),
      title: (v) => (!v?.trim() ? 'Belge adı girin' : null),
      validUntilDate: (v, values) => {
        if (values.type && TYPES_REQUIRING_VALID_UNTIL.includes(values.type) && !v) {
          return 'Bu belge türü için geçerlilik tarihi zorunludur';
        }
        return null;
      },
    },
  });

  const selectedType = form.values.type;
  const requireValidUntil = selectedType != null && TYPES_REQUIRING_VALID_UNTIL.includes(selectedType);

  // Auto-fill title when type changes (user can still edit)
  useEffect(() => {
    if (selectedType) {
      form.setFieldValue('title', COMPANY_DOCUMENT_TYPE_LABELS[selectedType]);
    }
  }, [selectedType]);

  useEffect(() => {
    if (opened) {
      form.reset();
      setSelectedFile(null);
      setFileDataUrl(null);
      fileResetRef.current?.();
    }
  }, [opened]);

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
        message: 'Lütfen bir evrak dosyası seçin.',
        color: 'red',
      });
      return;
    }
    const company = getCompanyById(values.companyId!);
    const companyName = company?.name ?? values.companyId!;
    uploadDocument({
      companyId: values.companyId!,
      companyName,
      type: values.type!,
      title: values.title.trim(),
      fileUrl: dataUrl,
      uploadDate: new Date(),
      validUntilDate: requireValidUntil ? values.validUntilDate : null,
      fileName: selectedFile?.name,
    });
    notifications.show({
      title: 'Başarılı',
      message: 'Evrak yüklendi.',
      color: 'green',
    });
    handleClose();
    onSaved?.();
  });

  return (
    <Modal opened={opened} onClose={handleClose} title="Evrak Yükle" size="md">
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Select
            label="Firma Seç"
            placeholder="Firma seçin"
            required
            data={companyOptions}
            searchable
            {...form.getInputProps('companyId')}
          />
          <Select
            label="Belge Türü"
            placeholder="Tür seçin"
            required
            data={TYPE_OPTIONS}
            {...form.getInputProps('type')}
          />
          <TextInput
            label="Belge Adı"
            placeholder="Örn: Vergi Levhası 2024"
            required
            {...form.getInputProps('title')}
          />
          <DateInput
            label="Geçerlilik Tarihi"
            placeholder={requireValidUntil ? 'Zorunlu' : 'İsteğe bağlı'}
            valueFormat="DD.MM.YYYY"
            value={form.values.validUntilDate}
            onChange={(d) => form.setFieldValue('validUntilDate', d)}
            clearable={!requireValidUntil}
            required={requireValidUntil}
          />
          <div>
            <Text size="sm" fw={500} mb={4}>
              Dosya <span style={{ color: 'red' }}>*</span>
            </Text>
            <FileButton
              resetRef={fileResetRef}
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,image/*"
            >
              {(props) => (
                <Button {...props} variant="light" size="sm">
                  {selectedFile ? `Dosya: ${selectedFile.name}` : 'Evrak dosyası seç (PDF, Word, resim)'}
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
