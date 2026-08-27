import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor:HttpInterceptorFn=(request,next)=>{
  const auth = inject(AuthService);
  const router = inject(Router);
  const isTokenRequest = request.url.includes('/connect/token');
  const attachToken = (token:string|null) => token && !isTokenRequest
    ? request.clone({setHeaders:{Authorization:`Bearer ${token}`}})
    : request;

  return next(attachToken(auth.accessToken())).pipe(
    catchError((error:HttpErrorResponse) => {
      if (error.status !== 401 || isTokenRequest || !auth.hasRefreshToken()) return throwError(() => error);
      return auth.refreshAccessToken().pipe(
        switchMap(token => next(request.clone({setHeaders:{Authorization:`Bearer ${token}`}}))),
        catchError(refreshError => {
          auth.logout();
          void router.navigate(['/login'],{queryParams:{reason:'session-expired'}});
          return throwError(() => refreshError);
        })
      );
    })
  );
};
