import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { BeneficiaryList } from './pages/beneficiary/beneficiary-list/beneficiary-list';
import { BeneficiaryDetails } from './pages/beneficiary/beneficiary-details/beneficiary-details';
import { BeneficiaryManage } from './pages/beneficiary/beneficiary-manage/beneficiary-manage';
import { BeneficiaryMigration } from './pages/beneficiary/beneficiary-migration/beneficiary-migration';
import { BeneficiaryArchiveApproval } from './pages/approval/beneficiary-archive-approval/beneficiary-archive-approval';
import { BeneficiaryEditApproval } from './pages/approval/beneficiary-edit-approval/beneficiary-edit-approval';
import { BeneficiaryMigrateApproval } from './pages/approval/beneficiary-migrate-approval/beneficiary-migrate-approval';

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
        path: 'edit/:bid',
      },
      {
        component: BeneficiaryMigration,
        path: 'migrate/:bid',
      },
      { path: '', pathMatch: 'full', redirectTo: 'list' },
    ],
  },
  {
    path: 'beneficiary-approval',
    children: [
      { path: 'edit', component: BeneficiaryEditApproval },
      {
        path: 'migrate',
        component: BeneficiaryMigrateApproval,
      },
      {
        path: 'archive',
        component: BeneficiaryArchiveApproval,
      },
      { path: '', pathMatch: 'full', redirectTo: 'edit' },
    ],
  },
  {
    component: NotFound,
    path: '**',
  },
];
