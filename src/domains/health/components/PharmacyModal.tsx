import { useEffect } from 'react';
import {
  Modal,
  Stack,
  Select,
  Autocomplete,
  TextInput,
  NumberInput,
  Button,
  Group,
} from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import {
  usePharmacyStore,
  getSuggestionsByCategory,
  findStandardItemByLabel,
  type MedicalItem,
  type MedicalCategory,
  type MedicalUnit,
} from '../stores/pharmacyStore';
import { notifications } from '@mantine/notifications';

export const CATEGORY_OPTIONS: { value: MedicalCategory; label: string }[] = [
  { value: 'DRUG', label: 'İlaç' },
  { value: 'CONSUMABLE', label: 'Sarf' },
  { value: 'EQUIPMENT', label: 'Ekipman' },
];

export const UNIT_OPTIONS: { value: MedicalUnit; label: string }[] = [
  { value: 'BOX', label: 'Kutu' },
  { value: 'PIECE', label: 'Adet' },
  { value: 'AMPULE', label: 'Ampul' },
  { value: 'LITER', label: 'Litre' },
];

function todayStart(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

interface PharmacyModalProps {
  opened: boolean;
  onClose: () => void;
  item: MedicalItem | null;
  onSaved?: () => void;
}

export function PharmacyModal({ opened, onClose, item, onSaved }: PharmacyModalProps) {
  const addItem = usePharmacyStore((s) => s.addItem);
  const updateItem = usePharmacyStore((s) => s.updateItem);

  const form = useForm({
    initialValues: {
      name: '',
      category: 'DRUG' as MedicalCategory,
      stockQuantity: 0,
      unit: 'BOX' as MedicalUnit,
      criticalThreshold: 0,
      expiryDate: null as Date | null,
      batchNumber: '',
      location: '',
    },
    validate: {
      name: (v: string) => (!v?.trim() ? 'Ad girin' : null),
      category: (v: string) => (!v ? 'Kategori seçin' : null),
      stockQuantity: (v: number | null) => (v == null || v < 0 ? 'Geçerli miktar girin' : null),
      unit: (v: string) => (!v ? 'Birim seçin' : null),
      criticalThreshold: (v: number | null) => (v == null || v < 0 ? 'Kritik seviye girin' : null),
      expiryDate: (v: Date | null) => {
        if (!v) return 'Son kullanma tarihi seçin';
        const today = todayStart();
        const exp = new Date(v);
        exp.setHours(0, 0, 0, 0);
        if (!item && exp.getTime() < today.getTime()) {
          return 'Yeni ürün için miad tarihi geçmiş olamaz';
        }
        return null;
      },
      location: (v: string) => (!v?.trim() ? 'Lokasyon girin' : null),
    },
  });

  useEffect(() => {
    if (opened) {
      if (item) {
        const exp = item.expiryDate instanceof Date ? item.expiryDate : new Date(item.expiryDate);
        form.setValues({
          name: item.name,
          category: item.category,
          stockQuantity: item.stockQuantity,
          unit: item.unit,
          criticalThreshold: item.criticalThreshold,
          expiryDate: exp,
          batchNumber: item.batchNumber ?? '',
          location: item.location ?? '',
        });
      } else {
        form.setValues({
          name: '',
          category: 'DRUG',
          stockQuantity: 0,
          unit: 'BOX',
          criticalThreshold: 0,
          expiryDate: null,
          batchNumber: '',
          location: '',
        });
      }
    }
  }, [opened, item]);

  const handleSubmit = form.onSubmit((values) => {
    if (!values.expiryDate) return;
    if (item) {
      updateItem(item.id, {
        name: values.name.trim(),
        category: values.category as MedicalCategory,
        stockQuantity: values.stockQuantity,
        unit: values.unit as MedicalUnit,
        criticalThreshold: values.criticalThreshold,
        expiryDate: values.expiryDate,
        batchNumber: values.batchNumber.trim() || '',
        location: values.location.trim(),
      });
      notifications.show({ title: 'Ürün güncellendi', message: '', color: 'green' });
    } else {
      addItem({
        name: values.name.trim(),
        category: values.category as MedicalCategory,
        stockQuantity: values.stockQuantity,
        unit: values.unit as MedicalUnit,
        criticalThreshold: values.criticalThreshold,
        expiryDate: values.expiryDate,
        batchNumber: values.batchNumber.trim() || '',
        location: values.location.trim(),
      });
      notifications.show({ title: 'Ürün eklendi', message: '', color: 'green' });
    }
    onSaved?.();
    onClose();
  });

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={item ? 'Stok Kalemi Düzenle' : 'Yeni Stok Kalemi'}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <Stack gap="md">
          <Select
            label="Kategori"
            data={CATEGORY_OPTIONS}
            {...form.getInputProps('category')}
          />
          <Autocomplete
            label="İlaç / Ürün Adı"
            placeholder="Yazın veya listeden seçin"
            data={getSuggestionsByCategory(form.values.category)}
            {...form.getInputProps('name')}
            onOptionSubmit={(optionValue) => {
              form.setFieldValue('name', optionValue);
              const standard = findStandardItemByLabel(optionValue);
              if (standard) form.setFieldValue('unit', standard.defaultUnit);
            }}
          />
          <Group grow>
            <NumberInput
              label="Mevcut Stok"
              min={0}
              {...form.getInputProps('stockQuantity')}
            />
            <Select
              label="Birim"
              data={UNIT_OPTIONS}
              {...form.getInputProps('unit')}
            />
          </Group>
          <NumberInput
            label="Kritik Seviye (Min. stok uyarısı)"
            min={0}
            description="Stok bu değerin altına düşünce uyarı verilir"
            {...form.getInputProps('criticalThreshold')}
          />
          <DatePickerInput
            label="Son Kullanma Tarihi (Miad)"
            valueFormat="DD.MM.YYYY"
            {...form.getInputProps('expiryDate')}
          />
          <TextInput
            label="Parti No"
            placeholder="Opsiyonel"
            {...form.getInputProps('batchNumber')}
          />
          <TextInput
            label="Lokasyon"
            placeholder="Örn: Dolap 1, Raf 2"
            {...form.getInputProps('location')}
          />
          <Group justify="flex-end" mt="md">
            <Button variant="default" onClick={onClose}>
              İptal
            </Button>
            <Button type="submit">
              {item ? 'Güncelle' : 'Kaydet'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
