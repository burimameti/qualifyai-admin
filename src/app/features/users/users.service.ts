import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
@Injectable({providedIn:'root'})
export class UsersService{
  private readonly users='/identity/api/identity/users';
  constructor(private http:HttpClient){}
  list(){return this.http.get<any[]>(this.users)}
  create(x:any){return this.http.post<any>(this.users,x)}
  enable(id:string){return this.http.post<void>(`${this.users}/${id}/enable`,{})}
  disable(id:string){return this.http.post<void>(`${this.users}/${id}/disable`,{})}
  roles(id:string,roles:string[]){return this.http.put<void>(`${this.users}/${id}/roles`,{roles})}
  permissions(id:string,permissions:string[]){return this.http.put<void>(`${this.users}/${id}/permissions`,{permissions})}
  me(){return this.http.get<any>(`${this.users}/me`)}
}
