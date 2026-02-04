import { useState, useMemo } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Card,
  SimpleGrid,
  Input,
  SegmentedControl,
  Modal,
  Textarea,
  Badge,
  Tabs,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconCheck, IconArrowRight } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useNonConformityStore,
  type NonConformity,
  type NonConformityRiskLevel,
} from '@store/nonConformityStore';
import { useDofStore } from '@store/dofStore';
import { useAppStore } from '@shared/stores/appStore';
const RISK_FILTER_OPTIONS = [
  { value: 'all', label: 'Tümü' },
  { value: 'Critical', label: 'Kritik' },
  { value: 'Major', label: 'Major' },
  { value: 'Minor', label: 'Minor' },
];

const RISK_LABELS: Record<NonConformityRiskLevel, string> = {
  Critical: 'Kritik',
  Major: 'Major',
  Minor: 'Minor',
};

const RISK_COLORS: Record<NonConformityRiskLevel, string> = {
  Critical: 'red',
  Major: 'orange',
  Minor: 'yellow',
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function NonConformityPage() {
  // 1. All hooks at top (unconditional)
  const navigate = useNavigate();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const items = useNonConformityStore((s) => s.items);
  const addIssue = useNonConformityStore((s) => s.addIssue);
  const quickClose = useNonConformityStore((s) => s.quickClose);
  const markAsConverted = useNonConformityStore((s) => s.markAsConverted);
  const addDof = useDofStore((s) => s.addDof);

  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('open');
  const [closeModalOpened, { open: openCloseModal, close: closeCloseModal }] = useDisclosure(false);
  const [dofModalOpened, { open: openDofModal, close: closeDofModal }] = useDisclosure(false);
  const [addModalOpened, { open: openAddModal, close: closeAddModal }] = useDisclosure(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [closeNote, setCloseNote] = useState('');

  const [addForm, setAddForm] = useState({
    source: 'Çalışan Bildirimi',
    description: '',
    location: '',
    riskLevel: 'Major' as NonConformityRiskLevel,
  });

  const openItems = useMemo(
    () => items.filter((i) => i.status === 'Open'),
    [items]
  );
  const historyItems = useMemo(
    () => items.filter((i) => i.status === 'Closed' || i.status === 'ConvertedToDOF'),
    [items]
  );

  const filteredOpen = useMemo(() => {
    let list = openItems;
    if (riskFilter !== 'all') {
      list = list.filter((i) => i.riskLevel === riskFilter);
    }
    return list;
  }, [openItems, riskFilter]);

  const filteredHistory = useMemo(() => {
    let list = historyItems;
    if (riskFilter !== 'all') {
      list = list.filter((i) => i.riskLevel === riskFilter);
    }
    return list;
  }, [historyItems, riskFilter]);

  const selectedItem = useMemo(
    () => (selectedId ? items.find((i) => i.id === selectedId) ?? null : null),
    [items, selectedId]
  );

  const handleOpenCloseModal = (id: string) => {
    setSelectedId(id);
    setCloseNote('');
    openCloseModal();
  };

  const handleQuickClose = () => {
    if (!selectedId) return;
    quickClose(selectedId, closeNote.trim() || 'Hızlı kapatıldı.');
    notifications.show({
      title: 'Uygunsuzluk kapatıldı',
      message: 'Kayıt güncellendi.',
      color: 'green',
    });
    closeCloseModal();
    setSelectedId(null);
  };

  /** DÖF Başlat: mark issue as ConvertedToDOF and optionally navigate to DÖF. No hooks inside. */
  const handleConvertToDof = (issueId: string) => {
    setSelectedId(issueId);
    openDofModal();
  };

  const handleMarkAsConverted = () => {
    if (!selectedId || !selectedItem) return;
    const issue = selectedItem;

    // Step 1: Create new DÖF record from issue
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + 7);
    const deadlineStr = deadline.toISOString().slice(0, 10);
    addDof({
      companyId: selectedCompanyId ?? '',
      source: `Uygunsuzluk - ${issue.source}`,
      type: 'Düzenleyici',
      description: issue.description,
      responsible: 'Atanacak',
      deadline: deadlineStr,
      status: 'Açık',
    });

    // Step 2: Lock original issue as ConvertedToDOF
    markAsConverted(selectedId);

    // Step 3: Notify and navigate
    notifications.show({
      title: 'DÖF kaydı başarıyla oluşturuldu.',
      message: 'DÖF listesine yönlendiriliyorsunuz.',
      color: 'green',
    });
    closeDofModal();
    setSelectedId(null);
    navigate('/safety/audit/dof-list');
  };

  const handleManualAdd = () => {
    if (!addForm.description.trim() || !addForm.location.trim()) {
      notifications.show({
        title: 'Eksik alan',
        message: 'Açıklama ve konum zorunludur.',
        color: 'red',
      });
      return;
    }
    addIssue({
      source: addForm.source,
      description: addForm.description.trim(),
      location: addForm.location.trim(),
      riskLevel: addForm.riskLevel,
      status: 'Open',
      detectedDate: new Date().toISOString().slice(0, 10),
      evidencePhoto:
        'data:image/svg+xml,' +
        encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120"><rect fill="#e9ecef" width="200" height="120"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#868e96" font-size="12" font-family="sans-serif">Manuel ekleme</text></svg>'
        ),
    });
    notifications.show({
      title: 'Uygunsuzluk eklendi',
      message: 'Kayıt listeye eklendi.',
      color: 'green',
    });
    setAddForm({ source: 'Çalışan Bildirimi', description: '', location: '', riskLevel: 'Major' });
    closeAddModal();
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between" wrap="wrap">
          <div>
            <Title order={2}>Uygunsuzluklar</Title>
            <MantineText c="dimmed" size="sm">
              Denetim ve bildirimlerden tespit edilen uygunsuzlukları yönetin.
            </MantineText>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openAddModal}>
            Manuel Ekle
          </Button>
        </Group>

        <SegmentedControl
          value={riskFilter}
          onChange={setRiskFilter}
          data={RISK_FILTER_OPTIONS}
        />

        <Tabs value={activeTab} onChange={(v) => setActiveTab(v ?? 'open')}>
          <Tabs.List>
            <Tabs.Tab value="open">Açık ({filteredOpen.length})</Tabs.Tab>
            <Tabs.Tab value="history">Geçmiş ({filteredHistory.length})</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="open" pt="md">
            {filteredOpen.length === 0 ? (
              <MantineText size="sm" c="dimmed" py="xl" ta="center">
                Bu filtrede açık uygunsuzluk yok.
              </MantineText>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {filteredOpen.map((item) => (
                  <IssueCard
                    key={item.id}
                    item={item}
                    onQuickClose={() => handleOpenCloseModal(item.id)}
                    onConvertToDof={() => handleConvertToDof(item.id)}
                    dimmed={false}
                  />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="md">
            {filteredHistory.length === 0 ? (
              <MantineText size="sm" c="dimmed" py="xl" ta="center">
                Geçmiş kayıt yok.
              </MantineText>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {filteredHistory.map((item) => (
                  <IssueCard
                    key={item.id}
                    item={item}
                    onQuickClose={() => {}}
                    onConvertToDof={() => {}}
                    dimmed
                  />
                ))}
              </SimpleGrid>
            )}
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Hızlı Kapat modal */}
      <Modal opened={closeModalOpened} onClose={() => { closeCloseModal(); setSelectedId(null); }} title="Hızlı Kapat" size="sm">
        <Stack gap="md">
          <Textarea
            label="Çözüm notu"
            placeholder="Yapılan işlem veya kapanış gerekçesi..."
            value={closeNote}
            onChange={(e) => setCloseNote(e.currentTarget.value)}
            minRows={3}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeCloseModal}>İptal</Button>
            <Button leftSection={<IconCheck size={14} />} onClick={handleQuickClose}>
              Kapat
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* DÖF Başlat modal */}
      <Modal opened={dofModalOpened} onClose={() => { closeDofModal(); setSelectedId(null); }} title="DÖF'e dönüştür" size="sm">
        <Stack gap="md">
          <MantineText size="sm">
            DÖF kaydı oluşturuluyor... Bu uygunsuzluk Düzenleyici/Önleyici Faaliyet (DÖF) olarak işlenecek ve DÖF listesinden takip edebilirsiniz.
          </MantineText>
          {selectedItem && (
            <MantineText size="xs" c="dimmed">
              "{selectedItem.description.slice(0, 80)}{selectedItem.description.length > 80 ? '…' : ''}"
            </MantineText>
          )}
          <Group justify="flex-end">
            <Button variant="default" onClick={() => { closeDofModal(); setSelectedId(null); }}>İptal</Button>
            <Button leftSection={<IconArrowRight size={14} />} onClick={handleMarkAsConverted}>
              Dönüştür
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Manuel Ekle modal */}
      <Modal opened={addModalOpened} onClose={closeAddModal} title="Manuel uygunsuzluk ekle" size="md">
        <Stack gap="md">
          <Input.Wrapper label="Kaynak">
            <SegmentedControl
              value={addForm.source}
              onChange={(v) => setAddForm((f) => ({ ...f, source: v ?? f.source }))}
              data={[
                { value: 'Çalışan Bildirimi', label: 'Çalışan Bildirimi' },
                { value: 'Saha Gözlemi', label: 'Saha Gözlemi' },
                { value: 'Şikayet', label: 'Şikayet' },
              ]}
            />
          </Input.Wrapper>
          <Textarea
            label="Açıklama"
            placeholder="Uygunsuzluk detayı..."
            value={addForm.description}
            onChange={(e) => setAddForm((f) => ({ ...f, description: e.currentTarget.value }))}
            minRows={2}
            required
          />
          <Textarea
            label="Konum"
            placeholder="Örn: Depo A Girişi"
            value={addForm.location}
            onChange={(e) => setAddForm((f) => ({ ...f, location: e.currentTarget.value }))}
            required
          />
          <Input.Wrapper label="Risk seviyesi">
            <SegmentedControl
              value={addForm.riskLevel}
              onChange={(v) => setAddForm((f) => ({ ...f, riskLevel: (v as NonConformityRiskLevel) ?? f.riskLevel }))}
              data={[
                { value: 'Critical', label: 'Kritik' },
                { value: 'Major', label: 'Major' },
                { value: 'Minor', label: 'Minor' },
              ]}
            />
          </Input.Wrapper>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeAddModal}>İptal</Button>
            <Button onClick={handleManualAdd}>Ekle</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}

interface IssueCardProps {
  item: NonConformity;
  onQuickClose: () => void;
  onConvertToDof: () => void;
  dimmed: boolean;
}

function IssueCard({ item, onQuickClose, onConvertToDof, dimmed }: IssueCardProps) {
  const isOpen = item.status === 'Open';
  const borderColor = item.riskLevel === 'Critical' ? 'var(--mantine-color-red-6)' : undefined;

  return (
    <Card
      withBorder
      padding="md"
      radius="md"
      shadow="sm"
      style={{
        borderLeft: borderColor ? `4px solid ${borderColor}` : undefined,
        opacity: dimmed ? 0.75 : 1,
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" wrap="nowrap">
          <Badge color={RISK_COLORS[item.riskLevel]} size="sm" variant="filled">
            {RISK_LABELS[item.riskLevel]}
          </Badge>
          <MantineText size="xs" c="dimmed">
            {formatDate(item.detectedDate)}
          </MantineText>
        </Group>
        <MantineText size="sm" fw={600} lineClamp={1}>
          {item.location}
        </MantineText>
        <MantineText size="xs" c="dimmed">
          {item.source}
        </MantineText>

        <Box
          component="img"
          src={item.evidencePhoto}
          alt="Kanıt"
          style={{
            width: '100%',
            height: 120,
            objectFit: 'cover',
            borderRadius: 'var(--mantine-radius-sm)',
            backgroundColor: 'var(--mantine-color-gray-2)',
          }}
        />
        <MantineText size="sm" lineClamp={3}>
          {item.description}
        </MantineText>

        {item.closeNote && (
          <MantineText size="xs" c="green">
            Kapanış: {item.closeNote}
          </MantineText>
        )}
        {item.status === 'ConvertedToDOF' && (
          <Badge size="xs" color="blue" variant="light">DÖF'e dönüştürüldü</Badge>
        )}

        {isOpen && (
          <Group gap="xs" mt="xs">
            <Button
              size="xs"
              variant="light"
              color="green"
              leftSection={<IconCheck size={12} />}
              onClick={onQuickClose}
            >
              Hızlı Kapat
            </Button>
            <Button
              size="xs"
              variant="light"
              color="blue"
              leftSection={<IconArrowRight size={12} />}
              onClick={onConvertToDof}
            >
              DÖF Başlat
            </Button>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
