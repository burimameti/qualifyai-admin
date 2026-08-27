import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap } from 'rxjs';
@Injectable({providedIn:'root'})
export class AuthService {
  loggedIn=signal(!!localStorage.getItem('qai-token'));
  constructor(private http:HttpClient){}
  login(tenant:string,email:string,password:string,mfaCode:string=''){
    let body=new HttpParams().set('grant_type','password').set('client_id','qualifyai-admin').set('username',email).set('password',password).set('tenant',tenant).set('scope','openid profile email offline_access qualifyai-api');if(mfaCode)body=body.set('mfa_code',mfaCode);
    return this.http.post<any>('/connect/token',body.toString(),{headers:{'Content-Type':'application/x-www-form-urlencoded'}}).pipe(tap(r=>{localStorage.setItem('qai-token',r.access_token);if(r.refresh_token)localStorage.setItem('qai-refresh-token',r.refresh_token);localStorage.setItem('qai-tenant',tenant);this.loggedIn.set(true)}));
  }
  logout(){localStorage.clear();this.loggedIn.set(false)}
}
