import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
@Injectable({providedIn:'root'})
export class DashboardService{
  constructor(private api:ApiService){}
  summary<T=any>():Observable<T>{return this.api.get<T>('dashboard')}
}