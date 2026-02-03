import { useEffect, useMemo } from 'react';
import { Modal, TextInput, Textarea, Select, Button, Stack, Group, Badge, Text, Box } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { useTranslation } from '@shared/i18n';
import { calculateRisk, type RiskItem } from '@store/riskStore';

interface RiskModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (values: RiskFormValues) => void;
  initialValues?: RiskItem | null;
  title: string;
}

export interface RiskFormValues {
  activity: string;
  hazard: string;
  risk: string;
  probability: number;
  severity: number;
  controlMeasures: string;
  responsiblePerson: string;
  deadline: Date;
  status: 'Open' | 'Closed';
}

const PROBABILITY_OPTIONS = [
  { value: '1', label: '1 - Çok Düşük' },
  { value: '2', label: '2 - Düşük' },
  { value: '3', label: '3 - Orta' },
  { value: '4', label: '4 - Yüksek' },
  { value: '5', label: '5 - Çok Yüksek' },
];

const SEVERITY_OPTIONS = [
  { value: '1', label: '1 - Çok Hafif' },
  { value: '2', label: '2 - Hafif' },
  { value: '3', label: '3 - Orta' },
  { value: '4', label: '4 - Ciddi' },
  { value: '5', label: '5 - Çok Ciddi' },
];

const STATUS_OPTIONS = [
  { value: 'Open', label: 'Açık' },
  { value: 'Closed', label: 'Kapalı' },
];

/**
 * Get badge color based on risk score
 */
function getRiskBadgeColor(score: number): string {
  if (score <= 6) return 'green';
  if (score <= 12) return 'yellow';
  if (score <= 20) return 'orange';
  return 'red';
}

export function RiskModal({ opened, onClose, onSubmit, initialValues, title }: RiskModalProps) {
  const { t } = useTranslation();

  const form = useForm<RiskFormValues>({
    initialValues: {
      activity: initialValues?.activity || '',
      hazard: initialValues?.hazard || '',
      risk: initialValues?.risk || '',
      probability: initialValues?.probability || 1,
      severity: initialValues?.severity || 1,
      controlMeasures: initialValues?.controlMeasures || '',
      responsiblePerson: initialValues?.responsiblePerson || '',
      deadline: initialValues?.deadline ? new Date(initialValues.deadline) : new Date(),
      status: initialValues?.status || 'Open',
    },
    validate: {
      activity: (value) => (!value.trim() ? t('risk.form.activityRequired') : null),
      hazard: (value) => (!value.trim() ? t('risk.form.hazardRequired') : null),
      risk: (value) => (!value.trim() ? t('risk.form.riskRequired') : null),
      probability: (value) => (value < 1 || value > 5 ? t('risk.form.probabilityInvalid') : null),
      severity: (value) => (value < 1 || value > 5 ? t('risk.form.severityInvalid') : null),
      controlMeasures: (value) => (!value.trim() ? t('risk.form.controlMeasuresRequired') : null),
      responsiblePerson: (value) => (!value.trim() ? t('risk.form.responsiblePersonRequired') : null),
    },
  });

  // Reset form when modal opens with new initial values
  useEffect(() => {
    if (opened) {
      form.setValues({
        activity: initialValues?.activity || '',
        hazard: initialValues?.hazard || '',
        risk: initialValues?.risk || '',
        probability: initialValues?.probability || 1,
        severity: initialValues?.severity || 1,
        controlMeasures: initialValues?.controlMeasures || '',
        responsiblePerson: initialValues?.responsiblePerson || '',
        deadline: initialValues?.deadline ? new Date(initialValues.deadline) : new Date(),
        status: initialValues?.status || 'Open',
      });
    }
  }, [opened, initialValues]);

  // Auto-calculate risk score and level
  const calculatedRisk = useMemo(() => {
    return calculateRisk(form.values.probability, form.values.severity);
  }, [form.values.probability, form.values.severity]);

  const handleSubmit = (values: RiskFormValues) => {
    onSubmit(values);
    form.reset();
    onClose();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={title} size="lg" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Activity */}
          <TextInput
            label={t('risk.form.activity')}
            placeholder={t('risk.form.activityPlaceholder')}
            required
            {...form.getInputProps('activity')}
          />

          {/* Hazard */}
          <TextInput
            label={t('risk.form.hazard')}
            placeholder={t('risk.form.hazardPlaceholder')}
            required
            {...form.getInputProps('hazard')}
          />

          {/* Risk */}
          <Textarea
            label={t('risk.form.risk')}
            placeholder={t('risk.form.riskPlaceholder')}
            required
            minRows={2}
            {...form.getInputProps('risk')}
          />

          {/* Probability and Severity (5x5 Matrix) */}
          <Group grow>
            <Select
              label={t('risk.form.probability')}
              placeholder={t('risk.form.selectProbability')}
              data={PROBABILITY_OPTIONS}
              required
              value={form.values.probability.toString()}
              onChange={(value) => form.setFieldValue('probability', parseInt(value || '1', 10))}
              error={form.errors.probability}
            />
            <Select
              label={t('risk.form.severity')}
              placeholder={t('risk.form.selectSeverity')}
              data={SEVERITY_OPTIONS}
              required
              value={form.values.severity.toString()}
              onChange={(value) => form.setFieldValue('severity', parseInt(value || '1', 10))}
              error={form.errors.severity}
            />
          </Group>

          {/* Auto-calculated Risk Score and Level */}
          <Box
            p="md"
            style={{
              backgroundColor: 'var(--mantine-color-gray-0)',
              borderRadius: 'var(--mantine-radius-md)',
              border: '1px solid var(--mantine-color-default-border)',
            }}
          >
            <Group justify="space-between" align="center">
              <div>
                <Text size="sm" fw={500} c="dimmed">
                  {t('risk.form.calculatedRiskScore')}
                </Text>
                <Text size="xl" fw={700}>
                  {calculatedRisk.riskScore}
                </Text>
              </div>
              <Badge size="xl" color={getRiskBadgeColor(calculatedRisk.riskScore)}>
                {calculatedRisk.riskLevel}
              </Badge>
            </Group>
          </Box>

          {/* Control Measures */}
          <Textarea
            label={t('risk.form.controlMeasures')}
            placeholder={t('risk.form.controlMeasuresPlaceholder')}
            required
            minRows={3}
            {...form.getInputProps('controlMeasures')}
          />

          {/* Responsible Person */}
          <TextInput
            label={t('risk.form.responsiblePerson')}
            placeholder={t('risk.form.responsiblePersonPlaceholder')}
            required
            {...form.getInputProps('responsiblePerson')}
          />

          {/* Deadline */}
          <DatePickerInput
            label={t('risk.form.deadline')}
            placeholder={t('risk.form.selectDeadline')}
            required
            valueFormat="DD/MM/YYYY"
            {...form.getInputProps('deadline')}
          />

          {/* Status */}
          <Select
            label={t('risk.form.status')}
            placeholder={t('risk.form.selectStatus')}
            data={STATUS_OPTIONS}
            required
            {...form.getInputProps('status')}
          />

          {/* Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="subtle" onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button type="submit">{t('common.save')}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
