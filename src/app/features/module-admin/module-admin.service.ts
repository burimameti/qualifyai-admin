import { Injectable } from '@angular/core';
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
  constructor(private api:ApiService){}
  catalog(){return this.api.get<LicenseCatalog>('identity/licenses/catalog')}
  tenants(){return this.api.get<TenantSummary[]>('identity/tenants')}
  createTenant(payload:{name:string;slug:string;contactEmail:string}){return this.api.post<TenantSummary>('identity/tenants',payload)}
  createTenantAdmin(tenantId:string,payload:{email:string;password:string;firstName:string;lastName:string}){return this.api.post<any>(`identity/tenants/${tenantId}/admin`,payload)}
  entitlements(tenantId:string){return this.api.get<TenantEntitlements>(`identity/licenses/tenant/${tenantId}/entitlements`)}
  assign(tenantId:string,payload:{plan:string;startsAtUtc:string;maxUsers:number;expiresAtUtc:string|null;modules:string[]}){
    return this.api.post<TenantEntitlements>(`identity/licenses/tenant/${tenantId}`,payload);
  }
  update(tenantId:string,payload:{plan:string;maxUsers:number;expiresAtUtc:string|null;modules:string[]}){
    return this.api.put<void>(`identity/licenses/tenant/${tenantId}`,payload);
  }
  activate(tenantId:string){return this.api.post<void>(`identity/licenses/tenant/${tenantId}/activate`,{})}
  suspend(tenantId:string){return this.api.post<void>(`identity/licenses/tenant/${tenantId}/suspend`,{})}
  activateTenant(tenantId:string){return this.api.post<void>(`identity/tenants/${tenantId}/activate`,{})}
  suspendTenant(tenantId:string){return this.api.post<void>(`identity/tenants/${tenantId}/suspend`,{})}
  installDemo(tenantId:string){return this.api.post<any>(`demo-scenarios/tenant/${tenantId}/install`,{})}
}
