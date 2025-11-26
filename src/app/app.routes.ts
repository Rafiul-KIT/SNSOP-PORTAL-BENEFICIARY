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
import { BeneficiaryRestoreDetails } from './pages/beneficiary/beneficiary-restore-details/beneficiary-restore-details';
import { NewRegistration } from './pages/beneficiary/new-registration/new-registration';
import { PendingBeneficiaryList } from './pages/beneficiary/pending-beneficiary-list/pending-beneficiary-list';
import { PendingBeneficiaryManage } from './pages/beneficiary/pending-beneficiary-manage/pending-beneficiary-manage';
import { BeneficiaryViewList } from './pages/beneficiary/beneficiary-view-list/beneficiary-view-list';
import { Profile } from './pages/profile/profile';

export const routes: Routes = [
  {
    component: Dashboard,
    path: 'dashboard',
    canActivate: [routeGuard],
  },
   {
    component: Profile,
    path: 'profile',
  },
  {
    path: 'adjudication',
    canActivate: [routeGuard],
    children: [
      {
        path: 'list',
        component: AdjudicationList,
      },
      {
        path: 'match-list/:id',
        component: MatchList,
      },
      { path: '', pathMatch: 'full', redirectTo: 'list' },
    ],
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
        path: 'view-list',
        component: BeneficiaryViewList,
      },
      {
        path: 'new-registration',
        component: NewRegistration,
      },
      {
        path: 'details/:id',
        component: BeneficiaryDetails,
      },
      {
        path: 'edit/:applicationId',
        component: BeneficiaryManage,
      },
      {
        path: 'migrate/:bid',
        component: BeneficiaryMigration,
      },
      { path: '', pathMatch: 'full', redirectTo: 'list' },
    ],
  },
  {
    path: 'pending-beneficiary',
    canActivate: [routeGuard],
    children: [
      {
        path: 'list',
        component: PendingBeneficiaryList,
      },
      {
        path: 'edit/:applicationId',
        component: PendingBeneficiaryManage,
      },
      { path: '', pathMatch: 'full', redirectTo: 'list' },
    ],
  },
  {
    path: 'beneficiary-approval',
    canActivate: [routeGuard],
    children: [
      {
        path: 'list',
        component: BeneficiaryEditApprovalList,
      },
      {
        path: 'edit-details/:id',
        component: BeneficiaryEditApprovalDetails,
      },
      {
        path: 'migrate-details/:id',
        component: BeneficiaryMigrateApprovalDetails,
      },
      {
        path: 'archive-details/:id',
        component: BeneficiaryArchiveApprovalDetails,
      },
      { path: '', pathMatch: 'full', redirectTo: 'list' },
    ],
  },
  {
    path: 'beneficiary-audit',
    canActivate: [routeGuard],
    children: [
      {
        path: 'list',
        component: BeneficiaryAudit,
      },
      {
        path: 'audit-details/:id',
        component: BeneficiaryAuditDetails,
      },
      { path: '', pathMatch: 'full', redirectTo: 'list' },
    ],
  },
  {
    path: 'report',
    canActivate: [routeGuard],
    children: [
      {
        path: 'boma-wise-beneficiary-list',
        loadComponent: () =>
          import('./pages/report/report').then((m) => m.ReportComponent),
        data: {
          reportType: 1,
          reportTitle: 'Boma Wise Beneficiary List Report',
        },
      },
      {
        path: 'data-entry-wise-registration',
        loadComponent: () =>
          import('./pages/report/report').then((m) => m.ReportComponent),
        data: {
          reportType: 2,
          reportTitle: 'Boma & Data Entry Staff Wise Registration Report',
        },
      },
      {
        path: 'boma-wise-age-group',
        loadComponent: () =>
          import('./pages/report/report').then((m) => m.ReportComponent),
        data: { reportType: 5, reportTitle: 'Boma Wise Age Group Report' },
      },
      {
        path: 'interested-in-component2',
        loadComponent: () =>
          import('./pages/report/report').then((m) => m.ReportComponent),
        data: {
          reportType: 6,
          reportTitle: 'Households Interested in Component 2 Report',
        },
      },
      {
        path: 'biometric-match-list',
        loadComponent: () =>
          import('./pages/report/report').then((m) => m.ReportComponent),
        data: { reportType: 7, reportTitle: 'Report for Biometric Match List' },
      },
      {
        path: 'complete-household-survey',
        loadComponent: () =>
          import('./pages/report/report').then((m) => m.ReportComponent),
        data: {
          reportType: 8,
          reportTitle: 'Complete Household Survey Report',
        },
      },
    ],
  },
  {
    path: 'restore',
    canActivate: [routeGuard],
    children: [
      {
        path: 'list',
        component: BeneficiaryRestore,
      },
      {
        path: 'details/:id',
        component: BeneficiaryRestoreDetails,
      },
      { path: '', pathMatch: 'full', redirectTo: 'list' },
    ],
  },
  {
    path: 'under-construction',
    component: BeneficiaryIdCard,
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    component: NotFound,
    path: '**',
  },
];
