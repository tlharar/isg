import { useState, useMemo } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  SegmentedControl,
  Badge,
  ActionIcon,
  Modal,
  Select,
  Textarea,
  NumberInput,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconCheck, IconX, IconPackage } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { usePpeRequestStore, type PpeRequest, type PpeRequestStatus } from '@store/ppeRequestStore';
import { useWorkerStore } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';
import { PPE_TEMPLATES, useEquipmentStore } from '@store/equipmentStore';
import { usePpeStore } from '@domains/ppe/stores/ppeStore';

type StatusFilter = 'all' | 'pending' | 'approved';

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getStatusBadge(status: PpeRequestStatus) {
  const map: Record<PpeRequestStatus, { color: string; label: string }> = {
    Pending: { color: 'yellow', label: 'Bekliyor' },
    Approved: { color: 'blue', label: 'Onaylandı' },
    Rejected: { color: 'red', label: 'Reddedildi' },
    Completed: { color: 'green', label: 'Teslim Edildi' },
  };
  const { color, label } = map[status];
  return <Badge color={color} size="sm">{label}</Badge>;
}

export function PpeRequestPage() {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const workers = useWorkerStore((s) => s.workers);
  const requests = usePpeRequestStore((s) => s.requests);
  const addRequest = usePpeRequestStore((s) => s.addRequest);
  const updateStatus = usePpeRequestStore((s) => s.updateStatus);
  const findEquipmentByName = useEquipmentStore((s) => s.findEquipmentByName);
  const decrementStock = useEquipmentStore((s) => s.decrementStock);
  const addRecord = usePpeStore((s) => s.addRecord);

  const [filter, setFilter] = useState<StatusFilter>('all');
  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [form, setForm] = useState({
    employeeId: '',
    equipmentName: '',
    quantity: 1,
    urgency: 'Normal' as 'Normal' | 'High',
    description: '',
  });

  const workerOptions = useMemo(() => {
    let list = workers;
    if (selectedCompanyId) list = list.filter((w) => w.companyId === selectedCompanyId);
    return list.map((w) => ({ value: w.id, label: w.nameSurname }));
  }, [workers, selectedCompanyId]);

  const equipmentOptions = PPE_TEMPLATES.map((name) => ({ value: name, label: name }));

  const filteredRequests = useMemo(() => {
    if (filter === 'pending') return requests.filter((r) => r.status === 'Pending');
    if (filter === 'approved') return requests.filter((r) => r.status === 'Approved');
    return requests;
  }, [requests, filter]);

  const handleApprove = (r: PpeRequest) => {
    updateStatus(r.id, 'Approved');
    notifications.show({
      title: 'Talep onaylandı',
      message: 'Malzeme hazırlayınız.',
      color: 'green',
    });
  };

  const handleReject = (r: PpeRequest) => {
    updateStatus(r.id, 'Rejected');
    notifications.show({
      title: 'Talep reddedildi',
      message: 'Talep reddedildi.',
      color: 'red',
    });
  };

  const handleDeliver = (r: PpeRequest) => {
    const worker = workers.find((w) => w.id === r.employeeId);
    const companyId = worker?.companyId ?? selectedCompanyId ?? undefined;
    const equip = findEquipmentByName(r.equipmentName, companyId);
    if (!equip) {
      notifications.show({
        title: 'Ekipman bulunamadı',
        message: `Envanterde "${r.equipmentName}" bulunamadı. Stok kaydı ekleyin veya isim eşleşmesini kontrol edin.`,
        color: 'red',
      });
      return;
    }
    if (equip.currentStock < r.quantity) {
      notifications.show({
        title: 'Yetersiz stok',
        message: `${r.equipmentName}: Mevcut ${equip.currentStock}, talep ${r.quantity}.`,
        color: 'red',
      });
      return;
    }
    decrementStock(equip.id, r.quantity);
    const today = new Date().toISOString().slice(0, 10);
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    addRecord({
      employeeId: r.employeeId,
      equipment: r.equipmentName,
      dateGiven: today,
      nextRenewalDate: nextYear,
    });
    updateStatus(r.id, 'Completed');
    notifications.show({
      title: 'Teslim edildi',
      message: 'Stoktan düşüldü ve zimmet kaydı otomatik oluşturuldu.',
      color: 'green',
    });
  };

  const handleSubmitRequest = () => {
    const worker = workers.find((w) => w.id === form.employeeId);
    if (!form.employeeId || !form.equipmentName.trim() || !worker) return;
    addRequest({
      employeeId: form.employeeId,
      employeeName: worker.nameSurname,
      equipmentName: form.equipmentName.trim(),
      quantity: Math.max(1, form.quantity),
      requestDate: new Date().toISOString().slice(0, 10),
      urgency: form.urgency,
      status: 'Pending',
      description: form.description.trim(),
    });
    setForm({ employeeId: '', equipmentName: '', quantity: 1, urgency: 'Normal', description: '' });
    closeModal();
  };

  return (
    <>
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Title order={2}>KKD Talepleri</Title>
            <MantineText c="dimmed" size="sm">
              Personel ekipman taleplerini yönetin ve onay akışını takip edin.
            </MantineText>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={openModal}>
            Yeni Talep Oluştur
          </Button>
        </Group>

        <Paper withBorder p="md">
          <SegmentedControl
            value={filter}
            onChange={(v) => setFilter(v as StatusFilter)}
            data={[
              { value: 'all', label: 'Tümü' },
              { value: 'pending', label: 'Bekleyenler' },
              { value: 'approved', label: 'Onaylananlar' },
            ]}
            mb="md"
          />
          <Table.ScrollContainer minWidth={700}>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Personel</Table.Th>
                  <Table.Th>Talep Edilen</Table.Th>
                  <Table.Th>Tarih</Table.Th>
                  <Table.Th>Aciliyet</Table.Th>
                  <Table.Th>Durum</Table.Th>
                  <Table.Th>İşlemler</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredRequests.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={6}>
                      <MantineText size="sm" c="dimmed" ta="center" py="md">
                        Bu filtrede talep bulunamadı.
                      </MantineText>
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  filteredRequests.map((r) => (
                    <Table.Tr key={r.id}>
                      <Table.Td>
                        <MantineText fw={600}>{r.employeeName}</MantineText>
                      </Table.Td>
                      <Table.Td>
                        {r.equipmentName} × {r.quantity}
                      </Table.Td>
                      <Table.Td>{formatDate(r.requestDate)}</Table.Td>
                      <Table.Td>
                        <Badge size="sm" color={r.urgency === 'High' ? 'red' : 'gray'}>
                          {r.urgency === 'High' ? 'Acil' : 'Normal'}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{getStatusBadge(r.status)}</Table.Td>
                      <Table.Td>
                        <Group gap="xs">
                          {r.status === 'Pending' && (
                            <>
                              <ActionIcon
                                variant="light"
                                color="green"
                                size="sm"
                                onClick={() => handleApprove(r)}
                                aria-label="Onayla"
                              >
                                <IconCheck size={16} />
                              </ActionIcon>
                              <ActionIcon
                                variant="light"
                                color="red"
                                size="sm"
                                onClick={() => handleReject(r)}
                                aria-label="Reddet"
                              >
                                <IconX size={16} />
                              </ActionIcon>
                            </>
                          )}
                          {r.status === 'Approved' && (
                            <ActionIcon
                              variant="light"
                              color="blue"
                              size="sm"
                              onClick={() => handleDeliver(r)}
                              aria-label="Teslim et"
                            >
                              <IconPackage size={16} />
                            </ActionIcon>
                          )}
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))
                )}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        </Paper>
      </Stack>

      <Modal opened={modalOpened} onClose={closeModal} title="Yeni Talep Oluştur" size="md">
        <Stack gap="md">
          <Select
            label="Personel"
            placeholder="Personel seçin"
            data={workerOptions}
            value={form.employeeId || null}
            onChange={(v) => setForm((f) => ({ ...f, employeeId: v ?? '' }))}
            searchable
            required
          />
          <Select
            label="Ekipman"
            placeholder="Ekipman seçin"
            data={equipmentOptions}
            value={form.equipmentName || null}
            onChange={(v) => setForm((f) => ({ ...f, equipmentName: v ?? '' }))}
            searchable
            required
          />
          <NumberInput
            label="Adet"
            min={1}
            value={form.quantity}
            onChange={(v) => setForm((f) => ({ ...f, quantity: typeof v === 'number' ? v : 1 }))}
          />
          <SegmentedControl
            label="Aciliyet"
            value={form.urgency}
            onChange={(v) => setForm((f) => ({ ...f, urgency: v as 'Normal' | 'High' }))}
            data={[
              { value: 'Normal', label: 'Normal' },
              { value: 'High', label: 'Acil' },
            ]}
          />
          <Textarea
            label="Açıklama / Gerekçe"
            placeholder="Örn: Eskisi yırtıldı"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.currentTarget.value }))}
            minRows={2}
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={closeModal}>
              İptal
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={!form.employeeId || !form.equipmentName.trim()}
            >
              Talep Oluştur
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
