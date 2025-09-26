import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('401 Unauthorized → redirecting to login...');

        const redirectUrl = environment.useHash
          ? `${environment.portals.master}/#/landing`
          : `${environment.portals.master}/landing`;

        window.location.href = redirectUrl;
      }
      return throwError(() => error);
    })
  );
};
