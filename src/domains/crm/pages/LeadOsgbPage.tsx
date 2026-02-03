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
  TextInput,
  Select,
  Pagination,
  Divider,
  Modal,
  Box,
  Code,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconUpload, IconTrash, IconSearch, IconFilter, IconAlertTriangle, IconRefresh, IconPhone } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from '@shared/i18n';
import { useOsgbStore, type OsgbLead, type OsgbStatus } from '@store/osgbStore';
import * as XLSX from 'xlsx';

// Pagination settings
const ITEMS_PER_PAGE = 25;

/**
 * Get status badge color
 */
function getStatusBadgeColor(status: OsgbStatus): string {
  switch (status) {
    case 'Aktif':
      return 'green';
    case 'Pasif':
      return 'gray';
    case 'İptal':
      return 'red';
    case 'Aday':
      return 'blue';
    default:
      return 'gray';
  }
}

/**
 * Normalize status string from Excel/CSV
 * Smart mapping for various status formats
 */
function normalizeStatus(value: string | undefined | null): OsgbStatus {
  if (!value) return 'Aday';
  const normalized = value.toString().trim().toLowerCase();
  
  if (normalized.includes('aktif') || normalized.includes('active') || normalized === 'a') {
    return 'Aktif';
  }
  if (normalized.includes('iptal') || normalized.includes('cancel') || normalized.includes('silindi')) {
    return 'İptal';
  }
  if (normalized.includes('pasif') || normalized.includes('passive') || normalized === 'p') {
    return 'Pasif';
  }
  if (normalized.includes('aday') || normalized.includes('candidate') || normalized.includes('beklemede')) {
    return 'Aday';
  }
  
  return 'Aday';
}

/**
 * Helper function to get value from row with multiple possible column names
 * Searches through all possible header variations (case-insensitive)
 */
function getColumnValue(row: Record<string, any>, possibleHeaders: string[]): string {
  // First, try exact match
  for (const header of possibleHeaders) {
    if (row[header] !== undefined && row[header] !== null && row[header] !== '') {
      return row[header].toString().trim();
    }
  }
  
  // Then, try case-insensitive match
  const rowKeys = Object.keys(row);
  for (const header of possibleHeaders) {
    const headerLower = header.toLowerCase();
    for (const key of rowKeys) {
      if (key.toLowerCase() === headerLower) {
        const val = row[key];
        if (val !== undefined && val !== null && val !== '') {
          return val.toString().trim();
        }
      }
    }
  }
  
  // Finally, try partial match (header contains)
  for (const header of possibleHeaders) {
    const headerLower = header.toLowerCase();
    for (const key of rowKeys) {
      if (key.toLowerCase().includes(headerLower) || headerLower.includes(key.toLowerCase())) {
        const val = row[key];
        if (val !== undefined && val !== null && val !== '') {
          return val.toString().trim();
        }
      }
    }
  }
  
  return '';
}

/**
 * Smart column mapping for ISG-KATIP Export Format
 * 
 * Official ISG-KATIP Export Headers:
 * - Yetki Belgesi No
 * - Yetki Belgesi Tipi
 * - Yetki Belgesi Unvanı
 * - Yetki Belgesi Adresi
 * - Yetki Belgesi İli
 * - Yetki Belgesi İlçe
 * - Telefon
 * - E-posta
 */
function mapRowToLead(row: Record<string, any>, rowIndex: number): Omit<OsgbLead, 'id' | 'createdAt' | 'updatedAt'> | null {
  try {
    // Skip completely empty rows
    const rowValues = Object.values(row);
    if (rowValues.every(v => v === undefined || v === null || v === '')) {
      console.log(`Row ${rowIndex + 1}: Skipped (empty row)`);
      return null;
    }

    // ISG-KATIP: Yetki Belgesi Unvanı → name (REQUIRED)
    const nameHeaders = [
      'Yetki Belgesi Unvanı',
      'YETKİ BELGESİ UNVANI',
      'Yetki Belgesi Unvani',
      'Kurum Unvanı',
      'KURUM UNVANI',
      'Unvan',
      'UNVAN',
      'Firma Adı',
      'FİRMA ADI',
      'İşyeri Adı',
      'İŞYERİ ADI',
      'OSGB Adı',
      'Name',
      'name',
    ];
    const name = getColumnValue(row, nameHeaders);

    // ISG-KATIP: Yetki Belgesi No → licenseNumber (REQUIRED)
    const licenseHeaders = [
      'Yetki Belgesi No',
      'YETKİ BELGESİ NO',
      'Yetki Belgesi Numarası',
      'YETKİ BELGESİ NUMARASI',
      'Yetki Belge No',
      'YETKİ BELGE NO',
      'Belge No',
      'BELGE NO',
      'Belge Numarası',
      'License Number',
      'licenseNumber',
    ];
    const licenseNumber = getColumnValue(row, licenseHeaders);

    // Skip if required fields are missing
    if (!name) {
      console.log(`Row ${rowIndex + 1}: Skipped (missing Yetki Belgesi Unvanı)`);
      return null;
    }
    
    if (!licenseNumber) {
      console.log(`Row ${rowIndex + 1}: Skipped (missing Yetki Belgesi No) - Name: ${name}`);
      return null;
    }

    // ISG-KATIP: Yetki Belgesi Tipi → licenseType (OPTIONAL)
    const licenseTypeHeaders = [
      'Yetki Belgesi Tipi',
      'YETKİ BELGESİ TİPİ',
      'Yetki Belgesi Türü',
      'Belge Tipi',
      'BELGE TİPİ',
      'Tip',
      'TİP',
      'Type',
    ];
    const licenseType = getColumnValue(row, licenseTypeHeaders);

    // ISG-KATIP: Yetki Belgesi İli → city (OPTIONAL)
    const cityHeaders = [
      'Yetki Belgesi İli',
      'YETKİ BELGESİ İLİ',
      'Yetki Belgesi Ili',
      'Bulunduğu İl',
      'BULUNDUĞU İL',
      'İl',
      'İL',
      'Il',
      'Şehir',
      'ŞEHİR',
      'City',
    ];
    const city = getColumnValue(row, cityHeaders);

    // ISG-KATIP: Yetki Belgesi İlçe → district (OPTIONAL)
    const districtHeaders = [
      'Yetki Belgesi İlçe',
      'YETKİ BELGESİ İLÇE',
      'Yetki Belgesi Ilce',
      'İlçe',
      'İLÇE',
      'Ilce',
      'District',
    ];
    const district = getColumnValue(row, districtHeaders);

    // ISG-KATIP: Yetki Belgesi Adresi → address (OPTIONAL)
    const addressHeaders = [
      'Yetki Belgesi Adresi',
      'YETKİ BELGESİ ADRESİ',
      'Yetki Belgesi Adresi',
      'İletişim Adresi',
      'İLETİŞİM ADRESİ',
      'Adres',
      'ADRES',
      'Address',
      'Açık Adres',
    ];
    const address = getColumnValue(row, addressHeaders);

    // ISG-KATIP: Telefon → phone (OPTIONAL)
    const phoneHeaders = [
      'Telefon',
      'TELEFON',
      'Tel',
      'TEL',
      'Phone',
      'Tel No',
      'Telefon No',
      'GSM',
      'Cep',
    ];
    const phone = getColumnValue(row, phoneHeaders);

    // ISG-KATIP: E-posta → email (OPTIONAL)
    const emailHeaders = [
      'E-posta',
      'E-POSTA',
      'Eposta',
      'EPOSTA',
      'E-mail',
      'E-MAIL',
      'Email',
      'EMAIL',
      'Mail',
      'MAİL',
    ];
    const email = getColumnValue(row, emailHeaders);

    // Status (OPTIONAL - defaults to 'Aday')
    const statusHeaders = [
      'Durum',
      'DURUM',
      'Status',
      'Aktiflik Durumu',
      'AKTİFLİK DURUMU',
    ];
    const statusValue = getColumnValue(row, statusHeaders);

    const lead = {
      name,
      licenseNumber,
      licenseType,
      city,
      district,
      address,
      phone,
      email,
      status: normalizeStatus(statusValue),
    };

    console.log(`Row ${rowIndex + 1}: Successfully mapped - ${name}`);
    return lead;
  } catch (error) {
    console.error(`Row ${rowIndex + 1}: Error mapping row`, error, row);
    return null;
  }
}

export function LeadOsgbPage() {
  const { t } = useTranslation();
  const leads = useOsgbStore((s) => s.leads);
  const addLeadsBulk = useOsgbStore((s) => s.addLeadsBulk);
  const replaceAllLeads = useOsgbStore((s) => s.replaceAllLeads);
  const deleteLead = useOsgbStore((s) => s.deleteLead);
  const deleteAllLeads = useOsgbStore((s) => s.deleteAllLeads);
  const getUniqueCities = useOsgbStore((s) => s.getUniqueCities);

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state for clear confirmation
  const [clearModalOpened, { open: openClearModal, close: closeClearModal }] = useDisclosure(false);

  // Import mode state
  const [importMode, setImportMode] = useState<'add' | 'replace'>('add');

  // Debug state - show detected columns
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Get unique cities for filter dropdown
  const uniqueCities = useMemo(() => getUniqueCities(), [leads]);

  // Filter and paginate leads
  const filteredLeads = useMemo(() => {
    let result = [...leads];

    // Filter by search query (name, license, phone, email)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(query) ||
          lead.licenseNumber.toLowerCase().includes(query) ||
          (lead.phone && lead.phone.toLowerCase().includes(query)) ||
          (lead.email && lead.email.toLowerCase().includes(query))
      );
    }

    // Filter by city
    if (selectedCity) {
      result = result.filter((lead) => lead.city === selectedCity);
    }

    // Filter by status
    if (selectedStatus) {
      result = result.filter((lead) => lead.status === selectedStatus);
    }

    return result;
  }, [leads, searchQuery, selectedCity, selectedStatus]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredLeads.length / ITEMS_PER_PAGE);
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredLeads.slice(start, end);
  }, [filteredLeads, currentPage]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCityChange = (value: string | null) => {
    setSelectedCity(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string | null) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity(null);
    setSelectedStatus(null);
    setCurrentPage(1);
  };

  /**
   * Handle Excel/CSV file import using xlsx (SheetJS)
   * Supports ISG-KATIP export format with Turkish column headers
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('=== FILE UPLOAD STARTED ===');
    console.log('File name:', file.name);
    console.log('File type:', file.type);
    console.log('File size:', file.size, 'bytes');

    const reader = new FileReader();
    
    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      notifications.show({
        title: t('crm.excelImportError'),
        message: t('crm.fileReadError'),
        color: 'red',
      });
    };

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          throw new Error('No data received from file');
        }

        console.log('=== PARSING EXCEL FILE ===');
        
        // Parse the workbook
        const workbook = XLSX.read(data, { type: 'binary' });
        console.log('Workbook sheets:', workbook.SheetNames);
        
        // Get the first worksheet
        const sheetName = workbook.SheetNames[0];
        console.log('Using sheet:', sheetName);
        
        const worksheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers from first row
        const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
          defval: '', // Default value for empty cells
          raw: false, // Convert all values to strings
        });

        console.log('=== PARSED DATA ===');
        console.log('Total rows found:', jsonData.length);
        
        // Log detected column headers
        if (jsonData.length > 0) {
          const columns = Object.keys(jsonData[0]);
          console.log('Detected columns:', columns);
          setDetectedColumns(columns);
          setShowDebugInfo(true);
          
          // Log first few rows for debugging
          console.log('First row sample:', jsonData[0]);
          if (jsonData.length > 1) {
            console.log('Second row sample:', jsonData[1]);
          }
        } else {
          console.warn('No data rows found in file');
          setDetectedColumns([]);
        }

        // Map rows to leads
        const validLeads: Omit<OsgbLead, 'id' | 'createdAt' | 'updatedAt'>[] = [];
        let skippedCount = 0;

        console.log('=== MAPPING ROWS ===');
        jsonData.forEach((row, index) => {
          const lead = mapRowToLead(row, index);
          if (lead) {
            validLeads.push(lead);
          } else {
            skippedCount++;
          }
        });

        console.log('=== MAPPING COMPLETE ===');
        console.log('Valid leads:', validLeads.length);
        console.log('Skipped rows:', skippedCount);

        // Import leads
        if (validLeads.length > 0) {
          if (importMode === 'replace') {
            replaceAllLeads(validLeads);
            console.log('Replaced all leads with', validLeads.length, 'new leads');
          } else {
            addLeadsBulk(validLeads);
            console.log('Added', validLeads.length, 'leads to existing list');
          }

          notifications.show({
            title: t('crm.excelImportSuccess'),
            message: `${validLeads.length} adet OSGB başarıyla listeye eklendi.`,
            color: 'green',
          });

          // Reset filters and go to first page
          clearFilters();
        }

        // Show warning for skipped rows
        if (skippedCount > 0) {
          notifications.show({
            title: t('crm.excelImportWarning'),
            message: `${skippedCount} satır atlandı (eksik zorunlu alan: Kurum Unvanı veya Yetki Belge No).`,
            color: 'yellow',
          });
        }

        // Show error if no valid rows
        if (validLeads.length === 0) {
          notifications.show({
            title: t('crm.excelImportError'),
            message: 'Dosya formatı hatalı. Lütfen sütun başlıklarını kontrol edin.',
            color: 'red',
          });
          
          // Show detected columns in a separate notification
          if (detectedColumns.length > 0) {
            notifications.show({
              title: 'Algılanan Sütunlar',
              message: detectedColumns.join(', '),
              color: 'blue',
              autoClose: 10000,
            });
          }
        }

      } catch (error) {
        console.error('=== EXCEL IMPORT ERROR ===');
        console.error('Error details:', error);
        
        notifications.show({
          title: t('crm.excelImportError'),
          message: 'Dosya formatı hatalı. Lütfen sütun başlıklarını kontrol edin.',
          color: 'red',
        });
      }
    };
    
    reader.readAsBinaryString(file);

    // Reset file input
    event.target.value = '';
  };

  const handleDeleteLead = (lead: OsgbLead) => {
    if (window.confirm(t('crm.deleteConfirm'))) {
      deleteLead(lead.id);
      notifications.show({
        title: t('crm.deleteSuccess'),
        message: t('crm.deleteSuccessMessage'),
        color: 'green',
      });
    }
  };

  const handleClearAllLeads = () => {
    deleteAllLeads();
    closeClearModal();
    clearFilters();
    setDetectedColumns([]);
    setShowDebugInfo(false);
    notifications.show({
      title: t('crm.clearSuccess'),
      message: t('crm.clearSuccessMessage'),
      color: 'green',
    });
  };

  const handleDefineLicense = (lead: OsgbLead) => {
    // Placeholder for license definition
    notifications.show({
      title: t('crm.defineLicense'),
      message: `${lead.name} - ${lead.licenseNumber}`,
      color: 'blue',
    });
  };

  // City filter options
  const cityOptions = useMemo(
    () => uniqueCities.map((city) => ({ value: city, label: city })),
    [uniqueCities]
  );

  // Status filter options
  const statusOptions = [
    { value: 'Aktif', label: 'Aktif' },
    { value: 'Pasif', label: 'Pasif' },
    { value: 'İptal', label: 'İptal' },
    { value: 'Aday', label: 'Aday' },
  ];

  return (
    <>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" align="flex-start" wrap="wrap">
          <Box>
            <Title order={2}>{t('crm.title')}</Title>
            <Text c="dimmed" size="sm" mt={4}>
              {t('crm.subtitle')}
            </Text>
          </Box>
          <Group gap="sm" wrap="wrap">
            {/* Import Mode Select */}
            <Select
              size="sm"
              style={{ width: 150 }}
              value={importMode}
              onChange={(value) => setImportMode((value as 'add' | 'replace') || 'add')}
              data={[
                { value: 'add', label: t('crm.importModeAdd') },
                { value: 'replace', label: t('crm.importModeReplace') },
              ]}
            />
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              id="excel-file-input"
            />
            <Button
              leftSection={<IconUpload size={18} />}
              component="label"
              htmlFor="excel-file-input"
              color="teal"
            >
              {t('crm.uploadOsgbList')}
            </Button>
            {leads.length > 0 && (
              <Button
                leftSection={<IconTrash size={18} />}
                color="red"
                variant="light"
                onClick={openClearModal}
              >
                {t('crm.clearAll')}
              </Button>
            )}
          </Group>
        </Group>

        {/* Statistics */}
        <Paper p="md" withBorder>
          <Group gap="xl" wrap="wrap">
            <Box>
              <Text size="sm" c="dimmed">
                {t('crm.totalLeads')}
              </Text>
              <Badge size="xl" variant="filled" color="blue">
                {leads.length.toLocaleString('tr-TR')}
              </Badge>
            </Box>
            {filteredLeads.length !== leads.length && (
              <Box>
                <Text size="sm" c="dimmed">
                  {t('crm.filteredLeads')}
                </Text>
                <Badge size="xl" variant="filled" color="cyan">
                  {filteredLeads.length.toLocaleString('tr-TR')}
                </Badge>
              </Box>
            )}
            <Box>
              <Text size="sm" c="dimmed">
                {t('crm.uniqueCities')}
              </Text>
              <Badge size="xl" variant="filled" color="grape">
                {uniqueCities.length}
              </Badge>
            </Box>
          </Group>
        </Paper>

        {/* Info Box - ISG-KATIP Format */}
        <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
          <Text size="sm" fw={500} mb="xs">
            {t('crm.excelFormatTitle')} (ISG-KATİP Formatı)
          </Text>
          <Text size="sm" c="dimmed">
            {t('crm.excelFormatDescription')}
          </Text>
          <Text size="sm" c="dimmed" mt="xs">
            <strong>{t('crm.requiredColumns')}:</strong> Yetki Belgesi Unvanı, Yetki Belgesi No
          </Text>
          <Text size="sm" c="dimmed">
            <strong>{t('crm.optionalColumns')}:</strong> Yetki Belgesi Tipi, Yetki Belgesi İli, Yetki Belgesi İlçe, Yetki Belgesi Adresi, Telefon, E-posta
          </Text>
        </Paper>

        {/* Debug Info - Detected Columns */}
        {showDebugInfo && detectedColumns.length > 0 && (
          <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-gray-0)' }}>
            <Group justify="space-between" mb="xs">
              <Text size="sm" fw={500}>
                Algılanan Sütun Başlıkları (Debug)
              </Text>
              <Button size="xs" variant="subtle" onClick={() => setShowDebugInfo(false)}>
                Gizle
              </Button>
            </Group>
            <Code block style={{ fontSize: '12px' }}>
              {detectedColumns.join('\n')}
            </Code>
          </Paper>
        )}

        {/* Filter Bar */}
        {leads.length > 0 && (
          <Paper p="md" withBorder>
            <Group align="flex-end" gap="md" wrap="wrap">
              <TextInput
                leftSection={<IconSearch size={16} />}
                label={t('crm.searchLabel')}
                placeholder={t('crm.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.currentTarget.value)}
                style={{ flex: 1, minWidth: 200 }}
              />
              <Select
                leftSection={<IconFilter size={16} />}
                label={t('crm.filterCity')}
                placeholder={t('crm.filterCityPlaceholder')}
                data={cityOptions}
                value={selectedCity}
                onChange={handleCityChange}
                clearable
                searchable
                style={{ minWidth: 180 }}
              />
              <Select
                label={t('crm.filterStatus')}
                placeholder={t('crm.filterStatusPlaceholder')}
                data={statusOptions}
                value={selectedStatus}
                onChange={handleStatusChange}
                clearable
                style={{ minWidth: 140 }}
              />
              {(searchQuery || selectedCity || selectedStatus) && (
                <Button
                  leftSection={<IconRefresh size={16} />}
                  variant="light"
                  onClick={clearFilters}
                >
                  {t('crm.clearFilters')}
                </Button>
              )}
            </Group>
          </Paper>
        )}

        {/* OSGB Table */}
        <Paper withBorder>
          {leads.length === 0 ? (
            <Stack align="center" p="xl" gap="md">
              <IconAlertTriangle size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" size="sm">
                {t('crm.noLeads')}
              </Text>
              <Button
                variant="light"
                leftSection={<IconUpload size={18} />}
                component="label"
                htmlFor="excel-file-input"
              >
                {t('crm.uploadFirstList')}
              </Button>
            </Stack>
          ) : filteredLeads.length === 0 ? (
            <Stack align="center" p="xl" gap="md">
              <IconSearch size={48} color="var(--mantine-color-gray-5)" />
              <Text c="dimmed" size="sm">
                {t('crm.noFilteredResults')}
              </Text>
              <Button variant="light" leftSection={<IconRefresh size={18} />} onClick={clearFilters}>
                {t('crm.clearFilters')}
              </Button>
            </Stack>
          ) : (
            <>
              <Table.ScrollContainer minWidth={1200}>
                <Table striped highlightOnHover>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th style={{ width: 50 }}>#</Table.Th>
                      <Table.Th>{t('crm.table.name')}</Table.Th>
                      <Table.Th>{t('crm.table.licenseNumber')}</Table.Th>
                      <Table.Th>{t('crm.table.licenseType')}</Table.Th>
                      <Table.Th>{t('crm.table.city')}</Table.Th>
                      <Table.Th>{t('crm.table.district')}</Table.Th>
                      <Table.Th>{t('crm.table.phone')}</Table.Th>
                      <Table.Th>{t('crm.table.email')}</Table.Th>
                      <Table.Th>{t('crm.table.status')}</Table.Th>
                      <Table.Th>{t('crm.table.actions')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {paginatedLeads.map((lead, index) => (
                      <Table.Tr key={lead.id}>
                        <Table.Td>
                          <Text size="sm" c="dimmed">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Text size="sm" fw={500}>
                            {lead.name}
                          </Text>
                        </Table.Td>
                        <Table.Td>
                          <Badge variant="light" color="blue" size="sm">
                            {lead.licenseNumber}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          {lead.licenseType ? (
                            <Badge variant="light" color="grape" size="sm">
                              {lead.licenseType}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </Table.Td>
                        <Table.Td style={{ textTransform: 'capitalize' }}>
                          {lead.city || '—'}
                        </Table.Td>
                        <Table.Td style={{ textTransform: 'capitalize' }}>
                          {lead.district || '—'}
                        </Table.Td>
                        <Table.Td>
                          {lead.phone ? (
                            <Group gap={4} wrap="nowrap">
                              <IconPhone size={14} color="var(--mantine-color-gray-6)" />
                              <Text size="sm">{lead.phone}</Text>
                            </Group>
                          ) : (
                            '—'
                          )}
                        </Table.Td>
                        <Table.Td>
                          {lead.email ? (
                            <Text size="sm" c="blue">
                              {lead.email}
                            </Text>
                          ) : (
                            '—'
                          )}
                        </Table.Td>
                        <Table.Td>
                          <Badge color={getStatusBadgeColor(lead.status)} size="sm">
                            {lead.status}
                          </Badge>
                        </Table.Td>
                        <Table.Td>
                          <Group gap="xs" wrap="nowrap">
                            <Button
                              size="xs"
                              variant="light"
                              color="blue"
                              onClick={() => handleDefineLicense(lead)}
                            >
                              {t('crm.defineLicense')}
                            </Button>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              onClick={() => handleDeleteLead(lead)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <>
                  <Divider />
                  <Group justify="space-between" p="md">
                    <Text size="sm" c="dimmed">
                      {t('crm.showingResults')
                        .replace('{{from}}', ((currentPage - 1) * ITEMS_PER_PAGE + 1).toString())
                        .replace('{{to}}', Math.min(currentPage * ITEMS_PER_PAGE, filteredLeads.length).toString())
                        .replace('{{total}}', filteredLeads.length.toString())}
                    </Text>
                    <Pagination
                      value={currentPage}
                      onChange={setCurrentPage}
                      total={totalPages}
                      size="sm"
                    />
                  </Group>
                </>
              )}
            </>
          )}
        </Paper>
      </Stack>

      {/* Clear All Confirmation Modal */}
      <Modal
        opened={clearModalOpened}
        onClose={closeClearModal}
        title={t('crm.clearAllTitle')}
        centered
      >
        <Stack gap="md">
          <Text size="sm">{t('crm.clearAllConfirm')}</Text>
          <Text size="sm" c="red" fw={500}>
            {t('crm.clearAllWarning').replace('{{count}}', leads.length.toString())}
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={closeClearModal}>
              {t('common.cancel')}
            </Button>
            <Button color="red" onClick={handleClearAllLeads}>
              {t('crm.clearAll')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
