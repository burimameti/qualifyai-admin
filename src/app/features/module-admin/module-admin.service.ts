import { Injectable } from '@angular/core';
import { ApiService } from '../../core/api.service';

export interface PlanDefinition { code:string; name:string; defaultMaxUsers:number; modules:string[] }
export interface LicenseCatalog { modules:string[]; plans:PlanDefinition[] }
export interface TenantEntitlements {
  tenantId:string; plan:string; licenseStatus:string; isUsable:boolean; maxUsers:number;
  startsAtUtc:string; expiresAtUtc:string|null; version:number; modules:string[];
}

@Injectable({providedIn:'root'})
export class ModuleAdminService {
  constructor(private api:ApiService){}
  catalog(){return this.api.get<LicenseCatalog>('identity/licenses/catalog')}
  entitlements(tenantId:string){return this.api.get<TenantEntitlements>(`identity/licenses/tenant/${tenantId}/entitlements`)}
  update(tenantId:string,payload:{plan:string;maxUsers:number;expiresAtUtc:string|null;modules:string[]}){
    return this.api.put<void>(`identity/licenses/tenant/${tenantId}`,payload);
  }
  activate(tenantId:string){return this.api.post<void>(`identity/licenses/tenant/${tenantId}/activate`,{})}
  suspend(tenantId:string){return this.api.post<void>(`identity/licenses/tenant/${tenantId}/suspend`,{})}
}
