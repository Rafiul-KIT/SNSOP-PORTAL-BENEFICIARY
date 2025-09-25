import { Component, effect, ViewChild } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { MenubarModule } from 'primeng/menubar';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api.service';

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
  userInfo: any = null;

  constructor(private router: Router, private apiService: ApiService) {
    effect(() => {
      this.userInfo = this.apiService.loginState()?.user;
    });

    this.portalList = [
      {
        label: 'Dashboard',
        link: environment.portals.master,
        icon: 'fas fa-dashboard',
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
        icon: 'fas fa-chart-line',
      },
    ];

    this.menuList = [
      // {
      //   label: 'New Registration',
      //   icon: 'fas fa-user-plus',
      //   routerLink: 'beneficiary/registration',
      //   routerLinkActiveOptions: 'active',
      // },
      {
        label: 'Dashboard',
        icon: 'fas fa-dashboard',
        routerLink: '/dashboard',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Beneficiary',
        icon: 'fas fa-list',
        items: [
          {
            label: 'Beneficiary List',
            icon: 'fas fa-list',
            routerLink: '/beneficiary/list',
          },
          {
            label: 'Approval List',
            icon: 'fas fa-user-check',
            routerLink: 'beneficiary-approval-list/edit',
          },

        ],
      },
      {
        label: 'Beneficiary ID Cards',
        icon: 'fas fa-list',
        routerLink: '/beneficiary/id-card',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Beneficiary Attendance',
        icon: 'fas fa-list',
        routerLink: '/beneficiary/id-card',
        routerLinkActiveOptions: 'active',
      },
      
      {
        label: 'Job Card',
        icon: 'fas fa-list',
        routerLink: '/beneficiary/id-card',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'Work Progress',
        icon: 'fas fa-list',
        routerLink: '/beneficiary/id-card',
        routerLinkActiveOptions: 'active',
      },
      {
        label: 'LIPW Export',
        icon: 'fas fa-list',
        routerLink: '/beneficiary/id-card',
        routerLinkActiveOptions: 'active',
      },
    ];
  }

  goToProfile = () => {
    window.location.href = `${environment.portals.master}/home/profile`;
  };

  //logout = () => {};
  logout = () => {
    this.apiService.logout();
    // // Clear the authentication token from cookies
    // document.cookie = 'token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';  // Clear the token cookie
    // document.cookie = 'tokenExpiry=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/';  // Clear the expiry cookie

    // // Redirect based on routing strategy
    // const redirectUrl = environment.env === 'local'
    //   ? `${environment.portals.master}/landing` // Use path-based routing for dev
    //   : `${environment.portals.master}/#/landing`; // Use hash-based routing for production

    // window.location.href = redirectUrl;  // Redirect to the correct landing page
  };
}
