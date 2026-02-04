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
import { PlanListPage } from '@domains/safety/pages/PlanListPage';
import { PlanEditorPage } from '@domains/safety/pages/PlanEditorPage';
import { PlanSummaryPage } from '@domains/safety/pages/PlanSummaryPage';
import { HealthLayout } from '@domains/health/layout/HealthLayout';
import { HealthPage } from '@domains/health/pages/HealthPage';
import { WritePrescriptionPage } from '@domains/health/pages/WritePrescriptionPage';
import { DrugListPage } from '@domains/health/pages/DrugListPage';
import { PrescriptionListPage } from '@domains/health/pages/PrescriptionListPage';
import { IncidentPage } from '@domains/incident/pages/IncidentPage';
import { PpePage } from '@domains/ppe/pages/PpePage';
import { EquipmentListPage } from '@domains/ppe/pages/EquipmentListPage';
import { PpeRequestPage } from '@domains/ppe/pages/PpeRequestPage';
import { DofPage } from '@domains/safety/pages/DofPage';
import { InspectionListPage } from '@domains/safety/pages/InspectionListPage';
import { InspectionConductPage } from '@domains/safety/pages/InspectionConductPage';
import { NonConformityPage } from '@domains/safety/pages/NonConformityPage';
import { ChecklistPage } from '@domains/safety/pages/ChecklistPage';
import { EmergencyPlanPage } from '@domains/safety/pages/EmergencyPlanPage';
import { EmergencyTeamsPage } from '@domains/safety/pages/EmergencyTeamsPage';
import { FloorPlanPage } from '@domains/safety/pages/FloorPlanPage';
import { DrillPage } from '@domains/safety/pages/DrillPage';
import { WorkEquipmentListPage } from '@domains/safety/pages/WorkEquipmentListPage';
import { PeriodicControlPage } from '@domains/safety/pages/PeriodicControlPage';
import { BoardMeetingPage } from '@domains/safety/pages/BoardMeetingPage';
import { SuggestionBookPage } from '@domains/safety/pages/SuggestionBookPage';
import { ArchiveLayout } from '@domains/archive/layout/ArchiveLayout';
import { ExtraLayout } from '@domains/extra/layout/ExtraLayout';
import { CrmLayout } from '@domains/crm/layout/CrmLayout';
import { LeadOsgbPage } from '@domains/crm/pages/LeadOsgbPage';
import { UserManagementPage } from '@domains/settings/pages/UserManagementPage';

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
          { path: 'incidents/accidents', element: <IncidentPage filterType="İş Kazası" /> },
          { path: 'incidents/near-miss', element: <IncidentPage filterType="Ramak Kala" /> },
          { path: 'dof', element: <DofPage /> },
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
              { index: true, element: <Navigate to="/safety/plans/summary" replace /> },
              { path: 'plans/summary', element: <PlanSummaryPage /> },
              { path: 'plans/:planType', element: <PlanListPage /> },
              { path: 'plans/:planType/new', element: <PlanEditorPage /> },
              { path: 'plans/:planType/:id', element: <PlanEditorPage /> },
              { path: 'plans/annual-work', element: <Navigate to="/safety/plans/work" replace /> },
              { path: 'plans/annual-training', element: <Navigate to="/safety/plans/training" replace /> },
              { path: 'ppe/equipment', element: <EquipmentListPage /> },
              { path: 'ppe/equipment-list', element: <EquipmentListPage /> },
              { path: 'ppe/custody-records', element: <PpePage /> },
              { path: 'ppe/requests', element: <PpeRequestPage /> },
              { path: 'incident/near-miss', element: <IncidentPage filterType="Ramak Kala" /> },
              { path: 'incident/accident-records', element: <IncidentPage filterType="İş Kazası" /> },
              { path: 'audit/dof-list', element: <DofPage /> },
              { path: 'audit/inspections', element: <InspectionListPage /> },
              { path: 'audit/inspections/new', element: <Navigate to="/safety/audit/inspections" replace /> },
              { path: 'audit/inspections/:id', element: <InspectionConductPage /> },
              { path: 'audit/site-audit', element: <InspectionListPage /> },
              { path: 'audit/nonconformities', element: <NonConformityPage /> },
              { path: 'audit/non-conformities', element: <NonConformityPage /> },
              { path: 'audit/checklists', element: <ChecklistPage /> },
              { path: 'emergency/plans', element: <EmergencyPlanPage /> },
              { path: 'emergency/teams', element: <EmergencyTeamsPage /> },
              { path: 'emergency/drills', element: <DrillPage /> },
              { path: 'emergency/map', element: <FloorPlanPage /> },
              { path: 'equipment/list', element: <WorkEquipmentListPage /> },
              { path: 'equipment/controls', element: <PeriodicControlPage /> },
              { path: 'equipment/periodic', element: <PeriodicControlPage /> },
              { path: 'board/meetings', element: <BoardMeetingPage /> },
              { path: 'board/book', element: <SuggestionBookPage /> },
              { path: 'board/suggestions', element: <SuggestionBookPage /> },
            ],
          },
          {
            path: 'health',
            element: <HealthLayout />,
            children: [
              { index: true, element: <Navigate to="/health/prescription/write" replace /> },
              { path: 'prescription/write', element: <WritePrescriptionPage /> },
              { path: 'prescription/query', element: <PrescriptionListPage /> },
              { path: 'prescription/medication-list', element: <DrugListPage /> },
              { path: 'drugs', element: <DrugListPage /> },
              { path: 'prescriptions', element: <PrescriptionListPage /> },
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
          { path: 'settings', element: <RequireAdmin><UserManagementPage /></RequireAdmin> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
