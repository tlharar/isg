import { useState, useRef } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Card,
  SimpleGrid,
  Modal,
  TextInput,
  Select,
  ActionIcon,
  Badge,
  FileButton,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconTrash,
  IconDownload,
  IconFlame,
  IconActivity,
  IconDroplet,
  IconFlask,
  IconFileText,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useEmergencyPlanStore,
  isExpired,
  type EmergencyPlan,
  type EmergencyPlanType,
  type EmergencyPlanStatus,
} from '@store/emergencyPlanStore';

const PLAN_TYPE_OPTIONS: { value: EmergencyPlanType; label: string }[] = [
  { value: 'Fire', label: 'Yangın' },
  { value: 'Earthquake', label: 'Deprem' },
  { value: 'Flood', label: 'Sel' },
  { value: 'Chemical', label: 'Kimyasal' },
  { value: 'General', label: 'Genel' },
];

const PLAN_TYPE_ICONS: Record<EmergencyPlanType, typeof IconFlame> = {
  Fire: IconFlame,
  Earthquake: IconActivity,
  Flood: IconDroplet,
  Chemical: IconFlask,
  General: IconFileText,
};

const STATUS_COLORS: Record<EmergencyPlanStatus, string> = {
  Active: 'green',
  Draft: 'gray',
  Expired: 'red',
};

const STATUS_LABELS: Record<EmergencyPlanStatus, string> = {
  Active: 'Aktif',
  Draft: 'Taslak',
  Expired: 'Süresi Doldu',
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function EmergencyPlanPage() {
  const plans = useEmergencyPlanStore((s) => s.plans);
  const addPlan = useEmergencyPlanStore((s) => s.addPlan);
  const deletePlan = useEmergencyPlanStore((s) => s.deletePlan);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<EmergencyPlanType>('Fire');
  const [formVersion, setFormVersion] = useState('');
  const [formValidUntil, setFormValidUntil] = useState<Date | null>(null);
  const [formFileName, setFormFileName] = useState('');
  const fileResetRef = useRef<() => void>(null);

  const openCreate = () => {
    setFormTitle('');
    setFormType('Fire');
    setFormVersion('');
    setFormValidUntil(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    setFormFileName('');
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
  };

  const handleSave = () => {
    const title = formTitle.trim();
    if (!title) {
      notifications.show({
        title: 'Eksik alan',
        message: 'Plan başlığı girin.',
        color: 'red',
      });
      return;
    }
    const version = formVersion.trim() || 'v1.0';
    const validUntil = formValidUntil ? formValidUntil.toISOString().slice(0, 10) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const fileName = formFileName.trim() || `${title.replace(/\s+/g, '-').toLowerCase()}-${version}.pdf`;

    addPlan({
      title,
      type: formType,
      version,
      createdDate: new Date().toISOString().slice(0, 10),
      validUntil,
      status: 'Draft',
      fileName,
    });
    notifications.show({
      title: 'Plan eklendi',
      message: 'Acil durum planı listeye eklendi.',
      color: 'green',
    });
    handleCloseModal();
  };

  const handleDownload = (plan: EmergencyPlan) => {
    notifications.show({
      title: 'İndiriliyor',
      message: `"${plan.fileName}" simüle edildi. (Demo)`,
      color: 'blue',
    });
  };

  const handleDelete = (plan: EmergencyPlan) => {
    if (!window.confirm(`"${plan.title}" planını silmek istediğinize emin misiniz?`)) return;
    deletePlan(plan.id);
    notifications.show({
      title: 'Plan silindi',
      message: 'Kayıt kaldırıldı.',
      color: 'gray',
    });
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Acil Durum Planları</Title>
            <MantineText c="dimmed" size="sm">
              Senaryoya göre resmi prosedür dokümanlarını yönetin.
            </MantineText>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openCreate}>
            Plan Ekle
          </Button>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {plans.map((plan) => {
            const Icon = PLAN_TYPE_ICONS[plan.type];
            const expired = plan.status === 'Expired' || isExpired(plan);
            return (
              <Card
                key={plan.id}
                withBorder
                padding="md"
                radius="md"
                shadow="sm"
                style={{
                  borderColor: expired ? 'var(--mantine-color-red-6)' : undefined,
                  borderWidth: expired ? 2 : undefined,
                }}
              >
                <Stack gap="md">
                  <Group justify="space-between" wrap="nowrap">
                    <Icon size={24} color={expired ? 'var(--mantine-color-red-6)' : undefined} />
                    <Badge size="sm" color={STATUS_COLORS[plan.status]} variant="light">
                      {STATUS_LABELS[plan.status]}
                    </Badge>
                  </Group>
                  <div>
                    <MantineText fw={700} lineClamp={2}>
                      {plan.title}
                    </MantineText>
                    <MantineText size="xs" c="dimmed" mt={4}>
                      {plan.version} · Geçerlilik: {formatDate(plan.validUntil)}
                    </MantineText>
                  </div>
                  <Group gap="xs" justify="space-between">
                    <Button
                      variant="light"
                      size="xs"
                      leftSection={<IconDownload size={14} />}
                      onClick={() => handleDownload(plan)}
                    >
                      İndir
                    </Button>
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="lg"
                      onClick={() => handleDelete(plan)}
                      aria-label="Sil"
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  </Group>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>

        {plans.length === 0 && (
          <MantineText size="sm" c="dimmed" py="xl" ta="center">
            Henüz acil durum planı yok. Plan ekleyin.
          </MantineText>
        )}
      </Stack>

      <Modal opened={modalOpened} onClose={handleCloseModal} title="Yeni plan ekle" size="md">
        <Stack gap="md">
          <TextInput
            label="Plan başlığı"
            placeholder="Örn: Merkez Ofis Yangın Planı"
            value={formTitle}
            onChange={(e) => setFormTitle(e.currentTarget.value)}
            required
          />
          <Select
            label="Türü"
            data={PLAN_TYPE_OPTIONS}
            value={formType}
            onChange={(v) => setFormType((v as EmergencyPlanType) ?? 'Fire')}
          />
          <TextInput
            label="Versiyon no"
            placeholder="Örn: v1.0"
            value={formVersion}
            onChange={(e) => setFormVersion(e.currentTarget.value)}
          />
          <DatePickerInput
            label="Geçerlilik tarihi"
            placeholder="Tarih seçin"
            valueFormat="DD.MM.YYYY"
            value={formValidUntil}
            onChange={setFormValidUntil}
          />
          <FileButton
            resetRef={fileResetRef}
            onChange={(file) => setFormFileName(file?.name ?? '')}
            accept="application/pdf"
          >
            {(props) => (
              <Button {...props} variant="light" size="sm">
                {formFileName ? `Dosya: ${formFileName}` : 'Plan dosyası yükle (PDF)'}
              </Button>
            )}
          </FileButton>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={handleCloseModal}>
              İptal
            </Button>
            <Button onClick={handleSave}>Kaydet</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
