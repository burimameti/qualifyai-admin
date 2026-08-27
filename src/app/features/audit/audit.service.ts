import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
@Injectable({providedIn:'root'})
export class AuditService{
  constructor(private api:ApiService){}
  list<T=any>():Observable<T>{return this.api.get<T>('platform/audit')}
}