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
            label: 'Beneficiary List',
            icon: 'fas fa-list',
            routerLink: 'beneficiary/list',
          },
          {
            label: 'New Registration',
            icon: 'fas fa-user-plus',
            routerLink: 'beneficiary/new-registration',
          },
          {
            label: 'Approval List',
            icon: 'fas fa-user-check',
            routerLink: 'beneficiary-approval/list',
          },
          {
            label: 'Beneficiary Audit List',
            icon: 'fas fa-list',
            routerLink: 'beneficiary-audit/audit',
          },
          {
            label: 'Archived Beneficiary List',
            icon: 'fas fa-list',
            routerLink: 'restore/list',
          },
          {
            label: 'Pending Verification List',
            icon: 'fas fa-list',
            routerLink: 'pending-beneficiary/list',
          },
        ],
      },
      {
            label: 'Adjudication',
            icon: 'fas fa-users-viewfinder',
            routerLink: 'adjudication-list',
      },
      { 
        
            label: 'Report',
            icon: 'fas fa-file-alt',
            routerLink: 'report'
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
      
      // { label: 'Beneficiary Audit', icon: 'fas fa-history', routerLink: 'beneficiary-audit/audit' },
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
