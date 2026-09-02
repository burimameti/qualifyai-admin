import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../core/api.service';

export interface PlanDefinition { code:string; name:string; defaultMaxUsers:number; modules:string[] }
export interface LicenseCatalog { modules:string[]; plans:PlanDefinition[] }
export interface TenantEntitlements {
  tenantId:string; plan:string; licenseStatus:string; isUsable:boolean; maxUsers:number;
  startsAtUtc:string; expiresAtUtc:string|null; version:number; modules:string[];
}
export interface TenantSummary { id:string; name:string; slug:string; contactEmail:string; status:string; createdAtUtc:string; updatedAtUtc:string }

@Injectable({providedIn:'root'})
export class ModuleAdminService {
  private readonly identity='/identity/api/identity';
  constructor(private api:ApiService,private http:HttpClient){}
  catalog(){return this.http.get<LicenseCatalog>(`${this.identity}/licenses/catalog`)}
  tenants(){return this.http.get<TenantSummary[]>(`${this.identity}/tenants`)}
  createTenant(payload:{name:string;slug:string;contactEmail:string}){return this.http.post<TenantSummary>(`${this.identity}/tenants`,payload)}
  createTenantAdmin(tenantId:string,payload:{email:string;password:string;firstName:string;lastName:string}){return this.http.post<any>(`${this.identity}/tenants/${tenantId}/admin`,payload)}
  entitlements(tenantId:string){return this.http.get<TenantEntitlements>(`${this.identity}/licenses/tenant/${tenantId}/entitlements`)}
  assign(tenantId:string,payload:{plan:string;startsAtUtc:string;maxUsers:number;expiresAtUtc:string|null;modules:string[]}){
    return this.http.post<TenantEntitlements>(`${this.identity}/licenses/tenant/${tenantId}`,payload);
  }
  update(tenantId:string,payload:{plan:string;maxUsers:number;expiresAtUtc:string|null;modules:string[]}){
    return this.http.put<void>(`${this.identity}/licenses/tenant/${tenantId}`,payload);
  }
  activate(tenantId:string){return this.http.post<void>(`${this.identity}/licenses/tenant/${tenantId}/activate`,{})}
  suspend(tenantId:string){return this.http.post<void>(`${this.identity}/licenses/tenant/${tenantId}/suspend`,{})}
  activateTenant(tenantId:string){return this.http.post<void>(`${this.identity}/tenants/${tenantId}/activate`,{})}
  suspendTenant(tenantId:string){return this.http.post<void>(`${this.identity}/tenants/${tenantId}/suspend`,{})}
  loadPresentationDemo(tenantId:string){return this.api.post<any>(`demo-scenarios/tenant/${tenantId}/reset-and-install`,{})}
}
