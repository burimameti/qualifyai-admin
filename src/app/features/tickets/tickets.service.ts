import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
@Injectable({providedIn:'root'})
export class TicketsService{
  constructor(private api:ApiService){}
  list<T=any>():Observable<T>{return this.api.get<T>('tickets')}
  create<T=any>(x:any){return this.api.post<T>('tickets',x)}
  update<T=any>(id:string,x:any){return this.api.put<T>(`tickets/${id}`,x)}
}