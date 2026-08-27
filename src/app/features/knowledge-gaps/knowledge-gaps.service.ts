import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
@Injectable({providedIn:'root'})
export class KnowledgeGapsService{
  constructor(private api:ApiService){}
  list<T=any>():Observable<T>{return this.api.get<T>('knowledge/gaps')}
  resolve<T=any>(id:string,x:any){return this.api.put<T>(`knowledge/gaps/${id}`,x)}
}