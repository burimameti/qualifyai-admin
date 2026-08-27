import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/api.service';
@Injectable({providedIn:'root'})
export class FeatureDataService{
  constructor(private api:ApiService){}
  list<T>(url:string):Observable<T[]>{return this.api.get<T[]>(url)}
  get<T>(url:string):Observable<T>{return this.api.get<T>(url)}
  create<T>(url:string,value:any):Observable<T>{return this.api.post<T>(url,value)}
  update<T>(url:string,value:any):Observable<T>{return this.api.put<T>(url,value)}
  action<T>(url:string,value:any={}):Observable<T>{return this.api.post<T>(url,value)}
}
