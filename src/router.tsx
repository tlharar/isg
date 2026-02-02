import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AuthRoot } from '@auth/AuthRoot';
import { LoginOrRedirect } from '@auth/LoginOrRedirect';
import { SignUpOrRedirect } from '@auth/SignUpOrRedirect';
import { RequireAuthLayout } from '@auth/RequireAuthLayout';
import { DashboardPage } from '@domains/dashboard/pages/DashboardPage';
import { RiskListPage } from '@domains/risk/pages/RiskListPage';
import { RiskNewPage } from '@domains/risk/pages/RiskNewPage';
import { PersonnelListPage } from '@domains/personnel/pages/PersonnelListPage';
import { PersonnelNewPage } from '@domains/personnel/pages/PersonnelNewPage';
import { TrainingListPage } from '@domains/training/pages/TrainingListPage';
import { TrainingNewPage } from '@domains/training/pages/TrainingNewPage';
import { CustomerListPage } from '@domains/customer/pages/CustomerListPage';
import { CompanyLayout } from '@domains/company/layout/CompanyLayout';
import { CompanyListPage } from '@domains/company/pages/CompanyListPage';
import { CompanyEmployeesPage } from '@domains/company/pages/CompanyEmployeesPage';
import { UnitsPage } from '@domains/company/pages/UnitsPage';
import { SubcontractorsPage } from '@domains/company/pages/SubcontractorsPage';
import { RepresentativePage } from '@domains/company/pages/RepresentativePage';
import { MailGroupsPage } from '@domains/company/pages/MailGroupsPage';

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
          { path: 'dashboard', element: <DashboardPage /> },
          { path: 'risk', element: <RiskListPage /> },
          { path: 'risk/new', element: <RiskNewPage /> },
          { path: 'personnel', element: <PersonnelListPage /> },
          { path: 'personnel/new', element: <PersonnelNewPage /> },
          { path: 'training', element: <TrainingListPage /> },
          { path: 'training/new', element: <TrainingNewPage /> },
          { path: 'worker', element: <Navigate to="/company/employees" replace /> },
          { path: 'worker/new', element: <Navigate to="/company/employees" replace /> },
          { path: 'worker/:id/edit', element: <Navigate to="/company/employees" replace /> },
          { path: 'customer', element: <CustomerListPage /> },
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
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
