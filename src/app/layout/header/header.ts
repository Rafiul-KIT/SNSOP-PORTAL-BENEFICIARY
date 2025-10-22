import { ChangeDetectorRef, Component, effect } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { PopoverModule } from 'primeng/popover';
import { MenubarModule } from 'primeng/menubar';
import { environment } from '../../../environments/environment';
import { ApiService } from '../../services/api.service';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterModule, ButtonModule, PopoverModule, MenubarModule],
  templateUrl: './header.html',
  styleUrls: ['./header.scss'],
})
export class Header {
  showPortalOptions = false;
  showUsermenu = false;
  menuList: any[] = [];
  userInfo: any = null;
  menusLoaded = false; // ✅ controls when to render

  portalList = [
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
    {
      label: 'Settings',
      link: environment.portals.masterSettings,
      icon: 'fas fa-cog',
    },
    { label: 'Survey CTO', icon: 'fas fa-poll' },
  ];

  constructor(
    private router: Router,
    private apiService: ApiService,
    private http: HttpClient,
    private cdRef: ChangeDetectorRef
  ) {
    // Watch login state and load menus dynamically
    effect(() => {
      this.userInfo = this.apiService.loginState()?.user;
      if (this.userInfo?.roleId) {
        this.loadMenusForUser(this.userInfo.roleId);
      }
    });
  }

  async loadMenusForUser(roleId: number) {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(
          `https://devgwapp.southsudansafetynet.info/mis_auth/api/menus/role/${roleId}`
        )
      );

      if (response && Array.isArray(response.data)) {
        sessionStorage.setItem(
          `menus_${roleId}`,
          JSON.stringify(response.data)
        );

        // Handle empty response
        if (response.data.length === 0) {
          console.warn(`No menus found for role ${roleId}`);
          this.menuList = [];
          this.menusLoaded = true;
          this.cdRef.detectChanges();
          return;
        }

        const allowedNames = response.data.map((menu: any) => menu.name);
        const allMenus = this.getStaticMenus();

        // ✅ Update safely and trigger view refresh
        this.menuList = this.filterMenusByAccess(allMenus, allowedNames);
        this.menusLoaded = true;
        this.cdRef.detectChanges();
      }
    } catch (error) {
      console.error('Error loading menus:', error);
      this.menusLoaded = true;
      this.cdRef.detectChanges();
    }
  }

  getStaticMenus(): any[] {
    return [
      {
        label: 'Dashboard',
        icon: 'fas fa-tachometer-alt',
        routerLink: 'dashboard',
      },
      {
        label: 'New Register',
        icon: 'fas fa-id-card',
        routerLink: 'newRegister',
      },
      {
        label: 'Beneficiary',
        icon: 'fas fa-people-group',
        items: [
          {
            label: 'Beneficiary List',
            icon: 'fas fa-list',
            routerLink: 'beneficiary/list',
          },
          // {
          //   label: 'Approval List',
          //   icon: 'fas fa-user-check',
          //   routerLink: 'beneficiary-approval-list/edit',
          // },
        ],
      },
 

      {
        label: 'Approval List',
        icon: 'fas fa-user-check',
        items: [
          {
            label: 'List',
            icon: 'fas fa-list',
            routerLink: 'beneficiary-approval/list',
          },
          // {
          //   label: 'Approval List',
          //   icon: 'fas fa-user-check',
          //   routerLink: 'beneficiary-approval-list/edit',
          // },
        ],
      },

      {
        label: 'Adjudication',
        icon: 'fas fa-users-viewfinder',
        routerLink: 'adjudication-list',
      },
      {
        label: 'Beneficiary ID Cards',
        icon: 'fas fa-id-card',
        routerLink: 'id-card',
      },
      { label: 'Job Card', icon: 'fas fa-briefcase', routerLink: 'job-card' },
      {
        label: 'Work Progress',
        icon: 'fas fa-chart-line',
        routerLink: 'work-progress',
      },
      {
        label: 'LIPW Export',
        icon: 'fas fa-file-export',
        routerLink: 'lipw-export',
      },
      { label: 'Report', icon: 'fas fa-file-alt', routerLink: 'report' },
      // { label: 'Beneficiary Audit', icon: 'fas fa-history', routerLink: 'beneficiary-audit/audit' },
      {
        label: 'Beneficiary Audit',
        icon: 'fas fa-history',
        items: [
          {
            label: 'Audit List',
            icon: 'fas fa-list',
            routerLink: 'beneficiary-audit/audit',
          },
        ],
      },
      {
        label: 'Archived Beneficiary',
        icon: 'fas fa-trash-restore',
        items: [
          {
            label: 'Archived List',
            icon: 'fas fa-list',
            routerLink: 'restore/list',
          },
        ],
      },
 
    ];
  }

  filterMenusByAccess(menus: any[], allowed: string[]): any[] {
    return menus
      .filter((menu) => allowed.includes(menu.label))
      .map((menu) => ({
        ...menu,
        items: menu.items
          ? this.filterMenusByAccess(menu.items, allowed)
          : undefined,
      }));
  }

  logout() {
    this.apiService.logout();
    window.location.href = `${environment.portals.master}/#/landing`;
  }
}
