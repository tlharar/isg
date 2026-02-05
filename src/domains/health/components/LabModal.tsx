import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Stack,
  Select,
  Textarea,
  Button,
  Group,
  Anchor,
  Text,
  Divider,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { FileButton } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useWorkerStore } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';
import {
  useLabStore,
  type LabExam,
  type LabExamType,
  type DoctorEvaluation,
} from '../stores/labStore';
import { notifications } from '@mantine/notifications';

export const LAB_EXAM_TYPE_OPTIONS: { value: LabExamType; label: string }[] = [
  { value: 'AUDIOMETRY', label: 'Odyometri' },
  { value: 'SFT', label: 'SFT (Solunum Fonksiyon Testi)' },
  { value: 'HEMOGRAM', label: 'Hemogram' },
  { value: 'XRAY', label: 'Röntgen' },
  { value: 'EYE', label: 'Göz Muayenesi' },
  { value: 'ECG', label: 'EKG' },
  { value: 'OTHER', label: 'Diğer' },
];

const EVALUATION_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'Seçin' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'RISKY', label: 'Riskli' },
  { value: 'REFERRAL', label: 'Sevk' },
];

/** Mock URL for uploaded file (no real upload in this implementation). */
function mockFileUrl(file: File): string {
  return `mock://lab-uploads/${Date.now()}-${file.name}`;
}

interface LabModalProps {
  opened: boolean;
  onClose: () => void;
  /** When set, Mode B (Doctor Review). When null, Mode A (New Request/Upload). */
  exam: LabExam | null;
  onSaved?: () => void;
}

export function LabModal({ opened, onClose, exam, onSaved }: LabModalProps) {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const workers = useWorkerStore((s) => s.workers);
  const requestExam = useLabStore((s) => s.requestExam);
  const uploadResult = useLabStore((s) => s.uploadResult);
  const evaluateExam = useLabStore((s) => s.evaluateExam);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const workerOptions = useMemo(
    () =>
      workers
        .filter((w) => !selectedCompanyId || w.companyId === selectedCompanyId)
        .map((w) => ({ value: w.id, label: w.nameSurname ?? w.id })),
    [workers, selectedCompanyId]
  );

  const isReviewMode = exam !== null && exam.status === 'UPLOADED';

  const requestForm = useForm({
    initialValues: {
      workerId: '',
      type: 'AUDIOMETRY' as LabExamType,
      requestDate: new Date(),
    },
    validate: {
      workerId: (v: string) => (!v ? 'Personel seçin' : null),
      type: (v: string) => (!v ? 'Tetkik türü seçin' : null),
      requestDate: (v: Date | null) => (!v ? 'Tarih seçin' : null),
    },
  });

  const reviewForm = useForm({
    initialValues: {
      doctorEvaluation: '' as string,
      doctorNotes: '',
    },
    validate: {
      doctorEvaluation: (v: string) => (!v ? 'Değerlendirme sonucu seçin' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      setSelectedFile(null);
      if (exam && isReviewMode) {
        reviewForm.setValues({
          doctorEvaluation: exam.doctorEvaluation ?? '',
          doctorNotes: exam.doctorNotes ?? '',
        });
      } else if (!exam) {
        requestForm.setValues({
          workerId: '',
          type: 'AUDIOMETRY',
          requestDate: new Date(),
        });
      }
    }
  }, [opened, exam, isReviewMode]);

  const handleRequestSubmit = requestForm.onSubmit((values) => {
    if (!values.requestDate) return;
    const newExam = requestExam({
      workerId: values.workerId,
      type: values.type as LabExamType,
      requestDate: values.requestDate,
    });
    if (selectedFile) {
      const mockUrl = mockFileUrl(selectedFile);
      uploadResult(newExam.id, mockUrl);
      notifications.show({
        title: 'Tetkik talebi ve dosya kaydedildi',
        message: '',
        color: 'green',
      });
    } else {
      notifications.show({
        title: 'Tetkik talebi oluşturuldu',
        message: '',
        color: 'green',
      });
    }
    onSaved?.();
    onClose();
  });

  const handleReviewSubmit = reviewForm.onSubmit((values) => {
    if (!exam || !values.doctorEvaluation) return;
    evaluateExam(exam.id, values.doctorEvaluation as DoctorEvaluation, values.doctorNotes.trim());
    notifications.show({
      title: 'Değerlendirme kaydedildi',
      message: '',
      color: 'green',
    });
    onSaved?.();
    onClose();
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={isReviewMode ? 'Tetkik İnceleme (Doktor Değerlendirmesi)' : 'Yeni Tetkik Talebi / Dosya Yükle'}
      size="md"
    >
      {isReviewMode ? (
        <form onSubmit={handleReviewSubmit}>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Personel / Tetkik bilgisi kayıt detayında görüntülenir.
            </Text>
            {exam.fileUrl && (
              <>
                <Text size="sm" fw={500}>
                  Yüklenen dosya
                </Text>
                <Anchor href={exam.fileUrl} target="_blank" rel="noopener noreferrer" size="sm">
                  Dosyayı Görüntüle
                </Anchor>
              </>
            )}
            <Divider />
            <Select
              label="Değerlendirme Sonucu"
              placeholder="Seçin"
              data={EVALUATION_OPTIONS}
              {...reviewForm.getInputProps('doctorEvaluation')}
            />
            <Textarea
              label="Doktor Kanaati / Notlar"
              placeholder="Yorum veya not girin"
              {...reviewForm.getInputProps('doctorNotes')}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={onClose}>
                İptal
              </Button>
              <Button type="submit">
                Onayla ve Kaydet
              </Button>
            </Group>
          </Stack>
        </form>
      ) : (
        <form onSubmit={handleRequestSubmit}>
          <Stack gap="md">
            <Select
              label="Personel"
              placeholder="Personel seçin"
              data={workerOptions}
              searchable
              {...requestForm.getInputProps('workerId')}
            />
            <Select
              label="Tetkik Türü"
              placeholder="Tetkik türü seçin"
              data={LAB_EXAM_TYPE_OPTIONS}
              {...requestForm.getInputProps('type')}
            />
            <DatePickerInput
              label="Talep Tarihi"
              valueFormat="DD.MM.YYYY"
              {...requestForm.getInputProps('requestDate')}
            />
            <div>
              <Text size="sm" fw={500} mb={4}>
                Dosya Yükle (PDF/Resim)
              </Text>
              <FileButton onChange={setSelectedFile} accept="application/pdf,image/*">
                {(props) => (
                  <Button {...props} variant="light" size="sm">
                    {selectedFile ? selectedFile.name : 'Dosya Seç'}
                  </Button>
                )}
              </FileButton>
              {selectedFile && (
                <Text size="xs" c="dimmed" mt={4}>
                  Yüklendiğinde durum "Yüklendi" olarak kaydedilir.
                </Text>
              )}
            </div>
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={onClose}>
                İptal
              </Button>
              <Button type="submit">
                Kaydet
              </Button>
            </Group>
          </Stack>
        </form>
      )}
    </Modal>
  );
}
