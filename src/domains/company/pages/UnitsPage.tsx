import { useState, useMemo } from 'react';
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
import { IconPlus, IconEdit, IconTrash, IconDownload, IconAlertTriangle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import { exportTableToExcel } from '@shared/utils';
import { useUnitStore, type Unit, type HazardClass } from '@store/unitStore';
import { useCompanyStore } from '@store/companyStore';
import { useAppStore } from '@shared/stores/appStore';
import { UnitModal } from '@domains/company/components/UnitModal';

/**
 * Get hazard class badge color
 */
function getHazardClassColor(hazardClass: HazardClass): string {
  switch (hazardClass) {
    case 'Az Tehlikeli':
      return 'green';
    case 'Tehlikeli':
      return 'yellow';
    case 'Çok Tehlikeli':
      return 'red';
    default:
      return 'gray';
  }
}

export function UnitsPage() {
  const { t } = useTranslation();
  
  // Get selected company from header
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  
  const fetchUnitsByCompany = useUnitStore((s) => s.fetchUnitsByCompany);
  const deleteUnit = useUnitStore((s) => s.deleteUnit);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);

  // Get company info
  const company = useMemo(() => {
    return selectedCompanyId ? getCompanyById(selectedCompanyId) : null;
  }, [selectedCompanyId, getCompanyById]);

  // Fetch units for this company
  const units = useMemo(() => {
    return selectedCompanyId ? fetchUnitsByCompany(selectedCompanyId) : [];
  }, [selectedCompanyId, fetchUnitsByCompany]);

  const handleAddUnit = () => {
    setEditingUnitId(null);
    openModal();
  };

  const handleEditUnit = (unit: Unit) => {
    setEditingUnitId(unit.id);
    openModal();
  };

  const handleDeleteUnit = (unit: Unit) => {
    if (window.confirm(t('units.deleteConfirm'))) {
      deleteUnit(unit.id);
      notifications.show({
        title: t('units.deleteSuccess'),
        message: t('units.deleteSuccessMessage'),
        color: 'green',
      });
    }
  };

  const handleExcelDownload = () => {
    const TURKISH_COLUMNS = ['Birim Adı', 'Birim Sorumlusu', 'Tehlike Sınıfı', 'Çalışan Sayısı', 'Açıklama'] as const;
    const mappedData = units.map((unit) => ({
      'Birim Adı': unit.name,
      'Birim Sorumlusu': unit.managerName,
      'Tehlike Sınıfı': unit.hazardClass,
      'Çalışan Sayısı': unit.employeeCount,
      'Açıklama': unit.description ?? '',
    }));
    const filename = company?.name
      ? `${company.name.replace(/\s+/g, '_')}_Birimler`
      : 'Birim_Listesi';
    exportTableToExcel(mappedData, [...TURKISH_COLUMNS], filename);
    notifications.show({
      title: t('units.excelDownload'),
      message: t('units.excelDownloadMessage'),
      color: 'green',
    });
  };

  const handleModalClose = () => {
    setEditingUnitId(null);
    closeModal();
  };

  // Show error if no company selected
  if (!selectedCompanyId) {
    return (
      <Stack align="center" p="xl" gap="md">
        <IconAlertTriangle size={48} color="var(--mantine-color-amber-5)" />
        <Text c="dimmed" size="sm" ta="center">
          {t('units.noCompanyId')}
        </Text>
      </Stack>
    );
  }

  return (
    <>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Box>
            <Title order={2}>{t('units.title')}</Title>
            <Text c="dimmed" size="sm" mt={4}>
              {company ? `${company.name} - ${t('units.subtitle')}` : t('units.subtitle')}
            </Text>
          </Box>
          <Group gap="sm" wrap="wrap">
            <Button
              leftSection={<IconDownload size={18} />}
              variant="light"
              color="blue"
              onClick={handleExcelDownload}
            >
              {t('units.buttonExcelDownload')}
            </Button>
            <Button
              leftSection={<IconPlus size={18} />}
              color="teal"
              onClick={handleAddUnit}
            >
              {t('units.buttonAddUnit')}
            </Button>
          </Group>
        </Group>

        {/* Statistics */}
        {units.length > 0 && (
          <Paper p="md" withBorder>
            <Group gap="xl" wrap="wrap">
              <Box>
                <Text size="sm" c="dimmed">
                  {t('units.totalUnits')}
                </Text>
                <Badge size="xl" variant="filled" color="blue">
                  {units.length}
                </Badge>
              </Box>
              <Box>
                <Text size="sm" c="dimmed">
                  {t('units.totalEmployees')}
                </Text>
                <Badge size="xl" variant="filled" color="cyan">
                  {units.reduce((sum, unit) => sum + unit.employeeCount, 0)}
                </Badge>
              </Box>
              <Box>
                <Text size="sm" c="dimmed">
                  {t('units.highHazard')}
                </Text>
                <Badge size="xl" variant="filled" color="red">
                  {units.filter((u) => u.hazardClass === 'Çok Tehlikeli').length}
                </Badge>
              </Box>
            </Group>
          </Paper>
        )}

        {/* Units Table */}
        <Paper withBorder>
          {units.length === 0 ? (
            <Stack align="center" p="xl" gap="md">
              <IconAlertTriangle size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" size="sm" ta="center">
                {t('units.noUnits')}
              </Text>
              <Text c="dimmed" size="sm" ta="center" fw={500}>
                {t('units.noUnitsHint')}
              </Text>
              <Button
                variant="light"
                leftSection={<IconPlus size={18} />}
                onClick={handleAddUnit}
              >
                {t('units.buttonAddFirstUnit')}
              </Button>
            </Stack>
          ) : (
            <Table.ScrollContainer minWidth={800}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t('units.table.name')}</Table.Th>
                    <Table.Th>{t('units.table.manager')}</Table.Th>
                    <Table.Th>{t('units.table.hazardClass')}</Table.Th>
                    <Table.Th>{t('units.table.employeeCount')}</Table.Th>
                    <Table.Th>{t('units.table.description')}</Table.Th>
                    <Table.Th>{t('units.table.actions')}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {units.map((unit) => (
                    <Table.Tr key={unit.id}>
                      <Table.Td>
                        <Text size="sm" fw={600}>
                          {unit.name}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{unit.managerName}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getHazardClassColor(unit.hazardClass)} size="md">
                          {unit.hazardClass}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="blue" size="md">
                          {unit.employeeCount}
                        </Badge>
                      </Table.Td>
                      <Table.Td style={{ maxWidth: 300 }}>
                        <Text size="sm" lineClamp={2} title={unit.description}>
                          {unit.description || '—'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Group gap="xs" wrap="nowrap">
                          <ActionIcon
                            variant="subtle"
                            color="blue"
                            onClick={() => handleEditUnit(unit)}
                            aria-label={t('common.edit')}
                          >
                            <IconEdit size={18} />
                          </ActionIcon>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            onClick={() => handleDeleteUnit(unit)}
                            aria-label={t('common.delete')}
                          >
                            <IconTrash size={18} />
                          </ActionIcon>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          )}
        </Paper>
      </Stack>

      {/* Unit Modal */}
      {selectedCompanyId && (
        <UnitModal
          opened={modalOpened}
          onClose={handleModalClose}
          companyId={selectedCompanyId}
          editUnitId={editingUnitId}
        />
      )}
    </>
  );
}
