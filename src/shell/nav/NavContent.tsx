import { useEffect } from 'react';
import {
  Stack,
  Text,
  Box,
  UnstyledButton,
  Divider,
  Collapse,
  SegmentedControl,
  ScrollArea,
  Select,
} from '@mantine/core';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useMediaQuery, useDisclosure } from '@mantine/hooks';
import {
  IconHome,
  IconAlertTriangle,
  IconUsers,
  IconSchool,
  IconBuilding,
  IconChevronDown,
  IconChevronRight,
  IconSitemap,
  IconTruck,
  IconUserCircle,
  IconMail,
  IconShield,
  IconHeartbeat,
  IconArchive,
  IconPuzzle,
  IconSettings,
  IconBriefcase,
} from '@tabler/icons-react';
import { useTranslation } from '@shared/i18n';
import { useAppStore } from '@shared/stores/appStore';
import { useAuthStore, type UserRole } from '@shared/stores/authStore';
import { useCompanyStore } from '@store/companyStore';

const ALL_ROLES: UserRole[] = ['Admin', 'Hekim', 'IsgUzman', 'GenelKullanici', 'DemoHekim', 'DemoUzman', 'DemoGenel'];
const SAFETY_ROLES: UserRole[] = ['Admin', 'IsgUzman', 'GenelKullanici', 'DemoUzman', 'DemoGenel'];
const HEALTH_ROLES: UserRole[] = ['Admin', 'Hekim', 'GenelKullanici', 'DemoHekim', 'DemoGenel'];
const ADMIN_ONLY: UserRole[] = ['Admin'];

function canAccess(userRole: UserRole | undefined, allowedRoles: UserRole[]): boolean {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

const mainNavItems = [
  { to: '/dashboard', labelKey: 'nav.home', icon: IconHome, allowedRoles: ALL_ROLES },
  { to: '/risk', labelKey: 'nav.risk', icon: IconAlertTriangle, allowedRoles: SAFETY_ROLES },
  { to: '/training', labelKey: 'nav.training', icon: IconSchool, allowedRoles: SAFETY_ROLES },
] as const;

const companySubItems = [
  { to: '/company', end: true, labelKey: 'company.menu.companies', icon: IconBuilding },
  { to: '/company/employees', end: false, labelKey: 'company.menu.employees', icon: IconUsers },
  { to: '/company/units', end: false, labelKey: 'company.menu.units', icon: IconSitemap },
  { to: '/company/subcontractors', end: false, labelKey: 'company.menu.subcontractors', icon: IconTruck },
  { to: '/company/representative', end: false, labelKey: 'company.menu.representative', icon: IconUserCircle },
  { to: '/company/mail-groups', end: false, labelKey: 'company.menu.mailGroups', icon: IconMail },
] as const;

const safetySubGroups = [
  {
    sectionLabelKey: 'nav.safetyPlans',
    links: [
      { to: '/safety/plans/annual-work', labelKey: 'nav.safetyPlansAnnualWork' },
      { to: '/safety/plans/annual-training', labelKey: 'nav.safetyPlansAnnualTraining' },
    ],
  },
  {
    sectionLabelKey: 'nav.safetyPpe',
    links: [
      { to: '/safety/ppe/equipment-list', labelKey: 'nav.safetyPpeEquipmentList' },
      { to: '/safety/ppe/custody-records', labelKey: 'nav.safetyPpeCustodyRecords' },
      { to: '/safety/ppe/requests', labelKey: 'nav.safetyPpeRequests' },
    ],
  },
  {
    sectionLabelKey: 'nav.safetyIncident',
    links: [
      { to: '/safety/incident/near-miss', labelKey: 'nav.safetyIncidentNearMiss' },
      { to: '/safety/incident/accident-records', labelKey: 'nav.safetyIncidentAccidentRecords' },
    ],
  },
  {
    sectionLabelKey: 'nav.safetyAudit',
    links: [
      { to: '/safety/audit/dof-list', labelKey: 'nav.safetyAuditDofList' },
      { to: '/safety/audit/site-audit', labelKey: 'nav.safetyAuditSiteAudit' },
      { to: '/safety/audit/nonconformities', labelKey: 'nav.safetyAuditNonconformities' },
      { to: '/safety/audit/checklists', labelKey: 'nav.safetyAuditChecklists' },
    ],
  },
  {
    sectionLabelKey: 'nav.safetyEmergency',
    links: [
      { to: '/safety/emergency/plans', labelKey: 'nav.safetyEmergencyPlans' },
      { to: '/safety/emergency/teams', labelKey: 'nav.safetyEmergencyTeams' },
      { to: '/safety/emergency/drills', labelKey: 'nav.safetyEmergencyDrills' },
      { to: '/safety/emergency/map', labelKey: 'nav.safetyEmergencyMap' },
    ],
  },
  {
    sectionLabelKey: 'nav.safetyEquipment',
    links: [
      { to: '/safety/equipment/list', labelKey: 'nav.safetyEquipmentList' },
      { to: '/safety/equipment/periodic', labelKey: 'nav.safetyEquipmentPeriodic' },
    ],
  },
  {
    sectionLabelKey: 'nav.safetyBoard',
    links: [
      { to: '/safety/board/meetings', labelKey: 'nav.safetyBoardMeetings' },
      { to: '/safety/board/suggestions', labelKey: 'nav.safetyBoardSuggestions' },
    ],
  },
] as const;

const healthSubGroups = [
  {
    sectionLabelKey: 'nav.healthPrescription',
    links: [
      { to: '/health/prescription/write', labelKey: 'nav.healthPrescriptionWrite' },
      { to: '/health/prescription/query', labelKey: 'nav.healthPrescriptionQuery' },
      { to: '/health/prescription/medication-list', labelKey: 'nav.healthPrescriptionMedicationList' },
    ],
  },
  {
    sectionLabelKey: 'nav.healthExamination',
    links: [
      { to: '/health/examination/polyclinic', labelKey: 'nav.healthExaminationPolyclinic' },
      { to: '/health/examination/entry-periodic', labelKey: 'nav.healthExaminationEntryPeriodic' },
      { to: '/health/examination/vaccination', labelKey: 'nav.healthExaminationVaccination' },
      { to: '/health/examination/appointments', labelKey: 'nav.healthExaminationAppointments' },
    ],
  },
  {
    sectionLabelKey: 'nav.healthOther',
    links: [
      { to: '/health/other/tests', labelKey: 'nav.healthOtherTests' },
      { to: '/health/other/medicine-cabinet', labelKey: 'nav.healthOtherMedicineCabinet' },
    ],
  },
] as const;

const archiveSubGroups = [
  {
    sectionLabelKey: 'nav.archiveDocs',
    links: [
      { to: '/archive/documents/ohs', labelKey: 'nav.archiveDocsOhs' },
      { to: '/archive/documents/employee', labelKey: 'nav.archiveDocsEmployee' },
      { to: '/archive/documents/company', labelKey: 'nav.archiveDocsCompany' },
    ],
  },
  {
    sectionLabelKey: 'nav.reports',
    links: [
      { to: '/archive/reports/training', labelKey: 'nav.reportsTraining' },
      { to: '/archive/reports/accident-stats', labelKey: 'nav.reportsAccidentStats' },
      { to: '/archive/reports/prescription', labelKey: 'nav.reportsPrescription' },
      { to: '/archive/reports/monthly-activity', labelKey: 'nav.reportsMonthlyActivity' },
    ],
  },
] as const;

const extraSubGroups = [
  {
    sectionLabelKey: 'nav.extraRemoteTraining',
    links: [
      { to: '/extra/remote-training/content', labelKey: 'nav.extraRemoteTrainingContent' },
      { to: '/extra/remote-training/exams', labelKey: 'nav.extraRemoteTrainingExams' },
      { to: '/extra/remote-training/assignments', labelKey: 'nav.extraRemoteTrainingAssignments' },
    ],
  },
  {
    sectionLabelKey: 'nav.extraVisitor',
    links: [
      { to: '/extra/visitor/records', labelKey: 'nav.extraVisitorRecords' },
      { to: '/extra/visitor/cards', labelKey: 'nav.extraVisitorCards' },
    ],
  },
  {
    sectionLabelKey: 'nav.extraAnnouncements',
    links: [{ to: '/extra/announcements', labelKey: 'nav.extraAnnouncements' }],
  },
] as const;

interface NavContentProps {
  /** Called when a nav item is clicked (closes mobile navbar) */
  onNavigate?: () => void;
}

function renderSubGroupLinks(
  subGroups: readonly { sectionLabelKey: string; links: readonly { to: string; labelKey: string }[] }[],
  location: { pathname: string },
  t: (k: string) => string,
  useClickHandler: boolean,
  handleNavClick: (to: string) => void,
  linkStyle: (active: boolean) => React.CSSProperties
) {
  return subGroups.map((group) => (
    <Box key={group.sectionLabelKey} mb="xs">
      <Text size="xs" fw={600} c="dimmed" mb={4} pl={8}>
        {t(group.sectionLabelKey)}
      </Text>
      <Stack gap={2}>
        {group.links.map(({ to, labelKey }) => {
          const active = location.pathname === to;
          const style = linkStyle(active);
          return useClickHandler ? (
            <UnstyledButton key={to} onClick={() => handleNavClick(to)} style={style}>
              <span>{t(labelKey)}</span>
            </UnstyledButton>
          ) : (
            <UnstyledButton key={to} component={Link} to={to} style={style}>
              <span>{t(labelKey)}</span>
            </UnstyledButton>
          );
        })}
      </Stack>
    </Box>
  ));
}

/**
 * NavContent: 3-section fixed-height flex layout
 * [Header (flex: 0 0 auto)] - Company Select (mobile only)
 * [ScrollArea (flex: 1, minHeight: 0)] - Menu items
 * [Footer (flex: 0 0 auto)] - Language switcher
 */
export function NavContent({ onNavigate }: NavContentProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, locale } = useTranslation();
  const setLocale = useAppStore((s) => s.setLocale);
  const selectedCompanyId = useAppStore((s) => s.selectedCompanyId);
  const setSelectedCompanyId = useAppStore((s) => s.setSelectedCompanyId);
  const companies = useCompanyStore((s) => s.companies);
  const userRole = useAuthStore((s) => s.currentUser?.role);
  const isMobile = useMediaQuery('(max-width: 47.99em)');

  const isCompanyPath = location.pathname.startsWith('/company');
  const isSafetyPath = location.pathname.startsWith('/safety');
  const isHealthPath = location.pathname.startsWith('/health');
  const isArchivePath = location.pathname.startsWith('/archive');
  const isExtraPath = location.pathname.startsWith('/extra');
  const isSettingsPath = location.pathname.startsWith('/settings');

  const [companyOpen, { toggle: toggleCompany, open: openCompany }] = useDisclosure(isCompanyPath);
  const [safetyOpen, { toggle: toggleSafety, open: openSafety }] = useDisclosure(isSafetyPath);
  const [healthOpen, { toggle: toggleHealth, open: openHealth }] = useDisclosure(isHealthPath);
  const [archiveOpen, { toggle: toggleArchive, open: openArchive }] = useDisclosure(isArchivePath);
  const [extraOpen, { toggle: toggleExtra, open: openExtra }] = useDisclosure(isExtraPath);

  useEffect(() => {
    if (isCompanyPath) openCompany();
  }, [isCompanyPath, openCompany]);
  useEffect(() => {
    if (isSafetyPath) openSafety();
  }, [isSafetyPath, openSafety]);
  useEffect(() => {
    if (isHealthPath) openHealth();
  }, [isHealthPath, openHealth]);
  useEffect(() => {
    if (isArchivePath) openArchive();
  }, [isArchivePath, openArchive]);
  useEffect(() => {
    if (isExtraPath) openExtra();
  }, [isExtraPath, openExtra]);

  const handleNavClick = (to: string) => {
    navigate(to);
    onNavigate?.();
  };

  const useClickHandler = Boolean(onNavigate);

  const linkStyle = (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    padding: '6px 12px',
    paddingLeft: 36,
    borderRadius: 'var(--mantine-radius-sm)',
    fontWeight: 500,
    fontSize: 'var(--mantine-font-size-sm)',
    backgroundColor: isActive ? 'var(--mantine-primary-light)' : 'transparent',
    color: isActive ? 'var(--mantine-primary-light-color)' : 'var(--mantine-color-text)',
  });

  const nestedLinkStyle = (isActive: boolean) => ({
    ...linkStyle(isActive),
    paddingLeft: 24,
  });

  const companyOptions = [
    { value: '', label: t('common.allCompanies') },
    ...companies.map((c) => ({ value: c.id, label: c.name })),
  ];

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* SECTION 1: HEADER (Fixed) - Mobile-only Company Select */}
      {isMobile && (
        <Box
          p="sm"
          style={{
            flex: '0 0 auto',
            borderBottom: '1px solid var(--mantine-color-default-border)',
          }}
        >
          <Text fw={500} size="xs" c="dimmed" mb="xs">
            {t('common.company')}
          </Text>
          <Select
            size="sm"
            leftSection={<IconBuilding size={16} />}
            placeholder={t('common.company')}
            data={companyOptions}
            value={selectedCompanyId ?? ''}
            onChange={(v) => setSelectedCompanyId(v === '' ? null : v)}
            clearable={false}
            aria-label={t('common.company')}
            style={{ width: '100%' }}
          />
        </Box>
      )}

      {/* SECTION 2: SCROLLABLE MENU (flex: 1) */}
      <ScrollArea
        type="auto"
        style={{
          flex: 1,
          minHeight: 0,
        }}
      >
        <Box p="sm" pb="md">
          <Text fw={600} size="sm" c="dimmed" px="xs" mb="xs">
            {t('nav.modules')}
          </Text>
          <Divider mb="sm" />
          <Stack gap={2}>
            {/* Main nav items - filtered by role */}
            {mainNavItems
              .filter((item) => canAccess(userRole, [...item.allowedRoles]))
              .map(({ to, labelKey, icon: Icon }) =>
                useClickHandler ? (
                  <UnstyledButton
                    key={to}
                    onClick={() => handleNavClick(to)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--mantine-radius-sm)',
                      fontWeight: 500,
                      backgroundColor:
                        location.pathname === to ? 'var(--mantine-primary-light)' : 'transparent',
                      color:
                        location.pathname === to
                          ? 'var(--mantine-primary-light-color)'
                          : 'var(--mantine-color-text)',
                    }}
                  >
                    <Icon size={20} stroke={1.5} style={{ marginRight: 12, flexShrink: 0 }} />
                    <span>{t(labelKey)}</span>
                  </UnstyledButton>
                ) : (
                  <UnstyledButton
                    key={to}
                    component={Link}
                    to={to}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--mantine-radius-sm)',
                      fontWeight: 500,
                      backgroundColor:
                        location.pathname === to ? 'var(--mantine-primary-light)' : 'transparent',
                      color:
                        location.pathname === to
                          ? 'var(--mantine-primary-light-color)'
                          : 'var(--mantine-color-text)',
                    }}
                  >
                    <Icon size={20} stroke={1.5} style={{ marginRight: 12, flexShrink: 0 }} />
                    <span>{t(labelKey)}</span>
                  </UnstyledButton>
                )
              )}

            {/* Company Management - visible to ALL */}
            {canAccess(userRole, ALL_ROLES) && (
              <Box>
                <UnstyledButton
                  onClick={toggleCompany}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--mantine-radius-sm)',
                    fontWeight: 500,
                    backgroundColor: isCompanyPath ? 'var(--mantine-primary-light)' : 'transparent',
                    color: isCompanyPath
                      ? 'var(--mantine-primary-light-color)'
                      : 'var(--mantine-color-text)',
                  }}
                >
                  <IconBuilding size={20} stroke={1.5} style={{ marginRight: 12, flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{t('nav.company')}</span>
                  {companyOpen ? (
                    <IconChevronDown size={16} style={{ flexShrink: 0 }} />
                  ) : (
                    <IconChevronRight size={16} style={{ flexShrink: 0 }} />
                  )}
                </UnstyledButton>
                <Collapse in={companyOpen}>
                  <Stack
                    gap={2}
                    py="xs"
                    pl="xs"
                    style={{ borderLeft: '2px solid var(--mantine-color-default-border)', marginLeft: 8 }}
                  >
                    {companySubItems.map(({ to, labelKey, icon: Icon }) => {
                      const active =
                        to === '/company'
                          ? location.pathname === '/company'
                          : location.pathname.startsWith(to);
                      return useClickHandler ? (
                        <UnstyledButton key={to} onClick={() => handleNavClick(to)} style={linkStyle(active)}>
                          <Icon size={18} stroke={1.5} style={{ marginRight: 10, flexShrink: 0 }} />
                          <span>{t(labelKey)}</span>
                        </UnstyledButton>
                      ) : (
                        <UnstyledButton key={to} component={Link} to={to} style={linkStyle(active)}>
                          <Icon size={18} stroke={1.5} style={{ marginRight: 10, flexShrink: 0 }} />
                          <span>{t(labelKey)}</span>
                        </UnstyledButton>
                      );
                    })}
                  </Stack>
                </Collapse>
              </Box>
            )}

            {/* İş Güvenliği (Occupational Safety) - visible to ADMIN, SPECIALIST, GENERAL */}
            {canAccess(userRole, SAFETY_ROLES) && (
              <Box>
                <UnstyledButton
                  onClick={toggleSafety}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--mantine-radius-sm)',
                    fontWeight: 500,
                    backgroundColor: isSafetyPath ? 'var(--mantine-primary-light)' : 'transparent',
                    color: isSafetyPath
                      ? 'var(--mantine-primary-light-color)'
                      : 'var(--mantine-color-text)',
                  }}
                >
                  <IconShield size={20} stroke={1.5} style={{ marginRight: 12, flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{t('nav.safety')}</span>
                  {safetyOpen ? (
                    <IconChevronDown size={16} style={{ flexShrink: 0 }} />
                  ) : (
                    <IconChevronRight size={16} style={{ flexShrink: 0 }} />
                  )}
                </UnstyledButton>
                <Collapse in={safetyOpen}>
                  <Stack
                    gap={2}
                    py="xs"
                    pl="xs"
                    style={{ borderLeft: '2px solid var(--mantine-color-default-border)', marginLeft: 8 }}
                  >
                    {renderSubGroupLinks(
                      safetySubGroups,
                      location,
                      t,
                      useClickHandler,
                      handleNavClick,
                      nestedLinkStyle
                    )}
                  </Stack>
                </Collapse>
              </Box>
            )}

            {/* İş Sağlığı (Occupational Health) - visible to ADMIN, DOCTOR, GENERAL */}
            {canAccess(userRole, HEALTH_ROLES) && (
              <Box>
                <UnstyledButton
                  onClick={toggleHealth}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--mantine-radius-sm)',
                    fontWeight: 500,
                    backgroundColor: isHealthPath ? 'var(--mantine-primary-light)' : 'transparent',
                    color: isHealthPath
                      ? 'var(--mantine-primary-light-color)'
                      : 'var(--mantine-color-text)',
                  }}
                >
                  <IconHeartbeat size={20} stroke={1.5} style={{ marginRight: 12, flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{t('nav.health')}</span>
                  {healthOpen ? (
                    <IconChevronDown size={16} style={{ flexShrink: 0 }} />
                  ) : (
                    <IconChevronRight size={16} style={{ flexShrink: 0 }} />
                  )}
                </UnstyledButton>
                <Collapse in={healthOpen}>
                  <Stack
                    gap={2}
                    py="xs"
                    pl="xs"
                    style={{ borderLeft: '2px solid var(--mantine-color-default-border)', marginLeft: 8 }}
                  >
                    {renderSubGroupLinks(
                      healthSubGroups,
                      location,
                      t,
                      useClickHandler,
                      handleNavClick,
                      nestedLinkStyle
                    )}
                  </Stack>
                </Collapse>
              </Box>
            )}

            {/* Arşiv ve Raporlar - visible to ALL */}
            {canAccess(userRole, ALL_ROLES) && (
              <Box>
                <UnstyledButton
                  onClick={toggleArchive}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--mantine-radius-sm)',
                    fontWeight: 500,
                    backgroundColor: isArchivePath ? 'var(--mantine-primary-light)' : 'transparent',
                    color: isArchivePath
                      ? 'var(--mantine-primary-light-color)'
                      : 'var(--mantine-color-text)',
                  }}
                >
                  <IconArchive size={20} stroke={1.5} style={{ marginRight: 12, flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{t('nav.archive')}</span>
                  {archiveOpen ? (
                    <IconChevronDown size={16} style={{ flexShrink: 0 }} />
                  ) : (
                    <IconChevronRight size={16} style={{ flexShrink: 0 }} />
                  )}
                </UnstyledButton>
                <Collapse in={archiveOpen}>
                  <Stack
                    gap={2}
                    py="xs"
                    pl="xs"
                    style={{ borderLeft: '2px solid var(--mantine-color-default-border)', marginLeft: 8 }}
                  >
                    {renderSubGroupLinks(
                      archiveSubGroups,
                      location,
                      t,
                      useClickHandler,
                      handleNavClick,
                      nestedLinkStyle
                    )}
                  </Stack>
                </Collapse>
              </Box>
            )}

            {/* Ekstra Modüller (incl. Duyurular) - visible to ALL */}
            {canAccess(userRole, ALL_ROLES) && (
              <Box>
                <UnstyledButton
                  onClick={toggleExtra}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--mantine-radius-sm)',
                    fontWeight: 500,
                    backgroundColor: isExtraPath ? 'var(--mantine-primary-light)' : 'transparent',
                    color: isExtraPath
                      ? 'var(--mantine-primary-light-color)'
                      : 'var(--mantine-color-text)',
                  }}
                >
                  <IconPuzzle size={20} stroke={1.5} style={{ marginRight: 12, flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{t('nav.extra')}</span>
                  {extraOpen ? (
                    <IconChevronDown size={16} style={{ flexShrink: 0 }} />
                  ) : (
                    <IconChevronRight size={16} style={{ flexShrink: 0 }} />
                  )}
                </UnstyledButton>
                <Collapse in={extraOpen}>
                  <Stack
                    gap={2}
                    py="xs"
                    pl="xs"
                    style={{ borderLeft: '2px solid var(--mantine-color-default-border)', marginLeft: 8 }}
                  >
                    {renderSubGroupLinks(
                      extraSubGroups,
                      location,
                      t,
                      useClickHandler,
                      handleNavClick,
                      nestedLinkStyle
                    )}
                  </Stack>
                </Collapse>
              </Box>
            )}

            {/* Satış & CRM - ADMIN only */}
            {canAccess(userRole, ADMIN_ONLY) &&
              (useClickHandler ? (
                <UnstyledButton
                  onClick={() => handleNavClick('/crm/leads')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--mantine-radius-sm)',
                    fontWeight: 500,
                    backgroundColor: location.pathname.startsWith('/crm') ? 'var(--mantine-primary-light)' : 'transparent',
                    color: location.pathname.startsWith('/crm')
                      ? 'var(--mantine-primary-light-color)'
                      : 'var(--mantine-color-text)',
                  }}
                >
                  <IconBriefcase size={20} stroke={1.5} style={{ marginRight: 12, flexShrink: 0 }} />
                  <span>{t('nav.crm')}</span>
                </UnstyledButton>
              ) : (
                <UnstyledButton
                  component={Link}
                  to="/crm/leads"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--mantine-radius-sm)',
                    fontWeight: 500,
                    backgroundColor: location.pathname.startsWith('/crm') ? 'var(--mantine-primary-light)' : 'transparent',
                    color: location.pathname.startsWith('/crm')
                      ? 'var(--mantine-primary-light-color)'
                      : 'var(--mantine-color-text)',
                  }}
                >
                  <IconBriefcase size={20} stroke={1.5} style={{ marginRight: 12, flexShrink: 0 }} />
                  <span>{t('nav.crm')}</span>
                </UnstyledButton>
              ))}

            {/* Settings / User Management - ADMIN only */}
            {canAccess(userRole, ADMIN_ONLY) &&
              (useClickHandler ? (
                <UnstyledButton
                  onClick={() => handleNavClick('/settings')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--mantine-radius-sm)',
                    fontWeight: 500,
                    backgroundColor: isSettingsPath ? 'var(--mantine-primary-light)' : 'transparent',
                    color: isSettingsPath
                      ? 'var(--mantine-primary-light-color)'
                      : 'var(--mantine-color-text)',
                  }}
                >
                  <IconSettings size={20} stroke={1.5} style={{ marginRight: 12, flexShrink: 0 }} />
                  <span>{t('nav.userManagement')}</span>
                </UnstyledButton>
              ) : (
                <UnstyledButton
                  component={Link}
                  to="/settings"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 'var(--mantine-radius-sm)',
                    fontWeight: 500,
                    backgroundColor: isSettingsPath ? 'var(--mantine-primary-light)' : 'transparent',
                    color: isSettingsPath
                      ? 'var(--mantine-primary-light-color)'
                      : 'var(--mantine-color-text)',
                  }}
                >
                  <IconSettings size={20} stroke={1.5} style={{ marginRight: 12, flexShrink: 0 }} />
                  <span>{t('nav.userManagement')}</span>
                </UnstyledButton>
              ))}
          </Stack>
        </Box>
      </ScrollArea>

      {/* SECTION 3: FOOTER (Fixed) - Language switcher */}
      <Box
        p="sm"
        style={{
          flex: '0 0 auto',
          borderTop: '1px solid var(--mantine-color-default-border)',
        }}
      >
        <Text fw={500} size="xs" c="dimmed" mb="xs">
          {t('common.language')}
        </Text>
        <SegmentedControl
          size="sm"
          value={locale}
          onChange={(v) => setLocale(v === 'en' ? 'en' : 'tr')}
          data={[
            { label: t('common.en'), value: 'en' },
            { label: t('common.tr'), value: 'tr' },
          ]}
          aria-label={t('common.language')}
          fullWidth
        />
      </Box>
    </Box>
  );
}
