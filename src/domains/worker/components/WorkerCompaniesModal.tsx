import { Modal, Stack, List, Text } from '@mantine/core';
import { useTranslation } from '@shared/i18n';
import { useCompanyStore } from '@store/companyStore';
import type { Worker } from '@store/workerStore';

interface WorkerCompaniesModalProps {
  opened: boolean;
  onClose: () => void;
  worker: Worker | null;
}

export function WorkerCompaniesModal({ opened, onClose, worker }: WorkerCompaniesModalProps) {
  const { t } = useTranslation();
  const getCompanyById = useCompanyStore((s) => s.getCompanyById);

  const companyIds = worker?.assignedCompanyIds ?? (worker?.companyId ? [worker.companyId] : []);
  const companies = companyIds
    .map((id) => getCompanyById(id))
    .filter(Boolean)
    .map((c) => c!.name);

  return (
    <Modal opened={opened} onClose={onClose} title={t('worker.actions.companies')} size="sm">
      <Stack gap="sm">
        {worker && (
          <Text size="sm" c="dimmed">
            {worker.nameSurname}
          </Text>
        )}
        {companies.length === 0 ? (
          <Text size="sm" c="dimmed">
            Atanmış şirket yok.
          </Text>
        ) : (
          <List size="sm" spacing="xs">
            {companies.map((name, i) => (
              <List.Item key={i}>{name}</List.Item>
            ))}
          </List>
        )}
      </Stack>
    </Modal>
  );
}
