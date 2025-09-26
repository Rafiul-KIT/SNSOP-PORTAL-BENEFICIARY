import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { BeneficiaryList } from './pages/beneficiary/beneficiary-list/beneficiary-list';
import { BeneficiaryDetails } from './pages/beneficiary/beneficiary-details/beneficiary-details';
import { BeneficiaryManage } from './pages/beneficiary/beneficiary-manage/beneficiary-manage';
import { BeneficiaryMigration } from './pages/beneficiary/beneficiary-migration/beneficiary-migration';
import { BeneficiaryArchiveApprovalList } from './pages/approval-list/beneficiary-archive-approval-list/beneficiary-archive-approval-list';
import { BeneficiaryEditApprovalList } from './pages/approval-list/beneficiary-edit-approval-list/beneficiary-edit-approval-list';
import { BeneficiaryMigrateApprovalList } from './pages/approval-list/beneficiary-migrate-approval-list/beneficiary-migrate-approval-list';
import { BeneficiaryEditApprovalDetails } from './pages/approval-details/beneficiary-edit-approval-details/beneficiary-edit-approval-details';
import { routeGuard } from './route.guard';
import { BeneficiaryIdCard } from './pages/beneficiary/beneficiary-id-card/beneficiary-id-card';

export const routes: Routes = [
  {
    component: Dashboard,
    path: 'dashboard',
    canActivate: [routeGuard],
  },
  {
    path: 'beneficiary',
    canActivate: [routeGuard],
    children: [
      {
        path: 'list',
        component: BeneficiaryList,
      },
      { path: 'details/:id', component: BeneficiaryDetails },
      {
        path: 'edit/:applicationId',
        component: BeneficiaryManage,
      },
      {
        path: 'migrate/:bid',
        component: BeneficiaryMigration,
      },
      {
        path: 'id-card',
        component: BeneficiaryIdCard,
      },
      { path: '', pathMatch: 'full', redirectTo: 'list' },
    ],
  },
  {
    path: 'beneficiary-approval-list',
    canActivate: [routeGuard],
    children: [
      { path: 'edit', component: BeneficiaryEditApprovalList },
      {
        path: 'migrate',
        component: BeneficiaryMigrateApprovalList,
      },
      {
        path: 'archive',
        component: BeneficiaryArchiveApprovalList,
      },
      { path: '', pathMatch: 'full', redirectTo: 'edit' },
    ],
  },
  {
    path: 'beneficiary-edit-details/:id',
    canActivate: [routeGuard],
    component: BeneficiaryEditApprovalDetails,
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    component: NotFound,
    path: '**',
  },
];
