import { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  Badge,
  ActionIcon,
  Box,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus, IconEdit, IconTrash, IconFileText, IconAlertTriangle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import {
  useRepresentativeStore,
  type Representative,
  getRepresentativeStatus,
  type SelectionMethod,
} from '@store/representativeStore';
import { useCompanyStore } from '@store/companyStore';
import { useAppStore } from '@shared/stores/appStore';
import { RepresentativeModal } from '@domains/company/components/RepresentativeModal';

function formatDate(d: Date): string {
  const date = new Date(d);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function getMethodBadgeColor(method: SelectionMethod): string {
  return method === 'Seçim' ? 'blue' : 'violet';
}

export function RepresentativePage() {
  const { t } = useTranslation();
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const fetchByCompany = useRepresentativeStore((s) => s.fetchByCompany);
  const deleteRepresentative = useRepresentativeStore((s) => s.deleteRepresentative);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const company = useMemo(
    () => (selectedCompanyId ? getCompanyById(selectedCompanyId) : null),
    [selectedCompanyId, getCompanyById]
  );

  const representatives = useMemo(
    () => (selectedCompanyId ? fetchByCompany(selectedCompanyId) : []),
    [selectedCompanyId, fetchByCompany]
  );

  const handleAdd = () => {
    setEditingId(null);
    openModal();
  };

  const handleEdit = (rep: Representative) => {
    setEditingId(rep.id);
    openModal();
  };

  const handleDelete = (rep: Representative) => {
    if (window.confirm(t('representatives.deleteConfirm'))) {
      deleteRepresentative(rep.id);
      notifications.show({
        title: t('representatives.deleteSuccess'),
        message: t('representatives.deleteSuccessMessage'),
        color: 'green',
      });
    }
  };

  const handleDownloadMinutes = () => {
    if (representatives.length === 0) return;

    notifications.show({
      title: t('representatives.tutanakDownload'),
      message: 'Tutanak hazırlanıyor...',
      color: 'blue',
      autoClose: 2000,
    });

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const companyName = company?.name ?? 'Firma';
    const dateStr = new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Header: Company name and date
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(companyName, 14, 16);
    doc.text(dateStr, pageWidth - 14, 16, { align: 'right' });

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ÇALIŞAN TEMSİLCİSİ SEÇİM TUTANAĞI', pageWidth / 2, 28, { align: 'center' });

    // Body statement
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const bodyText =
      'İşyerimizde yapılan seçim/atama sonucunda aşağıda isimleri belirtilen çalışanlar, İş Sağlığı ve Güvenliği Çalışan Temsilcisi olarak belirlenmiştir.';
    const bodyLines = doc.splitTextToSize(bodyText, pageWidth - 28);
    doc.text(bodyLines, 14, 40);

    // Table: representatives (Name, Görev/Unvan)
    const tableData = representatives.map((rep) => [rep.employeeName, rep.jobTitle ?? '—']);
    autoTable(doc, {
      head: [['Ad Soyad', 'Görev / Unvan']],
      body: tableData,
      startY: 52,
      margin: { left: 14, right: 14 },
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 66, 66] },
      columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 'auto' } },
    });

    const tableEndY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 60;

    // Footer: Signatures section
    const footerY = Math.min(tableEndY + 24, 250);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lineY = footerY + 18;
    doc.line(14, lineY, 60, lineY);
    doc.line(80, lineY, 126, lineY);
    doc.line(140, lineY, 186, lineY);
    doc.setFontSize(9);
    doc.text('İşveren', 37, lineY + 6, { align: 'center' });
    doc.text('İSG Uzmanı', 103, lineY + 6, { align: 'center' });
    doc.text('Temsilci', 163, lineY + 6, { align: 'center' });

    const filename = `${companyName.replace(/\s+/g, '_')}_Temsilci_Tutanagi.pdf`;
    doc.save(filename);

    notifications.show({
      title: t('representatives.tutanakDownload'),
      message: t('representatives.tutanakDownloadMessage'),
      color: 'green',
    });
  };

  const handleModalClose = () => {
    setEditingId(null);
    closeModal();
  };

  if (!selectedCompanyId) {
    return (
      <Stack align="center" p="xl" gap="md">
        <IconAlertTriangle size={48} color="var(--mantine-color-amber-5)" />
        <Text c="dimmed" size="sm" ta="center">
          {t('representatives.noCompanySelected')}
        </Text>
      </Stack>
    );
  }

  return (
    <>
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Box>
            <Title order={2}>{t('representatives.title')}</Title>
            <Text c="dimmed" size="sm" mt={4}>
              {company ? `${company.name} - ${t('representatives.subtitle')}` : t('representatives.subtitle')}
            </Text>
          </Box>
          <Group gap="sm" wrap="wrap">
            <Button
              leftSection={<IconFileText size={18} />}
              variant="light"
              color="blue"
              onClick={handleDownloadMinutes}
              disabled={representatives.length === 0}
            >
              {t('representatives.downloadTutanak')}
            </Button>
            <Button leftSection={<IconPlus size={18} />} color="teal" onClick={handleAdd}>
              {t('representatives.buttonAdd')}
            </Button>
          </Group>
        </Group>

        <Paper withBorder>
          {representatives.length === 0 ? (
            <Stack align="center" p="xl" gap="md">
              <IconAlertTriangle size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" size="sm" ta="center">
                {t('representatives.noItems')}
              </Text>
              <Text c="dimmed" size="sm" ta="center" fw={500}>
                {t('representatives.noItemsHint')}
              </Text>
              <Button variant="light" leftSection={<IconPlus size={18} />} onClick={handleAdd}>
                {t('representatives.buttonAddFirst')}
              </Button>
            </Stack>
          ) : (
            <Table.ScrollContainer minWidth={900}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('representatives.table.name')}</Table.Th>
                    <Table.Th>{t('representatives.table.jobTitle')}</Table.Th>
                    <Table.Th>{t('representatives.table.method')}</Table.Th>
                    <Table.Th>{t('representatives.table.term')}</Table.Th>
                    <Table.Th>{t('representatives.table.status')}</Table.Th>
                    <Table.Th>{t('representatives.table.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {representatives.map((rep) => {
                    const status = getRepresentativeStatus(rep.validUntil);
                    const isExpired = status === 'Pasif';
                    return (
                      <Table.Tr
                        key={rep.id}
                        style={{ opacity: isExpired ? 0.8 : 1 }}
                      >
                        <Table.Td>
                          <Text size="sm" fw={600}>
                            {rep.employeeName}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">{rep.jobTitle || '—'}</Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getMethodBadgeColor(rep.selectionMethod)} size="sm">
                            {rep.selectionMethod}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm">
                            {formatDate(rep.selectionDate)} – {formatDate(rep.validUntil)}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge color={status === 'Aktif' ? 'green' : 'gray'} size="sm">
                            {status === 'Aktif'
                              ? t('representatives.statusActive')
                              : t('representatives.statusPassive')}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={handleDownloadMinutes}
                              aria-label={t('representatives.downloadTutanak')}
                              title={t('representatives.downloadTutanak')}
                            >
                              <IconFileText size={18} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="blue"
                              onClick={() => handleEdit(rep)}
                              aria-label={t('common.edit')}
                            >
                              <IconEdit size={18} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDelete(rep)}
                              aria-label={t('common.delete')}
                            >
                              <IconTrash size={18} />
                            </ActionIcon>
                          </Group>
                        </Table.Td>
                      </Table.Tr>
                    );
                  })}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Paper>
      </Stack>

      {selectedCompanyId && (
        <RepresentativeModal
          opened={modalOpened}
          onClose={handleModalClose}
          companyId={selectedCompanyId}
          editRepresentativeId={editingId}
        />
      )}
    </>
  );
}
