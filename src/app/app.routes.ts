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
import { Unauthorized } from './components/unauthorized/unauthorized';
import { UnderConstruction } from './pages/under-construction/under-construction';
import { RedirectLink } from './pages/adjudication/redirect-link/redirect-link';
import { BeneficiaryMomoWalletUpdate } from './pages/beneficiary/beneficiary-momo-wallet-update/beneficiary-momo-wallet-update';
import { BeneficiaryMomoList } from './pages/beneficiary/beneficiary-momo-list/beneficiary-momo-list';
import { BeneficiaryDetailsView } from './pages/beneficiary/beneficiary-details-view/beneficiary-details-view';

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
        canActivate: [routeGuard],
      },
      {
        path: 'match-list/:id',
        component: MatchList,
        canActivate: [routeGuard],
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
        canActivate: [routeGuard],
      },
      {
        path: 'view-list',
        component: BeneficiaryViewList,
        canActivate: [routeGuard],
      },
      {
        path: 'details-view/:id',
        component: BeneficiaryDetailsView,
        canActivate: [routeGuard],
      },
      {
        path: 'new-registration',
        component: NewRegistration,
        canActivate: [routeGuard],
      },
      {
        path: 'details/:id',
        component: BeneficiaryDetails,
        canActivate: [routeGuard],
      },
      {
        path: 'edit/:applicationId',
        component: BeneficiaryManage,
        canActivate: [routeGuard],
      },
      {
        path: 'migrate/:bid',
        component: BeneficiaryMigration,
        canActivate: [routeGuard],
      },
      {
        path: 'momo-update/:bid',
        component: BeneficiaryMomoWalletUpdate,
        canActivate: [routeGuard],
      },
      {
        path: 'momo-list',
        component: BeneficiaryMomoList,
        canActivate: [routeGuard],
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
        canActivate: [routeGuard],
      },
      {
        path: 'edit/:applicationId',
        component: PendingBeneficiaryManage,
        canActivate: [routeGuard],
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
        canActivate: [routeGuard],
      },
      {
        path: 'edit-details/:id',
        component: BeneficiaryEditApprovalDetails,
        canActivate: [routeGuard],
      },
      {
        path: 'migrate-details/:id',
        component: BeneficiaryMigrateApprovalDetails,
        canActivate: [routeGuard],
      },
      {
        path: 'archive-details/:id',
        component: BeneficiaryArchiveApprovalDetails,
        canActivate: [routeGuard],
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
        canActivate: [routeGuard],
      },
      {
        path: 'audit-details/:id',
        component: BeneficiaryAuditDetails,
        canActivate: [routeGuard],
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
        canActivate: [routeGuard],
      },
      {
        path: 'details/:id',
        component: BeneficiaryRestoreDetails,
        canActivate: [routeGuard],
      },
      { path: '', pathMatch: 'full', redirectTo: 'list' },
    ],
  },
  { path: 'unauthorized',
    component: Unauthorized
  },
  {
    path: 'under-construction',
    component: UnderConstruction,
  },
  {
    path: 'id-card',
    component: BeneficiaryIdCard,
    canActivate: [routeGuard],
  },
  {
    path: 'redirect-link',
    component: RedirectLink,
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    component: NotFound,
    path: '**',
  },
];
