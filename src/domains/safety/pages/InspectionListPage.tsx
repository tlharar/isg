import { useState, useMemo } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  Modal,
  Select,
  TextInput,
  Badge,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconClipboardList } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useInspectionStore, INSPECTION_TEMPLATES, type Inspection } from '@store/inspectionStore';
import { useAppStore } from '@shared/stores/appStore';
import { notifications } from '@mantine/notifications';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getScoreBadge(score: number) {
  let color: string;
  let label: string;
  if (score >= 80) {
    color = 'green';
    label = 'Güvenli';
  } else if (score >= 50) {
    color = 'yellow';
    label = 'Riskli';
  } else {
    color = 'red';
    label = 'Tehlikeli';
  }
  return { color, label };
}

export function InspectionListPage() {
  const navigate = useNavigate();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const inspections = useInspectionStore((s) => s.inspections);
  const startInspection = useInspectionStore((s) => s.startInspection);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [templateKey, setTemplateKey] = useState<string | null>(null);
  const [auditor, setAuditor] = useState('');

  const companyInspections = useMemo(() => {
    if (!selectedCompanyId) return inspections;
    return inspections.filter((i) => i.companyId === selectedCompanyId);
  }, [inspections, selectedCompanyId]);

  const templateOptions = useMemo(
    () => INSPECTION_TEMPLATES.map((t) => ({ value: t.key, label: `${t.name} (${t.category})` })),
    []
  );

  const handleStart = () => {
    const companyId = selectedCompanyId ?? '';
    const auditorName = auditor.trim() || 'Denetçi';
    if (!companyId) {
      notifications.show({
        title: 'Şirket gerekli',
        message: 'Denetim başlatmak için lütfen bir şirket seçin.',
        color: 'red',
      });
      return;
    }
    if (!templateKey) {
      notifications.show({
        title: 'Şablon seçin',
        message: 'Bir denetim şablonu seçin.',
        color: 'red',
      });
      return;
    }
    try {
      const inspection = startInspection(companyId, auditorName, templateKey);
      closeModal();
      setTemplateKey(null);
      setAuditor('');
      navigate(`/safety/audit/inspections/${inspection.id}`);
    } catch (e) {
      notifications.show({
        title: 'Hata',
        message: e instanceof Error ? e.message : 'Denetim başlatılamadı.',
        color: 'red',
      });
    }
  };

  const handleConduct = (inspection: Inspection) => {
    if (inspection.completed) return;
    navigate(`/safety/audit/inspections/${inspection.id}`);
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>Saha Denetimi</Title>
            <MantineText c="dimmed" size="sm">
              Denetim listeleri ile saha kontrolleri yapın ve skorları takip edin.
            </MantineText>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
            Yeni Denetim Başlat
          </Button>
        </Group>

        <Paper withBorder>
          <Table.ScrollContainer minWidth={600}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tarih</Table.Th>
                  <Table.Th>Şablon</Table.Th>
                  <Table.Th>Denetçi</Table.Th>
                  <Table.Th>Skor</Table.Th>
                  <Table.Th>İşlem</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {companyInspections.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5}>
                      <MantineText size="sm" c="dimmed" ta="center" py="md">
                        Henüz denetim yok. Yeni denetim başlatın.
                      </MantineText>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  companyInspections.map((ins) => {
                    const { color, label } = getScoreBadge(ins.score);
                    return (
                      <Table.Tr key={ins.id}>
                        <Table.Td>{formatDate(ins.date)}</Table.Td>
                        <Table.Td>{ins.templateName}</Table.Td>
                        <Table.Td>{ins.auditor}</Table.Td>
                        <Table.Td>
                          <Badge color={color} size="sm" variant="light">
                            {ins.score} · {label}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {!ins.completed ? (
                            <Button
                              size="xs"
                              variant="light"
                              leftSection={<IconClipboardList size={14} />}
                              onClick={() => handleConduct(ins)}
                            >
                              Doldur
                            </Button>
                          ) : (
                            <MantineText size="xs" c="dimmed">Tamamlandı</MantineText>
                          )}
                        </Table.Td>
                      </Table.Tr>
                    );
                  })
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Stack>

      <Modal opened={modalOpened} onClose={closeModal} title="Yeni Denetim Başlat" size="sm">
        <Stack gap="md">
          <Select
            label="Denetim şablonu"
            placeholder="Şablon seçin"
            data={templateOptions}
            value={templateKey}
            onChange={setTemplateKey}
            required
          />
          <TextInput
            label="Denetçi adı"
            placeholder="Ad Soyad"
            value={auditor}
            onChange={(e) => setAuditor(e.currentTarget.value)}
          />
          {!selectedCompanyId && (
            <MantineText size="sm" c="orange">
              Üst menüden şirket seçin; aksi halde denetim şirket atanmadan oluşturulur.
            </MantineText>
          )}
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeModal}>İptal</Button>
            <Button onClick={handleStart}>Başlat</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
