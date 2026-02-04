import { useState, useMemo } from 'react';
import {
  Title,
  Text as MantineText,
  Button,
  Group,
  Stack,
  Card,
  SimpleGrid,
  Modal,
  Badge,
  Avatar,
  ActionIcon,
  MultiSelect,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconFlame,
  IconRocket,
  IconShield,
  IconHeartbeat,
  IconUserMinus,
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import {
  useEmergencyTeamStore,
  type EmergencyTeamType,
} from '@store/emergencyTeamStore';
import { useWorkerStore } from '@store/workerStore';
import { useAppStore } from '@shared/stores/appStore';

const TEAM_ICONS: Record<EmergencyTeamType, typeof IconFlame> = {
  Söndürme: IconFlame,
  Kurtarma: IconRocket,
  Koruma: IconShield,
  'İlk Yardım': IconHeartbeat,
};

export function EmergencyTeamsPage() {
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const workers = useWorkerStore((s) => s.workers);
  const teams = useEmergencyTeamStore((s) => s.teams);
  const addMemberToTeam = useEmergencyTeamStore((s) => s.addMemberToTeam);
  const removeMember = useEmergencyTeamStore((s) => s.removeMember);

  const [modalOpened, { open: openModal, close: closeModal }] = useDisclosure(false);
  const [selectedTeamType, setSelectedTeamType] = useState<EmergencyTeamType | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);

  const workerOptions = useMemo(() => {
    let list = workers;
    if (selectedCompanyId) list = list.filter((w) => w.companyId === selectedCompanyId);
    return list.map((w) => ({
      value: w.id,
      label: `${w.nameSurname}${w.jobTitle ? ` · ${w.jobTitle}` : ''}`,
    }));
  }, [workers, selectedCompanyId]);

  const openAddModal = (teamType: EmergencyTeamType) => {
    setSelectedTeamType(teamType);
    const team = teams.find((t) => t.type === teamType);
    setSelectedEmployeeIds([]);
    openModal();
  };

  const handleCloseModal = () => {
    closeModal();
    setSelectedTeamType(null);
    setSelectedEmployeeIds([]);
  };

  const handleAddMembers = () => {
    if (!selectedTeamType || selectedEmployeeIds.length === 0) {
      notifications.show({
        title: 'Personel seçin',
        message: 'En az bir personel seçin.',
        color: 'red',
      });
      return;
    }
    const team = teams.find((t) => t.type === selectedTeamType);
    const existingIds = new Set(team?.members.map((m) => m.employeeId) ?? []);
    let added = 0;
    selectedEmployeeIds.forEach((empId) => {
      if (existingIds.has(empId)) return;
      const w = workers.find((x) => x.id === empId);
      if (!w) return;
      addMemberToTeam(selectedTeamType, {
        employeeId: w.id,
        name: w.nameSurname,
        role: w.jobTitle ?? '',
        phone: 'mobileNo' in w && typeof w.mobileNo === 'string' ? w.mobileNo : '',
      });
      existingIds.add(empId);
      added++;
    });
    notifications.show({
      title: 'Ekip güncellendi',
      message: `${added} personel eklendi.`,
      color: 'green',
    });
    handleCloseModal();
  };

  const handleRemoveMember = (teamType: EmergencyTeamType, employeeId: string) => {
    removeMember(teamType, employeeId);
    notifications.show({
      title: 'Personel çıkarıldı',
      message: 'Ekipten kaldırıldı.',
      color: 'gray',
    });
  };

  return (
    <>
      <Stack gap="md">
        <div>
          <Title order={2}>Ekip Belirleme</Title>
          <MantineText c="dimmed" size="sm">
            Acil durum ekiplerine personel atayın (Söndürme, Kurtarma, Koruma, İlk Yardım).
          </MantineText>
        </div>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
          {teams.map((team) => {
            const Icon = TEAM_ICONS[team.type];
            return (
              <Card
                key={team.id}
                withBorder
                padding="lg"
                radius="md"
                shadow="sm"
                style={{ borderTopWidth: 4, borderTopColor: `var(--mantine-color-${team.color}-6)` }}
              >
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <Icon size={28} color={`var(--mantine-color-${team.color}-6)`} />
                      <MantineText fw={700} size="lg">
                        {team.type} Ekibi
                      </MantineText>
                    </Group>
                    <Badge size="lg" color={team.color} variant="light">
                      {team.members.length}
                    </Badge>
                  </Group>

                  <Stack gap="xs">
                    {team.members.length === 0 ? (
                      <MantineText size="sm" c="dimmed">
                        Henüz personel atanmadı.
                      </MantineText>
                    ) : (
                      team.members.map((member) => (
                        <Group key={member.employeeId} justify="space-between" wrap="nowrap">
                          <Group gap="sm" wrap="nowrap" style={{ minWidth: 0 }}>
                            <Avatar color={team.color} radius="xl" size="sm">
                              {member.name.slice(0, 2).toUpperCase()}
                            </Avatar>
                            <div style={{ minWidth: 0 }}>
                              <MantineText size="sm" fw={500} truncate>
                                {member.name}
                              </MantineText>
                              {member.role && (
                                <MantineText size="xs" c="dimmed" truncate>
                                  {member.role}
                                </MantineText>
                              )}
                            </div>
                          </Group>
                          <ActionIcon
                            variant="subtle"
                            color="red"
                            size="sm"
                            onClick={() => handleRemoveMember(team.type, member.employeeId)}
                            aria-label="Ekipten çıkar"
                          >
                            <IconUserMinus size={16} />
                          </ActionIcon>
                        </Group>
                      ))
                    )}
                  </Stack>

                  <Button
                    variant="light"
                    color={team.color}
                    leftSection={<IconPlus size={16} />}
                    onClick={() => openAddModal(team.type)}
                  >
                    Personel Ekle
                  </Button>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </Stack>

      <Modal
        opened={modalOpened}
        onClose={handleCloseModal}
        title={selectedTeamType ? `${selectedTeamType} Ekibi - Personel Ekle` : 'Personel seçin'}
        size="md"
      >
        <Stack gap="md">
          <MultiSelect
            label="Personel (çoklu seçim)"
            placeholder="Ara veya seç..."
            data={workerOptions}
            value={selectedEmployeeIds}
            onChange={setSelectedEmployeeIds}
            searchable
            clearable
            hidePickedOptions
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={handleCloseModal}>
              İptal
            </Button>
            <Button onClick={handleAddMembers}>Ekle</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
