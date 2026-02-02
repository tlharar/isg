import { useState } from 'react';
import { Title, Text, Button, Group, Stack, Paper, Table, ActionIcon, Menu, FileInput } from '@mantine/core';
import { IconPlus, IconDownload, IconUpload, IconDots, IconEdit, IconKey, IconBuilding, IconCertificate, IconLink } from '@tabler/icons-react';
import { Link } from 'react-router-dom';
import { useTranslation } from '@shared/i18n';
import { useExportExcel } from '@shared/utils';

const SAMPLE_WORKER_COLUMNS = [
  'nameSurname',
  'idNumber',
  'email',
  'mobileNo',
  'workNo',
  'employmentStartDate',
  'employmentEndDate',
  'dateOfBirth',
  'gender',
  'visaDate',
  'jobTitle',
] as const;

export function WorkerListPage() {
  const { t } = useTranslation();
  const { exportTableToExcel } = useExportExcel();
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const handleDownloadTemplate = () => {
    exportTableToExcel(
      [],
      [...SAMPLE_WORKER_COLUMNS],
      'worker-template'
    );
  };

  const sampleWorkers = [
    { id: '1', nameSurname: 'Ahmet Yılmaz', idNumber: '12345678901', email: 'ahmet@example.com', jobTitle: 'Technician' },
    { id: '2', nameSurname: 'Ayşe Demir', idNumber: '98765432109', email: 'ayse@example.com', jobTitle: 'Engineer' },
  ];

  return (
    <>
      <Stack gap="md" mb="md">
        <Group justify="space-between" wrap="wrap" gap="sm">
          <div>
            <Title order={2}>{t('worker.title')}</Title>
            <Text c="dimmed" size="sm">{t('worker.subtitle')}</Text>
          </div>
          <Group gap="xs" wrap="wrap">
            <Button variant="light" leftSection={<IconDownload size={16} />} onClick={handleDownloadTemplate} size="sm">
              {t('worker.downloadTemplate')}
            </Button>
            <Button component={Link} to="/worker/new" leftSection={<IconPlus size={16} />} size="sm">
              {t('worker.addWorker')}
            </Button>
          </Group>
        </Group>

        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text size="sm" fw={500}>{t('worker.uploadExcel')}</Text>
            <Group align="flex-end">
              <FileInput
                placeholder={t('worker.uploadExcel')}
                value={uploadFile}
                onChange={setUploadFile}
                accept=".xlsx,.xls"
                clearable
                style={{ minWidth: 220 }}
              />
            </Group>
          </Stack>
        </Paper>
      </Stack>

      <Paper withBorder>
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('worker.form.nameSurname')}</Table.Th>
              <Table.Th>{t('worker.form.idNumber')}</Table.Th>
              <Table.Th>{t('worker.form.email')}</Table.Th>
              <Table.Th>{t('worker.form.jobTitle')}</Table.Th>
              <Table.Th style={{ width: 50 }} />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {sampleWorkers.map((w) => (
              <Table.Tr key={w.id}>
                <Table.Td>{w.nameSurname}</Table.Td>
                <Table.Td>{w.idNumber}</Table.Td>
                <Table.Td>{w.email}</Table.Td>
                <Table.Td>{w.jobTitle}</Table.Td>
                <Table.Td>
                  <Menu shadow="md" width={220} position="bottom-end">
                    <Menu.Target>
                      <ActionIcon variant="subtle" size="sm">
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item leftSection={<IconEdit size={14} />}>{t('worker.actions.edit')}</Menu.Item>
                      <Menu.Item leftSection={<IconKey size={14} />}>{t('worker.actions.authorization')}</Menu.Item>
                      <Menu.Item leftSection={<IconBuilding size={14} />}>{t('worker.actions.companies')}</Menu.Item>
                      <Menu.Item leftSection={<IconCertificate size={14} />}>{t('worker.actions.activeVisaInquiry')}</Menu.Item>
                      <Menu.Item leftSection={<IconLink size={14} />}>{t('worker.actions.passwordCreationLink')}</Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </>
  );
}
