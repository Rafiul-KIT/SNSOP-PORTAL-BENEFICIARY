import { Routes } from '@angular/router';
import { Dashboard } from './pages/dashboard/dashboard';
import { NotFound } from './components/not-found/not-found';
import { BeneficiaryList } from './pages/beneficiary/beneficiary-list/beneficiary-list';
import { BeneficiaryDetails } from './pages/beneficiary/beneficiary-details/beneficiary-details';
import { BeneficiaryEdit } from './pages/beneficiary/beneficiary-edit/beneficiary-edit';
import { BeneficiaryMigrate } from './pages/beneficiary/beneficiary-migrate/beneficiary-migrate';



export const routes: Routes = [
  {
    component: Dashboard,
    path: 'dashboard',
  },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    component: BeneficiaryList,
    path: 'beneficiary/list',
  },
  {
    component: BeneficiaryDetails,
    path: 'beneficiary/details/:bid',
  },
  {
    component: BeneficiaryEdit,
    path: 'beneficiary/edit/:bid',
  },
  {
    component: BeneficiaryMigrate,
    path: 'beneficiary/migrate/:bid',
  },
  
  {
    component: NotFound,
    path: '**',
  },
];
