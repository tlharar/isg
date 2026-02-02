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
import { WorkerListPage } from '@domains/worker/pages/WorkerListPage';
import { WorkerNewPage } from '@domains/worker/pages/WorkerNewPage';

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
          { path: 'worker', element: <WorkerListPage /> },
          { path: 'worker/new', element: <WorkerNewPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
