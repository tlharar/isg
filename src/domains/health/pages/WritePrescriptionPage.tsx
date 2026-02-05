import { useMemo, useState } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Table,
  ActionIcon,
  TextInput,
  Select,
  NumberInput,
  MultiSelect,
  SegmentedControl,
  Autocomplete,
  Grid,
} from '@mantine/core';
import { IconTrash, IconStar } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useWorkerStore } from '@store/workerStore';
import { useCompanyStore } from '@store/companyStore';
import { useAppStore } from '@shared/stores/appStore';
import {
  usePrescriptionStore,
  USAGE_TYPE_OPTIONS,
  FAVORITE_DIAGNOSES,
  type PrescriptionDrug,
  type Prescription,
} from '@store/prescriptionStore';
import { MedicalReportModal } from '@domains/health/components/MedicalReportModal';
import dayjs from 'dayjs';

type PatientMethod = 'company' | 'all' | 'tc';

function computeAge(dateOfBirth: string | undefined): number | null {
  if (!dateOfBirth) return null;
  const dob = dayjs(dateOfBirth, ['YYYY-MM-DD', 'DD.MM.YYYY']);
  if (!dob.isValid()) return null;
  return dayjs().diff(dob, 'year');
}

export function WritePrescriptionPage() {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const workers = useWorkerStore((s) => s.workers);
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);
  const diagnosisOptionsList = usePrescriptionStore((s) => s.diagnosisOptions);
  const drugOptionsList = usePrescriptionStore((s) => s.drugOptions);
  const searchDiagnoses = usePrescriptionStore((s) => s.searchDiagnoses);
  const searchDrugs = usePrescriptionStore((s) => s.searchDrugs);
  const addPrescription = usePrescriptionStore((s) => s.addPrescription);

  const [patientMethod, setPatientMethod] = useState<PatientMethod>('company');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [tcInput, setTcInput] = useState('');
  const [manualPatientName, setManualPatientName] = useState('');
  const [selectedDiagnoses, setSelectedDiagnoses] = useState<string[]>([]);
  const [diagnosisSearch, setDiagnosisSearch] = useState('');
  const [drugSearch, setDrugSearch] = useState('');
  const [drugForm, setDrugForm] = useState({
    name: '',
    usageType: USAGE_TYPE_OPTIONS[0]?.value ?? 'Tok Karnına',
    dose: '1x1',
    boxCount: 1,
    period: 7,
  });
  const [drugsList, setDrugsList] = useState<PrescriptionDrug[]>([]);
  const [lastSavedPrescription, setLastSavedPrescription] = useState<Prescription | null>(null);
  const [reportModalOpened, setReportModalOpened] = useState(false);

  const workerOptions = useMemo(() => {
    let list = workers;
    if (patientMethod === 'company' && selectedCompanyId) {
      list = list.filter((w) => w.companyId === selectedCompanyId);
    }
    return list.map((w) => ({
      value: w.id,
      label: `${w.nameSurname}${w.jobTitle ? ` - ${w.jobTitle}` : ''}`,
    }));
  }, [workers, selectedCompanyId, patientMethod]);

  const selectedWorker = useMemo(
    () => (selectedWorkerId ? workers.find((w) => w.id === selectedWorkerId) : null),
    [workers, selectedWorkerId]
  );

  const patientSummary = useMemo(() => {
    if (patientMethod === 'tc' && (tcInput.trim() || manualPatientName.trim())) {
      const age = null; // manual TC entry – no age unless we had a lookup
      return {
        name: manualPatientName.trim() || '—',
        age: age ?? '—',
        company: '—',
        patientId: `tc-${tcInput.trim()}`,
        tcNo: tcInput.trim(),
      };
    }
    if (!selectedWorker) return null;
    const company = selectedWorker.companyId ? getCompanyById(selectedWorker.companyId) : null;
    const dobStr = selectedWorker.dateOfBirth == null
      ? undefined
      : typeof selectedWorker.dateOfBirth === 'string'
        ? selectedWorker.dateOfBirth
        : (selectedWorker.dateOfBirth as Date).toISOString().slice(0, 10);
    const age = computeAge(dobStr);
    return {
      name: selectedWorker.nameSurname,
      age: age ?? '—',
      company: company?.name ?? '—',
      patientId: selectedWorker.id,
      tcNo: selectedWorker.idNumber ?? '',
    };
  }, [patientMethod, tcInput, manualPatientName, selectedWorker, getCompanyById]);

  const diagnosisOptionsForSelect = useMemo(() => {
    const list = diagnosisSearch ? searchDiagnoses(diagnosisSearch) : diagnosisOptionsList;
    return list.map((d) => d.label);
  }, [diagnosisSearch, diagnosisOptionsList, searchDiagnoses]);

  const drugOptionsForAutocomplete = useMemo(() => {
    const list = drugSearch ? searchDrugs(drugSearch) : drugOptionsList;
    return list.map((d) => d.label);
  }, [drugSearch, drugOptionsList, searchDrugs]);

  const handleAddDrug = () => {
    const name = drugForm.name.trim();
    if (!name) return;
    setDrugsList((prev) => [
      ...prev,
      {
        name,
        usageType: drugForm.usageType,
        dose: drugForm.dose.trim() || '1x1',
        boxCount: drugForm.boxCount,
        period: drugForm.period,
      },
    ]);
    setDrugForm((f) => ({ ...f, name: '', dose: '1x1', boxCount: 1, period: 7 }));
    setDrugSearch('');
  };

  const handleRemoveDrug = (index: number) => {
    setDrugsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFavoriteDiagnoses = () => {
    setSelectedDiagnoses((prev) => {
      const set = new Set(prev);
      FAVORITE_DIAGNOSES.forEach((d) => set.add(d));
      return Array.from(set);
    });
  };

  const handleSavePrescription = () => {
    if (!patientSummary) {
      notifications.show({
        title: 'Eksik bilgi',
        message: 'Lütfen hasta seçin veya TC Kimlik No ile hasta girin.',
        color: 'red',
      });
      return;
    }
    if (selectedDiagnoses.length === 0) {
      notifications.show({
        title: 'Eksik bilgi',
        message: 'En az bir tanı seçin.',
        color: 'red',
      });
      return;
    }
    if (drugsList.length === 0) {
      notifications.show({
        title: 'Eksik bilgi',
        message: 'En az bir ilaç ekleyin.',
        color: 'red',
      });
      return;
    }
    const saved = addPrescription({
      patientId: patientSummary.patientId,
      patientName: patientSummary.name,
      tcNo: patientSummary.tcNo,
      diagnoses: selectedDiagnoses,
      drugs: drugsList,
    });
    setLastSavedPrescription(saved);
    notifications.show({
      title: 'Reçete kaydedildi',
      message: 'Reçete sisteme kaydedildi. (E-İmza entegrasyonu bekleniyor).',
      color: 'green',
    });
    setSelectedDiagnoses([]);
    setDrugsList([]);
  };

  return (
    <Stack gap="lg">
      <div>
        <Title order={2}>E-Reçete Yaz</Title>
        <Text c="dimmed" size="sm">
          Hasta seçimi, tanı, ilaç ekleme ve kaydetme adımlarını tamamlayın.
        </Text>
      </div>

      {/* Section 1: Hasta Seçimi */}
      <Paper withBorder p="md" radius="md" shadow="sm">
        <Text fw={600} mb="sm" size="md">
          1. Hasta Seçimi
        </Text>
        <SegmentedControl
          value={patientMethod}
          onChange={(v) => {
            setPatientMethod(v as PatientMethod);
            setSelectedWorkerId(null);
            setTcInput('');
            setManualPatientName('');
          }}
          data={[
            { value: 'company', label: 'Seçili Firmadan' },
            { value: 'all', label: 'Tüm Firmalardan' },
            { value: 'tc', label: 'TC Kimlik No İle' },
          ]}
          fullWidth
          mb="md"
        />
        {patientMethod !== 'tc' ? (
          <Stack gap="xs">
            <Select
              placeholder="Çalışan seçin..."
              data={workerOptions}
              value={selectedWorkerId}
              onChange={setSelectedWorkerId}
              searchable
              clearable
              nothingFoundMessage="Çalışan bulunamadı"
            />
          </Stack>
        ) : (
          <Stack gap="xs">
            <TextInput
              placeholder="TC Kimlik No (11 hane)"
              value={tcInput}
              onChange={(e) => setTcInput(e.currentTarget.value)}
              maxLength={11}
            />
            <TextInput
              placeholder="Hasta Adı Soyadı (manuel)"
              value={manualPatientName}
              onChange={(e) => setManualPatientName(e.currentTarget.value)}
            />
          </Stack>
        )}
        {patientSummary && (
          <Paper withBorder p="sm" mt="md" bg="gray.0">
            <Text size="sm" fw={500}>Seçilen hasta</Text>
            <Text size="sm" c="dimmed">
              {patientSummary.name} · Yaş: {String(patientSummary.age)} · Firma: {patientSummary.company}
            </Text>
          </Paper>
        )}
      </Paper>

      {/* Section 2: Tanı Seçimi */}
      <Paper withBorder p="md" radius="md" shadow="sm">
        <Group justify="space-between" mb="sm">
          <Text fw={600} size="md">
            2. Tanı Seçimi
          </Text>
          <Button
            variant="light"
            size="xs"
            leftSection={<IconStar size={14} />}
            onClick={handleFavoriteDiagnoses}
          >
            Favori Tanılar
          </Button>
        </Group>
        <MultiSelect
          placeholder="Tanı ara veya seçin (ICD-10)"
          data={diagnosisOptionsForSelect}
          value={selectedDiagnoses}
          onChange={setSelectedDiagnoses}
          searchValue={diagnosisSearch}
          onSearchChange={setDiagnosisSearch}
          searchable
          clearable
          nothingFoundMessage="Tanı bulunamadı"
        />
      </Paper>

      {/* Section 3: İlaç Seçimi */}
      <Paper withBorder p="md" radius="md" shadow="sm">
        <Text fw={600} mb="md" size="md">
          3. İlaç Seçimi
        </Text>
        <Grid>
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Autocomplete
              label="İlaç adı"
              placeholder="İlaç ara..."
              data={drugOptionsForAutocomplete}
              value={drugForm.name}
              onChange={(v) => {
                setDrugForm((f) => ({ ...f, name: v }));
                setDrugSearch(v);
              }}
              onOptionSubmit={(v) => setDrugForm((f) => ({ ...f, name: v }))}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 2 }}>
            <Select
              label="Kullanım"
              data={USAGE_TYPE_OPTIONS}
              value={drugForm.usageType}
              onChange={(v) => setDrugForm((f) => ({ ...f, usageType: v ?? f.usageType }))}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 2 }}>
            <TextInput
              label="Doz"
              placeholder="1x1, 2x1..."
              value={drugForm.dose}
              onChange={(e) => setDrugForm((f) => ({ ...f, dose: e.currentTarget.value }))}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 1 }}>
            <NumberInput
              label="Kutu"
              min={1}
              value={drugForm.boxCount}
              onChange={(v) => setDrugForm((f) => ({ ...f, boxCount: typeof v === 'number' ? v : 1 }))}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, md: 1 }}>
            <NumberInput
              label="Gün"
              min={1}
              value={drugForm.period}
              onChange={(v) => setDrugForm((f) => ({ ...f, period: typeof v === 'number' ? v : 7 }))}
            />
          </Grid.Col>
        </Grid>
        <Group mt="md">
          <Button onClick={handleAddDrug} disabled={!drugForm.name.trim()}>
            Reçeteye Ekle
          </Button>
        </Group>
        {drugsList.length > 0 && (
          <Table.ScrollContainer minWidth={400} mt="md">
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>İlaç</Table.Th>
                  <Table.Th>Kullanım</Table.Th>
                  <Table.Th>Doz</Table.Th>
                  <Table.Th>Kutu</Table.Th>
                  <Table.Th>Gün</Table.Th>
                  <Table.Th w={50} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {drugsList.map((drug, index) => (
                  <Table.Tr key={index}>
                    <Table.Td>{drug.name}</Table.Td>
                    <Table.Td>{drug.usageType}</Table.Td>
                    <Table.Td>{drug.dose}</Table.Td>
                    <Table.Td>{drug.boxCount}</Table.Td>
                    <Table.Td>{drug.period}</Table.Td>
                    <Table.Td>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        onClick={() => handleRemoveDrug(index)}
                        aria-label="Kaldır"
                      >
                        <IconTrash size={16} />
                      </ActionIcon>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Table.ScrollContainer>
        )}
      </Paper>

      {/* Section 4: İşlem */}
      <Paper withBorder p="md" radius="md" shadow="sm">
        <Text fw={600} mb="sm" size="md">
          4. İşlem
        </Text>
        <Text size="sm" c="dimmed" mb="md">
          E-imza altyapısı hazır olmadığı için reçete yalnızca kaydedilir; imzalı gönderim sonra eklenecektir.
        </Text>
        <Group>
          <Button onClick={handleSavePrescription} size="md">
            Reçeteyi Kaydet
          </Button>
          {lastSavedPrescription && (
            <Button
              variant="light"
              size="md"
              onClick={() => setReportModalOpened(true)}
            >
              İstirahat Raporu Yaz
            </Button>
          )}
        </Group>
      </Paper>

      <MedicalReportModal
        opened={reportModalOpened}
        onClose={() => setReportModalOpened(false)}
        initial={
          lastSavedPrescription
            ? {
                patientId: lastSavedPrescription.patientId,
                patientName: lastSavedPrescription.patientName,
                tcNo: lastSavedPrescription.tcNo,
                diagnosis: lastSavedPrescription.diagnoses[0],
                prescriptionId: lastSavedPrescription.id,
              }
            : null
        }
        printAfterSave={false}
      />
    </Stack>
  );
}
