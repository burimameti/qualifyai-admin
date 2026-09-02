import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
@Injectable({providedIn:'root'})
export class DashboardService{
  constructor(private api:ApiService){}
  summary<T=any>():Observable<T>{return this.api.get<T>('dashboard')}
  resetDemo<T=any>():Observable<T>{return this.api.post<T>('demo-scenarios/reset',{})}
  resetAndInstallDemo<T=any>():Observable<T>{return this.api.post<T>('demo-scenarios/reset-and-install',{})}
}
