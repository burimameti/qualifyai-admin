import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, finalize, map, of, shareReplay, tap } from 'rxjs';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface UserSession {
  subject: string;
  name: string;
  email: string;
  tenantId: string;
  tenantSlug: string;
  licensePlan: string;
  roles: string[];
  permissions: string[];
  modules: string[];
}

@Injectable({providedIn:'root'})
export class AuthService {
  private readonly accessTokenKey = 'qai-token';
  private readonly refreshTokenKey = 'qai-refresh-token';
  private readonly tenantKey = 'qai-tenant';
  private refreshRequest?: Observable<string>;

  readonly loggedIn = signal(this.hasValidAccessToken());
  readonly session = signal<UserSession|null>(this.hasValidAccessToken() ? this.readSession(this.accessToken()) : null);

  constructor(private http:HttpClient){}

  login(tenant:string,email:string,password:string,mfaCode:string=''){
    const normalizedTenant = tenant.trim().toLowerCase();
    let body=new HttpParams().set('grant_type','password').set('client_id','qualifyai-admin').set('username',email.trim()).set('password',password).set('tenant',normalizedTenant).set('scope','openid profile email offline_access qualifyai-api');
    if(mfaCode) body=body.set('mfa_code',mfaCode.trim());
    return this.http.post<TokenResponse>('/connect/token',body.toString(),{headers:{'Content-Type':'application/x-www-form-urlencoded'}})
      .pipe(tap(response => this.storeSession(response, normalizedTenant)));
  }

  accessToken(): string | null {
    return localStorage.getItem(this.accessTokenKey);
  }

  hasRefreshToken(): boolean {
    return !!localStorage.getItem(this.refreshTokenKey);
  }

  hasValidAccessToken(): boolean {
    const token = this.accessToken();
    if (!token) return false;
    const payload = this.decodePayload(token);
    return typeof payload?.['exp'] === 'number' && payload['exp'] * 1000 > Date.now() + 30_000;
  }

  hasPermission(permission:string):boolean {
    const session = this.session();
    return !!session && (session.permissions.includes('system.admin') || session.permissions.includes(permission));
  }

  hasModule(module:string):boolean {
    const session = this.session();
    return !!session && (session.permissions.includes('system.admin') || session.modules.includes(module));
  }

  ensureSession(): Observable<boolean> {
    if (this.hasValidAccessToken()) {
      this.loggedIn.set(true);
      return of(true);
    }
    if (!this.hasRefreshToken()) {
      this.logout();
      return of(false);
    }
    return this.refreshAccessToken().pipe(map(() => true));
  }

  refreshAccessToken(): Observable<string> {
    if (this.refreshRequest) return this.refreshRequest;
    const refreshToken = localStorage.getItem(this.refreshTokenKey);
    if (!refreshToken) throw new Error('Refresh token is unavailable.');
    const body = new HttpParams()
      .set('grant_type','refresh_token')
      .set('client_id','qualifyai-admin')
      .set('refresh_token',refreshToken)
      .set('scope','openid profile email offline_access qualifyai-api');
    this.refreshRequest = this.http.post<TokenResponse>('/connect/token',body.toString(),{
      headers:{'Content-Type':'application/x-www-form-urlencoded'}
    }).pipe(
      tap(response => this.storeSession(response)),
      map(response => response.access_token),
      finalize(() => this.refreshRequest = undefined),
      shareReplay({bufferSize:1,refCount:false})
    );
    return this.refreshRequest;
  }

  logout(){
    localStorage.removeItem(this.accessTokenKey);
    localStorage.removeItem(this.refreshTokenKey);
    localStorage.removeItem(this.tenantKey);
    this.loggedIn.set(false);
    this.session.set(null);
  }

  private storeSession(response:TokenResponse, tenant?:string):void {
    if (!response.access_token) throw new Error('Identity did not return an access token.');
    localStorage.setItem(this.accessTokenKey,response.access_token);
    if(response.refresh_token) localStorage.setItem(this.refreshTokenKey,response.refresh_token);
    if(tenant) localStorage.setItem(this.tenantKey,tenant);
    this.loggedIn.set(this.hasValidAccessToken());
    this.session.set(this.readSession(response.access_token));
  }

  private decodePayload(token:string):Record<string,unknown>|null {
    try {
      const encoded = token.split('.')[1];
      if (!encoded) return null;
      const base64 = encoded.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(encoded.length/4)*4,'=');
      return JSON.parse(atob(base64)) as Record<string,unknown>;
    } catch {
      return null;
    }
  }

  private readSession(token:string|null):UserSession|null {
    if (!token) return null;
    const payload = this.decodePayload(token);
    if (!payload) return null;
    return {
      subject:this.readString(payload,'sub'),
      name:this.readString(payload,'name') || this.readString(payload,'email'),
      email:this.readString(payload,'email'),
      tenantId:this.readString(payload,'tenant_id'),
      tenantSlug:this.readString(payload,'tenant_slug'),
      licensePlan:this.readString(payload,'license_plan'),
      roles:this.readArray(payload,'role'),
      permissions:this.readArray(payload,'permission'),
      modules:this.readArray(payload,'module')
    };
  }

  private readString(payload:Record<string,unknown>,key:string):string {
    const value=payload[key];
    return typeof value==='string'?value:'';
  }

  private readArray(payload:Record<string,unknown>,key:string):string[] {
    const value=payload[key];
    if (Array.isArray(value)) return value.filter((x):x is string=>typeof x==='string');
    return typeof value==='string'?[value]:[];
  }
}
