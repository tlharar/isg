import { useState } from 'react';
import { Modal, Stack, TextInput, Button, Group } from '@mantine/core';
import { useTranslation } from '@shared/i18n';
import { notifications } from '@mantine/notifications';
import type { Worker } from '@store/workerStore';

interface WorkerVisaModalProps {
  opened: boolean;
  onClose: () => void;
  worker: Worker | null;
}

export function WorkerVisaModal({ opened, onClose, worker }: WorkerVisaModalProps) {
  const { t } = useTranslation();
  const [belgeNo, setBelgeNo] = useState('');

  const handleSorgula = () => {
    // Mock: always show "Vize Durumu: Aktif"
    notifications.show({
      title: 'Vize Sorgulama',
      message: 'Vize Durumu: Aktif',
      color: 'green',
    });
    setBelgeNo('');
    onClose();
  };

  const handleClose = () => {
    setBelgeNo('');
    onClose();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title={t('worker.actions.activeVisaInquiry')} size="sm">
      <Stack gap="md">
        <TextInput
          label="TCKN"
          value={worker?.idNumber ?? ''}
          disabled
          description="Çalışana ait TC Kimlik No"
        />
        <TextInput
          label="Belge No"
          placeholder="Belge numarası girin"
          value={belgeNo}
          onChange={(e) => setBelgeNo(e.currentTarget.value)}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={handleClose}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleSorgula}>Sorgula</Button>
        </Group>
      </Stack>
    </Modal>
  );
}
