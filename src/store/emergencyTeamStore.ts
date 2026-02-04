import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type EmergencyTeamType = 'Söndürme' | 'Kurtarma' | 'Koruma' | 'İlk Yardım';

export interface TeamMember {
  employeeId: string;
  name: string;
  role: string;
  phone: string;
}

export interface EmergencyTeam {
  id: string;
  type: EmergencyTeamType;
  members: TeamMember[];
  color: string;
}

const TEAM_COLORS: Record<EmergencyTeamType, string> = {
  Söndürme: 'red',
  Kurtarma: 'orange',
  Koruma: 'blue',
  'İlk Yardım': 'green',
};

function generateTeamId(type: EmergencyTeamType): string {
  return `team-${type.replace(/\s/g, '-').toLowerCase()}`;
}

const INITIAL_TEAMS: EmergencyTeam[] = (
  ['Söndürme', 'Kurtarma', 'Koruma', 'İlk Yardım'] as EmergencyTeamType[]
).map((type) => ({
  id: generateTeamId(type),
  type,
  members: [],
  color: TEAM_COLORS[type],
}));

interface EmergencyTeamState {
  teams: EmergencyTeam[];
  addMemberToTeam: (teamType: EmergencyTeamType, member: TeamMember) => void;
  removeMember: (teamType: EmergencyTeamType, employeeId: string) => void;
  getTeamByType: (teamType: EmergencyTeamType) => EmergencyTeam | undefined;
}

export const useEmergencyTeamStore = create<EmergencyTeamState>()(
  persist(
    (set, get) => ({
      teams: INITIAL_TEAMS,

      addMemberToTeam: (teamType, member) => {
        set((state) => ({
          teams: state.teams.map((t) => {
            if (t.type !== teamType) return t;
            const exists = t.members.some((m) => m.employeeId === member.employeeId);
            if (exists) return t;
            return { ...t, members: [...t.members, member] };
          }),
        }));
      },

      removeMember: (teamType, employeeId) => {
        set((state) => ({
          teams: state.teams.map((t) =>
            t.type === teamType
              ? { ...t, members: t.members.filter((m) => m.employeeId !== employeeId) }
              : t
          ),
        }));
      },

      getTeamByType: (teamType) => get().teams.find((t) => t.type === teamType),
    }),
    { name: 'ohs-emergency-teams', partialize: (s) => ({ teams: s.teams }) }
  )
);

export { TEAM_COLORS };
