import { useMemo, useState } from 'react';
import {
  Title,
  Text,
  Button,
  Group,
  Stack,
  Paper,
  Box,
  Badge,
  ScrollArea,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconPlus } from '@tabler/icons-react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { tr } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAppointmentStore, type Appointment, type AppointmentStatus } from '../stores/appointmentStore';
import { useWorkerStore } from '@store/workerStore';
import { useAuthStore } from '@shared/stores/authStore';
import { useAppStore } from '@shared/stores/appStore';
import { AppointmentModal } from '../components/AppointmentModal';
import { APPOINTMENT_TYPE_OPTIONS } from '../components/AppointmentModal';

const locales = { tr };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const MESSAGES = {
  date: 'Tarih',
  time: 'Saat',
  event: 'Randevu',
  allDay: 'Tüm gün',
  week: 'Hafta',
  work_week: 'Çalışma haftası',
  day: 'Gün',
  month: 'Ay',
  previous: 'Önceki',
  next: 'Sonraki',
  yesterday: 'Dün',
  tomorrow: 'Yarın',
  today: 'Bugün',
  agenda: 'Ajanda',
  noEventsInRange: 'Bu aralıkta randevu yok.',
  showMore: (total: number) => `+${total} daha`,
};

const TYPE_COLORS: Record<string, string> = {
  PERIODIC_EXAM: '#228be6',
  JOB_ENTRY: '#4c6ef5',
  POLYCLINIC: '#15aabf',
  VACCINATION: '#40c057',
  OTHER: '#868e96',
};

const STATUS_LABELS: Record<AppointmentStatus, string> = {
  SCHEDULED: 'Planlandı',
  CHECKED_IN: 'Geldi',
  COMPLETED: 'Tamamlandı',
  CANCELLED: 'İptal',
  NO_SHOW: 'Gelmedi',
};

type CalendarEvent = Appointment & { title: string; start: Date; end: Date };

function appointmentToEvent(apt: Appointment, workerName: string): CalendarEvent {
  const start = apt.start instanceof Date ? apt.start : new Date(apt.start);
  const end = apt.end instanceof Date ? apt.end : new Date(apt.end);
  return {
    ...apt,
    title: workerName,
    start,
    end,
  };
}

export function AppointmentPage() {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const appointments = useAppointmentStore((s) => s.appointments);
  const getAppointmentsByDateRange = useAppointmentStore((s) => s.getAppointmentsByDateRange);
  const updateStatus = useAppointmentStore((s) => s.updateStatus);
  const getWorkerById = useWorkerStore((s) => s.getWorkerById);
  const getUserById = useAuthStore((s) => s.getUserById);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [slotStart, setSlotStart] = useState<Date | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date());

  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return appointments
      .filter((a) => {
        const w = getWorkerById(a.workerId);
        return !selectedCompanyId || w?.companyId === selectedCompanyId;
      })
      .map((a) =>
        appointmentToEvent(a, getWorkerById(a.workerId)?.nameSurname ?? a.workerId)
      );
  }, [appointments, selectedCompanyId, getWorkerById]);

  const todayStart = useMemo(() => {
    const d = new Date(currentDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);
  const todayEnd = useMemo(() => {
    const d = new Date(currentDate);
    d.setHours(23, 59, 59, 999);
    return d;
  }, [currentDate]);

  const todaysAppointments = useMemo(() => {
    return getAppointmentsByDateRange(todayStart, todayEnd).filter(
      (a) => a.status !== 'CANCELLED'
    );
  }, [appointments, getAppointmentsByDateRange, todayStart, todayEnd]);

  const handleSelectSlot = (slot: { start: Date; end: Date }) => {
    setEditingAppointment(null);
    setSlotStart(slot.start);
    openModal();
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    const apt = useAppointmentStore.getState().getAppointmentById(event.id);
    if (apt) {
      setEditingAppointment(apt);
      setSlotStart(null);
      openModal();
    }
  };

  const handleModalClose = () => {
    closeModal();
    setEditingAppointment(null);
    setSlotStart(null);
  };

  const handleNewClick = () => {
    setEditingAppointment(null);
    setSlotStart(new Date());
    openModal();
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const color = TYPE_COLORS[event.type] ?? TYPE_COLORS.OTHER;
    return { style: { backgroundColor: color } };
  };

  return (
    <>
      <Stack gap="md" h="100%">
        <Group justify="space-between" wrap="wrap">
          <div>
            <Title order={2}>Randevu / Planlama</Title>
            <Text c="dimmed" size="sm">
              Muayene ve poliklinik randevularını planlayın
            </Text>
          </div>
          <Button leftSection={<IconPlus size={16} />} onClick={handleNewClick}>
            Yeni Randevu
          </Button>
        </Group>

        <Group align="stretch" wrap="nowrap" gap="md" style={{ flex: 1, minHeight: 500 }}>
          <Paper withBorder p="md" style={{ flex: '0 0 70%', minWidth: 0 }}>
            <Box style={{ height: 520 }}>
              <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                titleAccessor="title"
                style={{ height: '100%' }}
                onSelectSlot={handleSelectSlot}
                onSelectEvent={handleSelectEvent}
                onNavigate={setCurrentDate}
                onView={() => {}}
                date={currentDate}
                eventPropGetter={eventStyleGetter}
                messages={MESSAGES}
                selectable
                views={['month', 'week', 'day', 'agenda']}
                defaultView="week"
              />
            </Box>
          </Paper>

          <Paper withBorder p="md" style={{ flex: '0 0 calc(30% - 8px)', minWidth: 200 }}>
            <Title order={5} mb="sm">
              Bugünün Randevuları
            </Title>
            <Text size="xs" c="dimmed" mb="xs">
              {format(currentDate, 'd MMMM yyyy, EEEE', { locale: tr })}
            </Text>
            <ScrollArea h={480} type="auto">
              {todaysAppointments.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Bugün için randevu yok.
                </Text>
              ) : (
                <Stack gap="xs">
                  {todaysAppointments.map((apt) => {
                    const worker = getWorkerById(apt.workerId);
                    const doctor = getUserById(apt.doctorId);
                    const typeOpt = APPOINTMENT_TYPE_OPTIONS.find((o) => o.value === apt.type);
                    const start = apt.start instanceof Date ? apt.start : new Date(apt.start);
                    return (
                      <Paper key={apt.id} p="sm" withBorder>
                        <Group justify="space-between" wrap="nowrap" gap="xs">
                          <div>
                            <Text size="sm" fw={500}>
                              {worker?.nameSurname ?? apt.workerId}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {format(start, 'HH:mm')} — {typeOpt?.label ?? apt.type}
                            </Text>
                            {doctor && (
                              <Text size="xs" c="dimmed">
                                {doctor.firstName} {doctor.lastName}
                              </Text>
                            )}
                          </div>
                          <Badge size="sm" variant="light" color={typeOpt?.color ?? 'gray'}>
                            {STATUS_LABELS[apt.status]}
                          </Badge>
                        </Group>
                        {apt.status === 'SCHEDULED' && (
                          <Group gap="xs" mt="xs">
                            <Button
                              size="xs"
                              variant="light"
                              color="green"
                              onClick={() => updateStatus(apt.id, 'CHECKED_IN')}
                            >
                              Geldi
                            </Button>
                            <Button
                              size="xs"
                              variant="light"
                              color="blue"
                              disabled
                              title="Önce 'Geldi' ile giriş yapın"
                            >
                              Tamamla
                            </Button>
                          </Group>
                        )}
                        {apt.status === 'CHECKED_IN' && (
                          <Group gap="xs" mt="xs">
                            <Button
                              size="xs"
                              variant="light"
                              color="blue"
                              onClick={() => updateStatus(apt.id, 'COMPLETED')}
                            >
                              Tamamla
                            </Button>
                          </Group>
                        )}
                      </Paper>
                    );
                  })}
                </Stack>
              )}
            </ScrollArea>
          </Paper>
        </Group>
      </Stack>

      <AppointmentModal
        opened={modalOpened}
        onClose={handleModalClose}
        appointment={editingAppointment}
        initialStart={slotStart}
        onSaved={() => {}}
      />
    </>
  );
}
