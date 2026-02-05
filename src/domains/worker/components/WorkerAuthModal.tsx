import { useEffect, useState } from 'react';
import { Modal, Stack, Checkbox, Group, Button } from '@mantine/core';
import { useTranslation } from '@shared/i18n';
import type { Worker } from '@store/workerStore';

const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'Usta Basi', label: 'Usta Başı' },
  { value: 'Calisan Temsilcisi', label: 'Çalışan Temsilcisi' },
  { value: 'Acil Durum Eki', label: 'Acil Durum Eki' },
];

interface WorkerAuthModalProps {
  opened: boolean;
  onClose: () => void;
  worker: Worker | null;
  onSave: (roles: string[]) => void;
}

export function WorkerAuthModal({ opened, onClose, worker, onSave }: WorkerAuthModalProps) {
  const { t } = useTranslation();
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  useEffect(() => {
    if (opened && worker) {
      setSelectedRoles(worker.roles ?? []);
    }
  }, [opened, worker]);

  const handleToggle = (value: string, checked: boolean) => {
    setSelectedRoles((prev) =>
      checked ? (prev.includes(value) ? prev : [...prev, value]) : prev.filter((r) => r !== value)
    );
  };

  const handleSubmit = () => {
    onSave(selectedRoles);
    onClose();
  };

  return (
    <Modal opened={opened} onClose={onClose} title={t('worker.actions.authorization')} size="sm">
      <Stack gap="md">
        {worker && (
          <Checkbox.Group label={worker.nameSurname}>
            <Stack gap="xs" mt="xs">
              {ROLE_OPTIONS.map((opt) => (
                <Checkbox
                  key={opt.value}
                  label={opt.label}
                  checked={selectedRoles.includes(opt.value)}
                  onChange={(e) => handleToggle(opt.value, e.currentTarget.checked)}
                />
              ))}
            </Stack>
          </Checkbox.Group>
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSubmit}>{t('worker.save')}</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
