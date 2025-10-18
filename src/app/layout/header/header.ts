import { Component, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { MenubarModule } from 'primeng/menubar';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-header',
  imports: [RouterModule, ButtonModule, PopoverModule, MenubarModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header {
  showPortalOptions: boolean = false;
  showUsermenu: boolean = false;
  // portalList: any = [];
  menuList: any = []; // This will be dynamically populated
  userMenuList: any = [];
  userInfo: any = null;

  // Static portal list (no changes made here, as requested)
  portalList = [
    { label: 'Beneficiary', link: environment.portals.beneficiary, icon: 'fas fa-user-friends' },
    { label: 'Payment', link: environment.portals.payment, icon: 'fas fa-credit-card' },
    { label: 'GRM', link: environment.portals.grm, icon: 'fas fa-sitemap' },
    { label: 'Report', link: environment.portals.report, icon: 'fas fa-chart-line' },
    { label: 'Settings', icon: 'fas fa-cog' },
    { label: 'Survey CTO', icon: 'fas fa-poll' },
  ];

  constructor(private router: Router, private apiService: ApiService, private http: HttpClient) {
    effect(() => {
      this.userInfo = this.apiService.loginState()?.user; // Get user data from API service
      if (this.userInfo && this.userInfo.roleId) {
        this.loadMenusForUser(this.userInfo.roleId);
      }
    });

    // Static menu list (This part will be updated dynamically)
    this.menuList = [
      { label: 'Dashboard', icon: 'fas fa-dashboard', routerLink: '/dashboard', routerLinkActiveOptions: 'active' },
      {
        label: 'Beneficiary', icon: 'fas fa-people-group', items: [
          { label: 'Beneficiary List', icon: 'fas fa-list', routerLink: '/beneficiary/list' },
          { label: 'Approval List', icon: 'fas fa-user-check', routerLink: 'beneficiary-approval-list/edit' }
        ]
      },
      { label: 'Adjudication', icon: 'fas fa-users-viewfinder', routerLink: '/adjudication-list', routerLinkActiveOptions: 'active' },
      { label: 'Beneficiary ID Cards', icon: 'fas fa-id-card', routerLink: 'id-card', routerLinkActiveOptions: 'active' },
      { label: 'Job Card', icon: 'fas fa-id-card', routerLink: 'id-card', routerLinkActiveOptions: 'active' },
      { label: 'Work Progress', icon: 'fas fa-line-chart', routerLink: 'id-card', routerLinkActiveOptions: 'active' },
      { label: 'LIPW Export', icon: 'fas fa-file-export', routerLink: 'id-card', routerLinkActiveOptions: 'active' },
      { label: 'Report', icon: 'fas fa-file-alt', routerLink: 'report', routerLinkActiveOptions: 'active' },
      { label: 'Beneficiary Audit', icon: 'fas fa-history', routerLink: '/beneficiary/audit', routerLinkActiveOptions: 'active' },
      { label: 'Archived Beneficiary', icon: 'fas fa-trash-restore', routerLink: '/beneficiary/restore', routerLinkActiveOptions: 'active' }
    ];
  }

  // Load menu items for the user based on their role
  async loadMenusForUser(roleId: number) {
    try {
      // Make the full API call using HttpClient
      const response = await this.http.get<any>(`https://devgwapp.southsudansafetynet.info/mis_auth/api/menus/role/${roleId}`).toPromise();

      // Store the raw menu data for the route guard
      if (response && response.data) {
        sessionStorage.setItem(`menus_${roleId}`, JSON.stringify(response.data));
      }

      // Start with the default static menu list
      this.menuList = [...this.menuList];

      // Now update the menuList based on the API response
      response.data.forEach((menu: any) => {
        // Find the matching menu in the default list (using name as key)
        const defaultMenu = this.menuList.find((item: any) => item.label === menu.name);
        if (defaultMenu) {
          // If a parent menu is found, update its data
          defaultMenu.routerLink = menu.url || '/'; // Use API's URL or fallback

          // If this menu has a parentMenu, treat it as a child and add it to the parent's items
          if (menu.parentMenu) {
            const parentMenu = this.menuList.find((item: any) => item.label === menu.parentMenu.name);
            if (parentMenu) {
              parentMenu.items.push({
                label: menu.name,
                routerLink: menu.url,
                icon: 'fas fa-cogs' // Use default or custom icon (fallback)
              });
            }
          }
        }
      });
    } catch (error) {
      console.error("Error loading menus:", error);
    }
  }

  // Logout user and clear session/cookies
  logout() {
    this.apiService.logout(); // Call logout method in ApiService to handle logout
    window.location.href = `${environment.portals.master}/#/landing`; // Redirect to landing page
  }
}
