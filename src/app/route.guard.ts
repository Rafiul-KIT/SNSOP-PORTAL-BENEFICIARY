import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { environment } from '../environments/environment';

export const routeGuard: CanActivateChildFn = (route: any) => {
  const cookieService = inject(CookieService);
  const router = inject(Router);
  let lState: boolean = true;
  const ACCESS_TOKEN = environment.cookie_name;
  const isLoggedIn = cookieService.get(ACCESS_TOKEN) ? true : false;
  // console.log('routeGuard', isLoggedIn);
  // console.log('routeGuard', route.routeConfig.path);
  if (!isLoggedIn) {
    lState = false;
    const redirectUrl = `${environment.portals.master}/#/landing`; // Use hash-based routing for production
    window.location.href = redirectUrl; // Redirect to the correct landing page
  }
 return lState;
};

