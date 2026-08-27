import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
@Injectable({providedIn:'root'})
export class WhiteLabelService{
  constructor(private api:ApiService){}
  branding<T=any>():Observable<T>{return this.api.get<T>('white-label/branding')}
  domains<T=any>():Observable<T>{return this.api.get<T>('white-label/domains')}
  save<T=any>(x:any){return this.api.put<T>('white-label/branding',x)}
}