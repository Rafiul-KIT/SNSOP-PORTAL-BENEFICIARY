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

export const routes: Routes = [
  {
    component: Dashboard,
    path: 'dashboard',
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },

  {
    path: 'beneficiary',
    children: [
      {
        component: BeneficiaryList,
        path: 'list',
      },
      { path: 'details/:applicationId', component: BeneficiaryDetails },
      {
        component: BeneficiaryManage,
        path: 'edit/:applicationId',
      },
      {
        component: BeneficiaryMigration,
        path: 'migrate/:bid',
      },
      { path: '', pathMatch: 'full', redirectTo: 'list' },
    ],
  },
  {
    path: 'beneficiary-approval-list',
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
    component: NotFound,
    path: '**',
  },
];
