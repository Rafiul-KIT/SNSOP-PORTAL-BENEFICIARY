import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { BeneficiaryList } from './pages/beneficiary/beneficiary-list/beneficiary-list';
import { BeneficiaryDetails } from './pages/beneficiary/beneficiary-details/beneficiary-details';
import { BeneficiaryManage } from './pages/beneficiary/beneficiary-manage/beneficiary-manage';
import { BeneficiaryMigration } from './pages/beneficiary/beneficiary-migration/beneficiary-migration';
import { BeneficiaryEditApprovalList } from './pages/approval-list/beneficiary-edit-approval-list/beneficiary-edit-approval-list';
import { BeneficiaryEditApprovalDetails } from './pages/approval-details/beneficiary-edit-approval-details/beneficiary-edit-approval-details';
import { routeGuard } from './route.guard';
import { BeneficiaryIdCard } from './pages/beneficiary/beneficiary-id-card/beneficiary-id-card';
import { BeneficiaryArchiveApprovalDetails } from './pages/approval-details/beneficiary-archive-approval-details/beneficiary-archive-approval-details';
import { BeneficiaryMigrateApprovalDetails } from './pages/approval-details/beneficiary-migrate-approval-details/beneficiary-migrate-approval-details';
import { BeneficiaryRestore } from './pages/beneficiary/beneficiary-restore/beneficiary-restore';
import { ReportComponent } from './pages/report/report';
import { BeneficiaryAudit } from './pages/beneficiary/beneficiary-audit/beneficiary-audit';
import { BeneficiaryAuditDetails } from './pages/beneficiary/beneficiary-audit-details/beneficiary-audit-details';
import { AdjudicationList } from './pages/adjudication/adjudication-list/adjudication-list';
import { MatchList } from './pages/adjudication/match-list/match-list';
export const routes: Routes = [
  {
    component: Dashboard,
    path: 'dashboard',
    canActivate: [routeGuard],
  },
    {
    component: AdjudicationList,
    path: 'adjudication-list',
    canActivate: [routeGuard],
  },
  {
    component: MatchList,
    path: 'match-list/:id',
    // canActivate: [routeGuard],
  },
  {
    path: 'beneficiary',
    canActivate: [routeGuard],
    children: [
      {
        path: 'list',
        component: BeneficiaryList,
      },
       {
        path: 'details/:id',
        component: BeneficiaryDetails
      },
      {
        path: 'audit-details/:id',
        component: BeneficiaryAuditDetails
      },
      {
        path: 'edit/:applicationId',
        component: BeneficiaryManage,
      },
        {
        path: 'audit',
        component: BeneficiaryAudit,
      },
      {
        path: 'migrate/:bid',
        component: BeneficiaryMigration,
      },
      {
        path: 'id-card',
        component: BeneficiaryIdCard,
      },
      {
        path: 'restore',
        component: BeneficiaryRestore,
      },
      { path: '', pathMatch: 'full', redirectTo: 'list' },
    ],
  },
  {
    path: 'beneficiary-approval-list',
    canActivate: [routeGuard],
    children: [
      { path: 'edit', component: BeneficiaryEditApprovalList },
      { path: '', pathMatch: 'full', redirectTo: 'edit' },
    ],
  },
  {
    path: 'beneficiary-edit-details/:id',
    canActivate: [routeGuard],
    component: BeneficiaryEditApprovalDetails,
  },
   {
    path: 'report',
    canActivate: [routeGuard],
    component: ReportComponent,
  },
  {
    path: 'beneficiary-migrate-details/:id',
    canActivate: [routeGuard],
    component: BeneficiaryMigrateApprovalDetails,
  },
  {
    path: 'beneficiary-archive-details/:id',
    canActivate: [routeGuard],
    component: BeneficiaryArchiveApprovalDetails,
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    component: NotFound,
    path: '**',
  },
];
