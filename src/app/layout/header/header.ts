import { Component, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { MenubarModule } from 'primeng/menubar';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-header',
  imports: [RouterModule, ButtonModule, PopoverModule, MenubarModule],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  showPortalOptions: boolean = false;
  showUsermenu: boolean = false;
  portalList: any = [];
  menuList: any = [];
  userMenuList: any = [];

  constructor(private router: Router) {
    this.portalList = [
      {
        label: 'Dashboard',
        link: environment.portals.master,
        icon: 'fas fa-chart-line',
      },
      {
        label: 'Beneficiary',
        link: environment.portals.beneficiary,
        icon: 'fas fa-user-friends',
      },
      {
        label: 'Payment',
        link: environment.portals.payment,
        icon: 'fas fa-credit-card',
      },
      { label: 'GRM', link: environment.portals.grm, icon: 'fas fa-sitemap' },
      {
        label: 'Report',
        link: environment.portals.report,
        icon: 'fas fa-chart-bar',
      },
    ];

    this.menuList = [
      {
        label: 'New Registration',
        icon: 'fas fa-user-plus',
        routerLink: 'beneficiary/registration',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Beneficiary List',
        icon: 'fas fa-list',
        routerLink: '/beneficiary/list',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Approval',
        icon: 'fas fa-check-circle',
        items: [
          {
            label: 'Beneficiary Approval',
            icon: 'fas fa-user-check',
            routerLink: 'beneficiary-approval/edit',
          },
          {
            label: 'Migration Approval',
            icon: 'fas fa-right-left',
            routerLink: 'beneficiary-approval/migrate',
          },
          {
            label: 'Archiving Approval',
            icon: 'fas fa-archive',
            routerLink: 'beneficiary-approval/archive',
          },
        ],
      },
      // {
      //   label: 'Beneficiary Attendance',
      //   icon: 'fas fa-list',
      //   routerLink: 'beneficiary/attendance',
      //   routerLinkActiveOptions: 'active',
      // },
      // {
      //   label: 'Beneficiary ID Cards',
      //   icon: 'fas fa-list',
      //   routerLink: 'beneficiary/id-card',
      //   routerLinkActiveOptions: 'active',
      // },
      // {
      //   label: 'Job Card',
      //   icon: 'fas fa-list',
      //   routerLink: 'beneficiary/job-card',
      //   routerLinkActiveOptions: 'active',
      // },
      // {
      //   label: 'Work Progress',
      //   icon: 'fas fa-list',
      //   routerLink: 'beneficiary/work-progress',
      //   routerLinkActiveOptions: 'active',
      // },
      // {
      //   label: 'LIPW Export',
      //   icon: 'fas fa-list',
      //   routerLink: 'beneficiary/lipw-export',
      //   routerLinkActiveOptions: 'active',
      // },
    ];
  }

  goToProfile = () => {
    window.location.href = `${environment.portals.master}/home/profile`;
  };

  //logout = () => {};
  logout = () => {
    // Clear the authentication token from cookies
    document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';  // Clear the token cookie
    document.cookie = 'tokenExpiry=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';  // Clear the expiry cookie

    // Redirect to the login page of the master portal (or landing page)
    window.location.href = `${environment.portals.master}/landing`;  // Redirect to the master portal's login page
  };

}
