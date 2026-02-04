import { useState, useRef, useCallback } from 'react';
import * as htmlToImage from 'html-to-image';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Paper,
  Box,
  FileButton,
  Tooltip,
  Slider,
  SegmentedControl,
  ActionIcon,
  Modal,
  TextInput,
  Select,
  Drawer,
  Card,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconUpload,
  IconDeviceFloppy,
  IconFlame,
  IconFireHydrant,
  IconBellRinging,
  IconRun,
  IconFirstAidKit,
  IconBolt,
  IconUsers,
  IconMapPin,
  IconRotateClockwise2,
  IconTrash,
  IconArchive,
  IconDownload,
  IconFolderOpen,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useFloorPlanStore,
  generatePlanId,
  type FloorPlanMarker,
  type MarkerType,
  type MarkerSize,
  type SavedPlan,
} from '@store/floorPlanStore';

const MOCK_COMPANIES = [
  { value: 'abc', label: 'ABC Lojistik' },
  { value: 'xyz', label: 'XYZ İnşaat' },
];

type IconComponent = typeof IconFlame;

const MARKER_CONFIG: Record<
  MarkerType,
  { label: string; Icon: IconComponent; color: string }
> = {
  fire_extinguisher: { label: 'Yangın Tüpü', Icon: IconFlame, color: 'red' },
  fire_hose: { label: 'Yangın Dolabı', Icon: IconFireHydrant, color: 'red' },
  alarm_button: { label: 'Alarm Butonu', Icon: IconBellRinging, color: 'orange' },
  emergency_exit: { label: 'Acil Çıkış', Icon: IconRun, color: 'green' },
  first_aid: { label: 'İlk Yardım', Icon: IconFirstAidKit, color: 'teal' },
  electrical_panel: { label: 'Elektrik Panosu', Icon: IconBolt, color: 'yellow' },
  assembly_point: { label: 'Toplanma Alanı', Icon: IconUsers, color: 'blue' },
  you_are_here: { label: 'Buradasınız', Icon: IconMapPin, color: 'red' },
};

const TOOLBAR_GROUPS: { groupLabel: string; types: MarkerType[] }[] = [
  { groupLabel: 'Yangın', types: ['fire_extinguisher', 'fire_hose', 'alarm_button'] },
  { groupLabel: 'Kaçış', types: ['emergency_exit', 'you_are_here'] },
  { groupLabel: 'Diğer', types: ['first_aid', 'electrical_panel', 'assembly_point'] },
];

const SIZE_SCALE: Record<MarkerSize, number> = {
  small: 0.7,
  medium: 1,
  large: 1.3,
};

const LEGACY_TYPE_MAP: Record<string, MarkerType> = {
  fire: 'fire_extinguisher',
  exit: 'emergency_exit',
  firstaid: 'first_aid',
  assembly: 'assembly_point',
};

function getMarkerConfig(type: string): { label: string; Icon: IconComponent; color: string } {
  const normalized = LEGACY_TYPE_MAP[type] ?? (type as MarkerType);
  if (normalized in MARKER_CONFIG) return MARKER_CONFIG[normalized as MarkerType];
  return MARKER_CONFIG.fire_extinguisher;
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return Number.isNaN(d.getTime())
    ? dateStr
    : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function FloorPlanPage() {
  const imageDataUrl = useFloorPlanStore((s) => s.imageDataUrl);
  const markers = useFloorPlanStore((s) => s.markers);
  const savedPlans = useFloorPlanStore((s) => s.savedPlans);
  const setImage = useFloorPlanStore((s) => s.setImage);
  const addMarker = useFloorPlanStore((s) => s.addMarker);
  const removeMarker = useFloorPlanStore((s) => s.removeMarker);
  const updateMarkerRotation = useFloorPlanStore((s) => s.updateMarkerRotation);
  const updateMarkerSize = useFloorPlanStore((s) => s.updateMarkerSize);
  const clearAll = useFloorPlanStore((s) => s.clearAll);
  const savePlan = useFloorPlanStore((s) => s.savePlan);
  const deletePlan = useFloorPlanStore((s) => s.deletePlan);
  const loadPlanToEditor = useFloorPlanStore((s) => s.loadPlanToEditor);

  const [selectedType, setSelectedType] = useState<MarkerType>('fire_extinguisher');
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);
  const planContainerRef = useRef<HTMLDivElement>(null);

  const [saveModalOpened, { open: openSaveModal, close: closeSaveModal }] = useDisclosure(false);
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] = useDisclosure(false);
  const [savePlanName, setSavePlanName] = useState('');
  const [saveCompanyId, setSaveCompanyId] = useState<string | null>(null);

  const selectedMarker = selectedMarkerId
    ? markers.find((m) => m.id === selectedMarkerId)
    : null;

  const handleFileUpload = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) {
      notifications.show({ title: 'Geçersiz dosya', message: 'Bir resim dosyası seçin.', color: 'red' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setImage(reader.result as string);
      notifications.show({ title: 'Kroki yüklendi', message: 'Haritaya tıklayarak ikon ekleyin.', color: 'green' });
    };
    reader.readAsDataURL(file);
  };

  const handleImageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      addMarker(x, y, selectedType);
    },
    [addMarker, selectedType]
  );

  const handleMarkerClick = useCallback((e: React.MouseEvent, marker: FloorPlanMarker) => {
    e.stopPropagation();
    setSelectedMarkerId((id) => (id === marker.id ? null : marker.id));
  }, []);

  const handleRotate = useCallback(
    (delta: number) => {
      if (!selectedMarker) return;
      const current = selectedMarker.rotation ?? 0;
      updateMarkerRotation(selectedMarker.id, current + delta);
    },
    [selectedMarker, updateMarkerRotation]
  );

  const handleSizeChange = useCallback(
    (size: MarkerSize) => {
      if (!selectedMarker) return;
      updateMarkerSize(selectedMarker.id, size);
    },
    [selectedMarker, updateMarkerSize]
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedMarkerId) return;
    removeMarker(selectedMarkerId);
    setSelectedMarkerId(null);
  }, [selectedMarkerId, removeMarker]);

  const handleClearAll = () => {
    if (window.confirm('Tüm kroki ve işaretler silinsin mi?')) {
      clearAll();
      setSelectedMarkerId(null);
      notifications.show({ title: 'Temizlendi', message: 'Kroki ve işaretler kaldırıldı.', color: 'gray' });
    }
  };

  const handleSaveClick = () => {
    if (!imageDataUrl) return;
    setSavePlanName('');
    setSaveCompanyId(MOCK_COMPANIES[0]?.value ?? null);
    openSaveModal();
  };

  const handleSaveConfirm = () => {
    const name = savePlanName.trim();
    if (!name) {
      notifications.show({ title: 'Eksik alan', message: 'Plan adı girin.', color: 'red' });
      return;
    }
    const company = MOCK_COMPANIES.find((c) => c.value === saveCompanyId);
    if (!company) {
      notifications.show({ title: 'Eksik alan', message: 'Şirket seçin.', color: 'red' });
      return;
    }
    const plan: SavedPlan = {
      id: generatePlanId(),
      companyId: company.value,
      companyName: company.label,
      name,
      date: new Date().toISOString().slice(0, 10),
      backgroundImage: imageDataUrl,
      icons: markers,
    };
    savePlan(plan);
    closeSaveModal();
    notifications.show({
      title: 'Kaydedildi',
      message: 'Kroki başarıyla kaydedildi.',
      color: 'green',
    });
  };

  const handleLoadPlan = (plan: SavedPlan) => {
    loadPlanToEditor(plan);
    setSelectedMarkerId(null);
    closeDrawer();
    notifications.show({
      title: 'Yüklendi',
      message: `"${plan.name}" krokisi düzenlemek için yüklendi.`,
      color: 'green',
    });
  };

  const handleCompositeDownload = useCallback(async () => {
    if (!planContainerRef.current) {
      notifications.show({
        title: 'Hata',
        message: 'Görüntü alanı bulunamadı.',
        color: 'red',
      });
      return;
    }
    notifications.show({
      title: 'Hazırlanıyor',
      message: 'Görüntü hazırlanıyor...',
      color: 'blue',
      autoClose: 2000,
    });
    try {
      const dataUrl = await htmlToImage.toPng(planContainerRef.current, {
        quality: 0.95,
        backgroundColor: 'white',
      });
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'Duzenlenmis_Kroki.png';
      link.click();
      link.remove();
      notifications.show({
        title: 'İndirildi',
        message: 'Düzenlenmiş kroki (arka plan + ikonlar) indirildi.',
        color: 'green',
      });
    } catch (err) {
      notifications.show({
        title: 'Hata',
        message: 'Görüntü oluşturulurken bir hata oluştu.',
        color: 'red',
      });
    }
  }, []);

  const handleDownloadPlan = (plan: SavedPlan) => {
    notifications.show({
      title: 'Kayıtlı plan',
      message: `"${plan.name}" isimli planı indirmek için önce planı yükleyin, ardından ana ekrandan indirin.`,
      color: 'blue',
    });
  };

  const handleDeletePlan = (plan: SavedPlan) => {
    if (!window.confirm(`"${plan.name}" krokisini silmek istediğinize emin misiniz?`)) return;
    deletePlan(plan.id);
    notifications.show({
      title: 'Silindi',
      message: 'Kroki listeden kaldırıldı.',
      color: 'gray',
    });
  };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Title order={2}>Kroki Ekle</Title>
          <MantineText c="dimmed" size="sm">
            Kat planı yükleyin ve tahliye planı ikonlarını yerleştirin.
          </MantineText>
        </div>
        <Group>
          <FileButton onChange={handleFileUpload} accept="image/png,image/jpeg,image/webp,image/gif">
            {(props) => (
              <Button {...props} leftSection={<IconUpload size={16} />}>
                Kroki Yükle
              </Button>
            )}
          </FileButton>
          <Button
            leftSection={<IconDeviceFloppy size={16} />}
            onClick={handleSaveClick}
            disabled={!imageDataUrl}
          >
            Kaydet
          </Button>
          {imageDataUrl && (
            <Button
              variant="default"
              leftSection={<IconDownload size={16} />}
              onClick={handleCompositeDownload}
            >
              İndir
            </Button>
          )}
          <Button
            variant="default"
            leftSection={<IconArchive size={16} />}
            onClick={openDrawer}
          >
            Arşiv / Kayıtlı Dosyalar
          </Button>
          {imageDataUrl && (
            <Button variant="default" color="red" onClick={handleClearAll}>
              Temizle
            </Button>
          )}
        </Group>
      </Group>

      <Modal
        title="Kroki Kaydet"
        opened={saveModalOpened}
        onClose={closeSaveModal}
        centered
      >
        <Stack gap="md">
          <TextInput
            label="Plan Adı"
            placeholder="Örn. Zemin Kat Tahliye Planı"
            value={savePlanName}
            onChange={(e) => setSavePlanName(e.currentTarget.value)}
          />
          <Select
            label="Şirket"
            placeholder="Şirket seçin"
            data={MOCK_COMPANIES}
            value={saveCompanyId}
            onChange={setSaveCompanyId}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeSaveModal}>
              İptal
            </Button>
            <Button onClick={handleSaveConfirm} leftSection={<IconDeviceFloppy size={16} />}>
              Kaydet
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Drawer
        title="Kayıtlı Krokiler"
        position="right"
        opened={drawerOpened}
        onClose={closeDrawer}
        size="md"
      >
        <Stack gap="md">
          {savedPlans.length === 0 ? (
            <MantineText c="dimmed" size="sm">
              Henüz kayıtlı kroki yok. Kroki oluşturup &quot;Kaydet&quot; ile kaydedin.
            </MantineText>
          ) : (
            savedPlans.map((plan) => (
              <Card key={plan.id} withBorder padding="md" radius="md">
                <Stack gap="xs">
                  <MantineText fw={600} size="sm">
                    {plan.name}
                  </MantineText>
                  <MantineText size="xs" c="dimmed">
                    {plan.companyName} · {formatDisplayDate(plan.date)}
                  </MantineText>
                  <Group gap="xs" mt="xs">
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconFolderOpen size={14} />}
                      onClick={() => handleLoadPlan(plan)}
                    >
                      Yükle
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      leftSection={<IconDownload size={14} />}
                      onClick={() => handleDownloadPlan(plan)}
                      disabled={!plan.backgroundImage}
                    >
                      İndir
                    </Button>
                    <Button
                      size="xs"
                      variant="light"
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => handleDeletePlan(plan)}
                    >
                      Sil
                    </Button>
                  </Group>
                </Stack>
              </Card>
            ))
          )}
        </Stack>
      </Drawer>

      <Group align="flex-start" wrap="nowrap" gap="lg" style={{ alignItems: 'stretch' }}>
        {/* Sticky Toolbar */}
        <Paper
          withBorder
          p="md"
          w={220}
          style={{
            flexShrink: 0,
            position: 'sticky',
            top: 16,
            alignSelf: 'flex-start',
          }}
        >
          <MantineText size="sm" fw={600} mb="xs">
            İkon seçin
          </MantineText>
          {TOOLBAR_GROUPS.map(({ groupLabel, types }) => (
            <Stack key={groupLabel} gap={4} mb="sm">
              <MantineText size="xs" c="dimmed" fw={500}>
                {groupLabel}
              </MantineText>
              <Stack gap={4}>
                {types.map((type) => {
                  const { label, Icon, color } = MARKER_CONFIG[type];
                  return (
                    <Tooltip key={type} label={label} position="right">
                      <Button
                        variant={selectedType === type ? 'filled' : 'light'}
                        color={color}
                        size="xs"
                        leftSection={<Icon size={16} />}
                        onClick={() => setSelectedType(type)}
                        fullWidth
                      >
                        {label}
                      </Button>
                    </Tooltip>
                  );
                })}
              </Stack>
            </Stack>
          ))}

          {/* Selection controls */}
          {selectedMarker && (
            <Stack gap="xs" mt="md" pt="md" style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}>
              <MantineText size="xs" fw={600}>
                Seçili işaret
              </MantineText>
              <MantineText size="xs" c="dimmed">
                Döndür
              </MantineText>
              <Group gap={4}>
                <ActionIcon variant="light" size="sm" onClick={() => handleRotate(-90)} title="-90°">
                  <IconRotateClockwise2 size={14} style={{ transform: 'scaleX(-1)' }} />
                </ActionIcon>
                <Slider
                  size="xs"
                  min={0}
                  max={360}
                  value={selectedMarker.rotation ?? 0}
                  onChange={(v) => updateMarkerRotation(selectedMarker.id, v)}
                  style={{ flex: 1 }}
                />
                <ActionIcon variant="light" size="sm" onClick={() => handleRotate(90)} title="+90°">
                  <IconRotateClockwise2 size={14} />
                </ActionIcon>
              </Group>
              <MantineText size="xs" c="dimmed">
                Boyut
              </MantineText>
              <SegmentedControl
                size="xs"
                data={[
                  { label: 'Küçük', value: 'small' },
                  { label: 'Orta', value: 'medium' },
                  { label: 'Büyük', value: 'large' },
                ]}
                value={selectedMarker.size ?? 'medium'}
                onChange={(v) => handleSizeChange(v as MarkerSize)}
              />
              <Button
                variant="light"
                color="red"
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={handleDeleteSelected}
              >
                İşareti sil
              </Button>
            </Stack>
          )}

          {!selectedMarker && imageDataUrl && (
            <MantineText size="xs" c="dimmed" mt="md">
              Haritaya tıklayarak ikon ekleyin. İşarete tıklayıp döndürme ve boyut ayarlayın.
            </MantineText>
          )}
        </Paper>

        {/* Image + markers */}
        <Paper withBorder p="md" style={{ flex: 1, minHeight: 400, overflow: 'auto' }}>
          {!imageDataUrl ? (
            <Box
              style={{
                minHeight: 360,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--mantine-color-gray-1)',
                borderRadius: 'var(--mantine-radius-md)',
                border: '2px dashed var(--mantine-color-gray-4)',
              }}
            >
              <Stack align="center" gap="xs">
                <IconUpload size={48} style={{ color: 'var(--mantine-color-gray-5)' }} />
                <MantineText c="dimmed" size="sm">
                  Kroki yüklemek için &quot;Kroki Yükle&quot; butonunu kullanın
                </MantineText>
              </Stack>
            </Box>
          ) : (
            <Box
              ref={planContainerRef}
              onClick={handleImageClick}
              style={{
                position: 'relative',
                display: 'inline-block',
                maxWidth: '100%',
                cursor: 'crosshair',
              }}
            >
              <img
                src={imageDataUrl}
                alt="Kat planı"
                style={{
                  display: 'block',
                  maxWidth: '100%',
                  height: 'auto',
                  verticalAlign: 'middle',
                }}
              />
              {markers.map((marker) => {
                const config = getMarkerConfig(marker.type);
                const { Icon, color } = config;
                const rotation = marker.rotation ?? 0;
                const scale = SIZE_SCALE[marker.size ?? 'medium'];
                const isSelected = marker.id === selectedMarkerId;
                return (
                  <Box
                    key={marker.id}
                    onClick={(e) => handleMarkerClick(e, marker)}
                    style={{
                      position: 'absolute',
                      left: `${marker.x}%`,
                      top: `${marker.y}%`,
                      transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${scale})`,
                      cursor: 'pointer',
                      padding: 4,
                      borderRadius: 'var(--mantine-radius-sm)',
                      background: 'var(--mantine-color-white)',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                      border: `2px solid var(--mantine-color-${color}-6)`,
                      outline: isSelected ? `3px solid var(--mantine-color-blue-5)` : 'none',
                      outlineOffset: 2,
                    }}
                    title={config.label}
                  >
                    <Icon size={28} color={`var(--mantine-color-${color}-6)`} />
                  </Box>
                );
              })}
            </Box>
          )}
        </Paper>
      </Group>
    </Stack>
  );
}
