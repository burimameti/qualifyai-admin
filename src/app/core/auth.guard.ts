import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from './auth.service';

export const authGuard:CanActivateFn=()=>{
  const auth=inject(AuthService);
  const router=inject(Router);
  return auth.ensureSession().pipe(
    map(valid=>valid?true:router.createUrlTree(['/login'])),
    catchError(()=>{
      auth.logout();
      return of(router.createUrlTree(['/login'],{queryParams:{reason:'session-expired'}}));
    })
  );
};
