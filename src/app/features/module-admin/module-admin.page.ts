import { CommonModule } from '@angular/common';
import { Component,OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin,switchMap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { PageHeader } from '../../shared/ui';
import { LicenseCatalog,ModuleAdminService,PlanDefinition,TenantEntitlements } from './module-admin.service';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule,PageHeader],
  styles:[` .module-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.module-card{display:grid;grid-template-columns:38px 1fr auto;gap:10px;align-items:center;border:1px solid var(--line);border-radius:10px;padding:13px}.module-card.locked{background:#f8fafc}.module-card i{width:36px;height:36px;display:grid;place-items:center;border-radius:8px;background:#eff6ff;color:#2563eb;font-style:normal}.module-card b,.module-card small{display:block}.module-card b{font-size:10px;text-transform:capitalize}.module-card small{font-size:8px;color:var(--muted);margin-top:3px}.admin-form{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}.admin-form label{display:flex;flex-direction:column;gap:6px;font-size:9px;font-weight:700}.admin-form input,.admin-form select{height:38px;border:1px solid var(--line);border-radius:8px;padding:0 10px}.notice{padding:11px;border-radius:8px;font-size:9px;margin-bottom:12px}.notice.ok{background:#ecfdf3;color:#166534}.notice.bad{background:#fef2f2;color:#b91c1c}.plan-note{font-size:8px;color:var(--muted);margin:10px 0 0}@media(max-width:1000px){.module-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.module-grid,.admin-form{grid-template-columns:1fr}}`],
  template:`
  <qai-page-header title="Modules & Features" subtitle="Control the tenant plan, user limit and paid product capabilities.">
    <button type="button" (click)="toggleStatus()" [disabled]="busy">{{license?.licenseStatus==='Active'?'Suspend license':'Activate license'}}</button>
    <button class="primary" type="button" (click)="save()" [disabled]="busy||!license">{{busy?'Saving…':'Save access'}}</button>
  </qai-page-header>
  <div *ngIf="message" class="notice" [class.ok]="success" [class.bad]="!success">{{message}}</div>
  <section class="panel" *ngIf="license">
    <header><div><b>Subscription controls</b><span>Changes are enforced by the API and reflected in navigation after token refresh.</span></div><span class="pill" [class.success]="license.isUsable">{{license.licenseStatus}}</span></header>
    <div class="admin-form">
      <label>Plan<select [(ngModel)]="selectedPlan" (ngModelChange)="planChanged()"><option *ngFor="let p of catalog?.plans" [value]="p.code">{{p.name}}</option></select></label>
      <label>Maximum users<input type="number" min="1" [(ngModel)]="maxUsers"></label>
      <label>Expires on<input type="date" [(ngModel)]="expiryDate"></label>
    </div>
    <p class="plan-note">License version {{license.version}} · Settings and Billing always remain active to prevent an administrative lockout.</p>
  </section>
  <section class="panel" *ngIf="license" style="margin-top:13px">
    <header><div><b>Enabled modules</b><span>Only modules included in {{selectedPlan|titlecase}} can be enabled.</span></div><strong>{{enabledCount}} / {{catalog?.modules?.length||0}}</strong></header>
    <div class="module-grid">
      <article class="module-card" *ngFor="let module of catalog?.modules" [class.locked]="!available(module)">
        <i>{{icon(module)}}</i><div><b>{{label(module)}}</b><small>{{description(module)}}<ng-container *ngIf="!available(module)"> · Upgrade required</ng-container></small></div>
        <label class="toggle"><input type="checkbox" [checked]="enabled.has(module)" [disabled]="core(module)||!available(module)" (change)="setModule(module,$any($event.target).checked)"><span></span></label>
      </article>
    </div>
  </section>`
})
export class ModuleAdminPage implements OnInit {
  catalog?:LicenseCatalog; license?:TenantEntitlements; selectedPlan=''; maxUsers=1; expiryDate=''; enabled=new Set<string>(); busy=false; message=''; success=false;
  private readonly descriptions:Record<string,string>={crm:'Prospects, campaigns, leads and pipeline',inbox:'Customer conversations and replies',ticketing:'Issue tracking and resolution',automation:'Scheduled and event-driven workflows',knowledge:'Business knowledge and guidance',ai:'Advanced business assistants and evaluation',analytics:'Performance, funnel and ROI reporting',integrations:'External systems and provider connections',settings:'Users, access and tenant configuration',billing:'Plan, entitlement and usage controls'};
  constructor(private data:ModuleAdminService,private auth:AuthService){}
  ngOnInit(){const tenant=this.auth.session()?.tenantId;if(!tenant){this.fail('Tenant is missing from the current session.');return}forkJoin({catalog:this.data.catalog(),license:this.data.entitlements(tenant)}).subscribe({next:r=>{this.catalog=r.catalog;this.apply(r.license)},error:e=>this.fail(e?.error?.detail||'Could not load module administration.')})}
  get plan():PlanDefinition|undefined{return this.catalog?.plans.find(p=>p.code===this.selectedPlan)}
  get enabledCount(){return this.enabled.size}
  planChanged(){const p=this.plan;if(!p)return;this.maxUsers=p.defaultMaxUsers;this.enabled=new Set([...this.enabled].filter(x=>p.modules.includes(x)));this.enabled.add('settings');this.enabled.add('billing')}
  available(module:string){return !!this.plan?.modules.includes(module)}
  core(module:string){return module==='settings'||module==='billing'}
  setModule(module:string,on:boolean){on?this.enabled.add(module):this.enabled.delete(module)}
  save(){const tenant=this.auth.session()?.tenantId;if(!tenant||!this.license)return;this.busy=true;this.message='';const expiry=this.expiryDate?new Date(this.expiryDate+'T23:59:59Z').toISOString():null;this.data.update(tenant,{plan:this.selectedPlan,maxUsers:this.maxUsers,expiresAtUtc:expiry,modules:[...this.enabled]}).pipe(switchMap(()=>this.auth.refreshAccessToken()),switchMap(()=>this.data.entitlements(tenant))).subscribe({next:r=>{this.apply(r);this.busy=false;this.success=true;this.message='Access updated. The menu and API authorization now follow this license.'},error:e=>{this.busy=false;this.fail(e?.error?.detail||e?.error?.title||'Could not update the license.')}})}
  toggleStatus(){const tenant=this.auth.session()?.tenantId;if(!tenant||!this.license)return;this.busy=true;const call=this.license.licenseStatus==='Active'?this.data.suspend(tenant):this.data.activate(tenant);call.pipe(switchMap(()=>this.auth.refreshAccessToken()),switchMap(()=>this.data.entitlements(tenant))).subscribe({next:r=>{this.apply(r);this.busy=false;this.success=true;this.message=`License is now ${r.licenseStatus.toLowerCase()}.`},error:e=>{this.busy=false;this.fail(e?.error?.detail||'Could not change license status.')}})}
  label(module:string){return module==='ai'?'Business assistants':module}
  description(module:string){return this.descriptions[module]||'Product capability'}
  icon(module:string){return ({crm:'◎',inbox:'▱',ticketing:'▣',automation:'⚡',knowledge:'▥',ai:'✦',analytics:'▤',integrations:'↗',settings:'⚙',billing:'€'} as Record<string,string>)[module]||'◇'}
  private apply(r:TenantEntitlements){this.license=r;this.selectedPlan=r.plan;this.maxUsers=r.maxUsers;this.expiryDate=r.expiresAtUtc?.slice(0,10)||'';this.enabled=new Set(r.modules)}
  private fail(message:string){this.success=false;this.message=message}
}
