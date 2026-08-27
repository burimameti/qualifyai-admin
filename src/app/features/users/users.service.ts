import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({providedIn:'root'})
export class UsersService{
  constructor(private http:HttpClient){}
  list(){return this.http.get<any[]>('/identity/users/')}
  create(x:any){return this.http.post<any>('/identity/users/',x)}
  enable(id:string){return this.http.post<void>(`/identity/users/${id}/enable`,{})}
  disable(id:string){return this.http.post<void>(`/identity/users/${id}/disable`,{})}
  roles(id:string,roles:string[]){return this.http.put<void>(`/identity/users/${id}/roles`,{roles})}
  permissions(id:string,permissions:string[]){return this.http.put<void>(`/identity/users/${id}/permissions`,{permissions})}
  me(){return this.http.get<any>('/identity/users/me')}
}
