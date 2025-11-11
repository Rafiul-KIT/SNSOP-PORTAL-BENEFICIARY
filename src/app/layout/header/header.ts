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
      const menus = sessionStorage.getItem(`menus_${roleId}`);
      if (menus) {
        const responseData = JSON.parse(menus);

        // Handle empty response
        if (responseData.length === 0) {
          console.warn(`No menus found for role ${roleId}`);
          this.menuList = [];
          this.menusLoaded = true;
          this.cdRef.detectChanges();
          return;
        }

        const allowedNames = responseData.map((menu: any) => menu.name);
        const allMenus = this.getStaticMenus();

        // ✅ Update safely and trigger view refresh
        this.menuList = this.filterMenusByAccess(allMenus, allowedNames);
        this.menusLoaded = true;
        this.cdRef.detectChanges();
      } else {
        console.warn(`No menus found in sessionStorage for role ${roleId}`);
        this.menuList = [];
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
        label: 'Beneficiary',
        icon: 'fas fa-people-group',
        items: [
          {
            label: 'Pending Verification List',
            icon: 'fas fa-list',
            // routerLink: 'pending-beneficiary/list',
            routerLink: 'under-construction',
          },
          {
            label: 'Beneficiary List',
            icon: 'fas fa-list',
            routerLink: 'beneficiary/list',
          },
          {
            label: 'Beneficiary View List',
            icon: 'fas fa-list',
            routerLink: 'beneficiary/view-list',
          },
          {
            label: 'Approval List',
            icon: 'fas fa-user-check',
            routerLink: 'beneficiary-approval/list',
          },
          {
            label: 'Beneficiary Audit List',
            icon: 'fas fa-list',
            routerLink: 'beneficiary-audit/list',
          },
          {
            label: 'Archived Beneficiary List',
            icon: 'fas fa-list',
            routerLink: 'restore/list',
          },
          {
            label: 'New Registration',
            icon: 'fas fa-user-plus',
            // routerLink: 'beneficiary/new-registration',
            routerLink: 'under-construction',
          },
        ],
      },
      {
        label: 'Adjudication',
        icon: 'fas fa-users-viewfinder',
        // routerLink: 'adjudication/list',
        routerLink: 'under-construction',
      },
      {
        label: 'Report',
        icon: 'fas fa-file-alt',
        items: [
          {
            label: 'Boma Wise Beneficiary List Report',
            icon: 'fas fa-file-alt',
            // routerLink: 'report/boma-wise-beneficiary-list',
          },
          {
            label: 'Boma & Data Entry Staff Wise Registration Report',
            icon: 'fas fa-file-alt',
            // routerLink: 'report/data-entry-wise-registration',
          },
          {
            label: 'Boma Wise Age Group Report',
            icon: 'fas fa-file-alt',
            // routerLink: 'report/boma-wise-age-group',
          },
          {
            label: 'Households Interested in Component 2 Report',
            icon: 'fas fa-file-alt',
            // routerLink: 'report/interested-in-component2',
          },
          {
            label: 'Report for Biometric Match List',
            icon: 'fas fa-file-alt',
            // routerLink: 'report/biometric-match-list',
          },
          {
            label: 'Complete Household Survey Report',
            icon: 'fas fa-file-alt',
            // routerLink: 'report/complete-household-survey',
          },
        ],
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
    ];
  }

  // ✅ Recursive filter: keep only allowed menus (parent and child)
  filterMenusByAccess(menus: any[], allowedNames: string[]): any[] {
    return menus
      .filter((menu) => allowedNames.includes(menu.label)) // filter parent menus
      .map((menu) => ({
        ...menu,
        // Recursively filter child menus if the parent is allowed
        items: menu.items
          ? this.filterMenusByAccess(menu.items, allowedNames)
          : undefined,
      }));
  }

  logout() {
    this.apiService.logout();
    window.location.href = `${environment.portals.master}/#/landing`;
  }
}
