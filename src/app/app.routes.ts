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
        path: 'new-registration',
        component: NewRegistration,
      },
      {
        path: 'details/:id',
        component: BeneficiaryDetails,
      },
      // {
      //   path: 'audit-details/:id',
      //   component: BeneficiaryAuditDetails
      // },
      {
        path: 'edit/:applicationId',
        component: BeneficiaryManage,
      },
      //   {
      //   path: 'audit',
      //   component: BeneficiaryAudit,
      // },
      {
        path: 'migrate/:bid',
        component: BeneficiaryMigration,
      },
      // {
      //   path: 'id-card',
      //   component: BeneficiaryIdCard,
      // },
      { path: '', pathMatch: 'full', redirectTo: 'list' },
    ],
  },
  {
    path: 'pending-beneficiary/list',
    canActivate: [routeGuard],
    component: PendingBeneficiaryList,
  },
    
  {
    path: 'pending-beneficiary/edit/:applicationId',
    component: PendingBeneficiaryManage,
  },
       
     
      
  {
    path: 'beneficiary-approval/list',
    canActivate: [routeGuard],
    component: BeneficiaryEditApprovalList
  },
  {
    path: 'beneficiary-approval/edit-details/:id',
    
    component: BeneficiaryEditApprovalDetails
  },
  {
    path: 'beneficiary-approval/migrate-details/:id',
    
    component: BeneficiaryMigrateApprovalDetails
  },
  {
    path: 'beneficiary-approval/archive-details/:id',
    
    component: BeneficiaryArchiveApprovalDetails
  },
  {
    path: 'beneficiary-audit/audit',
    canActivate: [routeGuard],
    component: BeneficiaryAudit
  },
  { path: 'beneficiary-audit/audit-details/:id',
    component: BeneficiaryAuditDetails
  },
    
  {
    path: 'report',
    canActivate: [routeGuard],
    component: ReportComponent,
  },
  {
    path: 'restore/list',
    canActivate: [routeGuard],
    component: BeneficiaryRestore
  },
  { path: 'restore/details/:id',
    component: BeneficiaryRestoreDetails
  },

  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    component: NotFound,
    path: '**',
  },
];
