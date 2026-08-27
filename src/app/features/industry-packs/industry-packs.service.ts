import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
@Injectable({providedIn:'root'})
export class IndustryPacksService{
  constructor(private api:ApiService){}
  list<T=any>():Observable<T>{return this.api.get<T>('industry-packs')}
  install<T=any>(id:string){return this.api.post<T>(`industry-packs/${id}/install`,{})}
}