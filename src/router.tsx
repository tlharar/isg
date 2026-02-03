import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthRoot } from '@auth/AuthRoot';
import { LoginOrRedirect } from '@auth/LoginOrRedirect';
import { SignUpOrRedirect } from '@auth/SignUpOrRedirect';
import { RequireAuthLayout } from '@auth/RequireAuthLayout';
import { RequireAdmin } from '@auth/RequireAdmin';
import { PlaceholderPage } from '@shared/components/PlaceholderPage';
import { HomePage } from '@domains/dashboard/pages/HomePage';
import { RiskListPage } from '@domains/risk/pages/RiskListPage';
import { RiskNewPage } from '@domains/risk/pages/RiskNewPage';
import { EducationPage } from '@domains/training/pages/EducationPage';
import { CompanyLayout } from '@domains/company/layout/CompanyLayout';
import { CompanyListPage } from '@domains/company/pages/CompanyListPage';
import { CompanyEmployeesPage } from '@domains/company/pages/CompanyEmployeesPage';
import { UnitsPage } from '@domains/company/pages/UnitsPage';
import { SubcontractorsPage } from '@domains/company/pages/SubcontractorsPage';
import { RepresentativePage } from '@domains/company/pages/RepresentativePage';
import { MailGroupsPage } from '@domains/company/pages/MailGroupsPage';
import { SafetyLayout } from '@domains/safety/layout/SafetyLayout';
import { HealthLayout } from '@domains/health/layout/HealthLayout';
import { HealthPage } from '@domains/health/pages/HealthPage';
import { IncidentPage } from '@domains/incident/pages/IncidentPage';
import { PpePage } from '@domains/ppe/pages/PpePage';
import { ArchiveLayout } from '@domains/archive/layout/ArchiveLayout';
import { ExtraLayout } from '@domains/extra/layout/ExtraLayout';
import { CrmLayout } from '@domains/crm/layout/CrmLayout';
import { LeadOsgbPage } from '@domains/crm/pages/LeadOsgbPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AuthRoot />,
    children: [
      { index: true, element: <LoginOrRedirect /> },
      { path: 'signup', element: <SignUpOrRedirect /> },
      {
        element: <RequireAuthLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard', element: <HomePage /> },
          { path: 'risk', element: <RiskListPage /> },
          { path: 'risk/new', element: <RiskNewPage /> },
          { path: 'personnel', element: <Navigate to="/company/employees" replace /> },
          { path: 'personnel/new', element: <Navigate to="/company/employees" replace /> },
          { path: 'training', element: <EducationPage /> },
          { path: 'incidents', element: <IncidentPage /> },
          { path: 'ppe', element: <PpePage /> },
          { path: 'worker', element: <Navigate to="/company/employees" replace /> },
          { path: 'worker/new', element: <Navigate to="/company/employees" replace /> },
          { path: 'worker/:id/edit', element: <Navigate to="/company/employees" replace /> },
          { path: 'customer', element: <Navigate to="/company" replace /> },
          {
            path: 'crm',
            element: <RequireAdmin><CrmLayout /></RequireAdmin>,
            children: [
              { index: true, element: <Navigate to="/crm/leads" replace /> },
              { path: 'leads', element: <LeadOsgbPage /> },
            ],
          },
          {
            path: 'company',
            element: <CompanyLayout />,
            children: [
              { index: true, element: <CompanyListPage /> },
              { path: 'employees', element: <CompanyEmployeesPage /> },
              { path: 'units', element: <UnitsPage /> },
              { path: 'subcontractors', element: <SubcontractorsPage /> },
              { path: 'representative', element: <RepresentativePage /> },
              { path: 'mail-groups', element: <MailGroupsPage /> },
            ],
          },
          {
            path: 'safety',
            element: <SafetyLayout />,
            children: [
              { index: true, element: <Navigate to="/safety/plans/annual-work" replace /> },
              { path: 'plans/annual-work', element: <PlaceholderPage titleKey="nav.safetyPlansAnnualWork" /> },
              { path: 'plans/annual-training', element: <PlaceholderPage titleKey="nav.safetyPlansAnnualTraining" /> },
              { path: 'ppe/equipment-list', element: <PlaceholderPage titleKey="nav.safetyPpeEquipmentList" /> },
              { path: 'ppe/custody-records', element: <PpePage /> },
              { path: 'ppe/requests', element: <PlaceholderPage titleKey="nav.safetyPpeRequests" /> },
              { path: 'incident/near-miss', element: <IncidentPage /> },
              { path: 'incident/accident-records', element: <IncidentPage /> },
              { path: 'audit/dof-list', element: <PlaceholderPage titleKey="nav.safetyAuditDofList" /> },
              { path: 'audit/site-audit', element: <PlaceholderPage titleKey="nav.safetyAuditSiteAudit" /> },
              { path: 'audit/nonconformities', element: <PlaceholderPage titleKey="nav.safetyAuditNonconformities" /> },
              { path: 'audit/checklists', element: <PlaceholderPage titleKey="nav.safetyAuditChecklists" /> },
              { path: 'emergency/plans', element: <PlaceholderPage titleKey="nav.safetyEmergencyPlans" /> },
              { path: 'emergency/teams', element: <PlaceholderPage titleKey="nav.safetyEmergencyTeams" /> },
              { path: 'emergency/drills', element: <PlaceholderPage titleKey="nav.safetyEmergencyDrills" /> },
              { path: 'emergency/map', element: <PlaceholderPage titleKey="nav.safetyEmergencyMap" /> },
              { path: 'equipment/list', element: <PlaceholderPage titleKey="nav.safetyEquipmentList" /> },
              { path: 'equipment/periodic', element: <PlaceholderPage titleKey="nav.safetyEquipmentPeriodic" /> },
              { path: 'board/meetings', element: <PlaceholderPage titleKey="nav.safetyBoardMeetings" /> },
              { path: 'board/suggestions', element: <PlaceholderPage titleKey="nav.safetyBoardSuggestions" /> },
            ],
          },
          {
            path: 'health',
            element: <HealthLayout />,
            children: [
              { index: true, element: <Navigate to="/health/prescription/write" replace /> },
              { path: 'prescription/write', element: <PlaceholderPage titleKey="nav.healthPrescriptionWrite" /> },
              { path: 'prescription/query', element: <PlaceholderPage titleKey="nav.healthPrescriptionQuery" /> },
              { path: 'prescription/medication-list', element: <PlaceholderPage titleKey="nav.healthPrescriptionMedicationList" /> },
              { path: 'examination/polyclinic', element: <PlaceholderPage titleKey="nav.healthExaminationPolyclinic" /> },
              { path: 'examination/entry-periodic', element: <HealthPage /> },
              { path: 'examination/vaccination', element: <PlaceholderPage titleKey="nav.healthExaminationVaccination" /> },
              { path: 'examination/appointments', element: <PlaceholderPage titleKey="nav.healthExaminationAppointments" /> },
              { path: 'other/tests', element: <PlaceholderPage titleKey="nav.healthOtherTests" /> },
              { path: 'other/medicine-cabinet', element: <PlaceholderPage titleKey="nav.healthOtherMedicineCabinet" /> },
            ],
          },
          {
            path: 'archive',
            element: <ArchiveLayout />,
            children: [
              { index: true, element: <Navigate to="/archive/documents/ohs" replace /> },
              { path: 'documents/ohs', element: <PlaceholderPage titleKey="nav.archiveDocsOhs" /> },
              { path: 'documents/employee', element: <PlaceholderPage titleKey="nav.archiveDocsEmployee" /> },
              { path: 'documents/company', element: <PlaceholderPage titleKey="nav.archiveDocsCompany" /> },
              { path: 'reports/training', element: <PlaceholderPage titleKey="nav.reportsTraining" /> },
              { path: 'reports/accident-stats', element: <PlaceholderPage titleKey="nav.reportsAccidentStats" /> },
              { path: 'reports/prescription', element: <PlaceholderPage titleKey="nav.reportsPrescription" /> },
              { path: 'reports/monthly-activity', element: <PlaceholderPage titleKey="nav.reportsMonthlyActivity" /> },
            ],
          },
          {
            path: 'extra',
            element: <ExtraLayout />,
            children: [
              { index: true, element: <Navigate to="/extra/remote-training/content" replace /> },
              { path: 'remote-training/content', element: <PlaceholderPage titleKey="nav.extraRemoteTrainingContent" /> },
              { path: 'remote-training/exams', element: <PlaceholderPage titleKey="nav.extraRemoteTrainingExams" /> },
              { path: 'remote-training/assignments', element: <PlaceholderPage titleKey="nav.extraRemoteTrainingAssignments" /> },
              { path: 'visitor/records', element: <PlaceholderPage titleKey="nav.extraVisitorRecords" /> },
              { path: 'visitor/cards', element: <PlaceholderPage titleKey="nav.extraVisitorCards" /> },
              { path: 'announcements', element: <PlaceholderPage titleKey="nav.extraAnnouncements" /> },
            ],
          },
          { path: 'settings', element: <RequireAdmin><PlaceholderPage titleKey="nav.userManagement" /></RequireAdmin> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
