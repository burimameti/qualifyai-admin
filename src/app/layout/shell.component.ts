import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';

interface NavigationItem {
  group:string;
  label:string;
  url:string;
  icon:string;
  module:string;
  permission:string;
}

@Component({
  selector:'qai-shell',
  standalone:true,
  imports:[CommonModule,RouterOutlet,RouterLink,RouterLinkActive],
  template:`<div class="shell"><aside><div class="brand">✦ <span>QualifyAI</span><small>ENTERPRISE</small></div><div class="workspace"><i>{{initials(workspaceName)}}</i><div><b>{{workspaceName}}</b><span>{{session?.licensePlan||'Licensed'}} workspace</span></div></div><nav><ng-container *ngFor="let group of visibleGroups"><label>{{group}}</label><a *ngFor="let item of navBy(group)" [routerLink]="item.url" routerLinkActive="active"><span>{{item.icon}}</span>{{item.label}}</a></ng-container></nav><div class="side-bottom"><div class="usage"><span>License plan</span><b>{{session?.licensePlan||'—'}}</b><i><u></u></i></div><button type="button" (click)="logout()">{{initials(session?.name||session?.email||'User')}} <span>{{session?.name||session?.email||'User'}}<small>{{primaryRole}}</small></span>↗</button></div></aside><main><header><div class="search">⌕ <input aria-label="Global search" placeholder="Search customers, conversations, tickets…"><kbd>Ctrl K</kbd></div><div class="head-actions"><button type="button" aria-label="Help">?</button><button type="button" aria-label="Notifications">♢</button><div class="avatar">{{initials(session?.name||session?.email||'User')}}</div></div></header><section class="page"><router-outlet/></section></main></div>`
})
export class ShellComponent {
  readonly groups=['OVERVIEW','ACQUIRE','CONVERT','CUSTOMER SERVICE','BUSINESS AUTOMATION','PLATFORM'];
  readonly nav:NavigationItem[]=[
    {group:'OVERVIEW',label:'Dashboard',url:'/dashboard',icon:'⌂',module:'analytics',permission:'analytics.read'},
    {group:'ACQUIRE',label:'Prospect Discovery',url:'/discover',icon:'⌕',module:'crm',permission:'crm.read'},
    {group:'ACQUIRE',label:'Campaigns',url:'/campaigns',icon:'↗',module:'crm',permission:'crm.read'},
    {group:'CONVERT',label:'Companies',url:'/crm/companies',icon:'▦',module:'crm',permission:'crm.read'},
    {group:'CONVERT',label:'Contacts',url:'/crm/contacts',icon:'◎',module:'crm',permission:'crm.read'},
    {group:'CONVERT',label:'Qualified Leads',url:'/crm/leads',icon:'◆',module:'crm',permission:'crm.read'},
    {group:'CONVERT',label:'Opportunities',url:'/crm/opportunities',icon:'◈',module:'crm',permission:'crm.read'},
    {group:'CONVERT',label:'Pipeline',url:'/pipeline',icon:'▤',module:'crm',permission:'crm.read'},
    {group:'CONVERT',label:'Demos & Meetings',url:'/meetings',icon:'◷',module:'crm',permission:'crm.read'},
    {group:'CUSTOMER SERVICE',label:'Customer Inbox',url:'/inbox',icon:'▱',module:'inbox',permission:'conversations.read'},
    {group:'CUSTOMER SERVICE',label:'Issues & Tickets',url:'/tickets',icon:'▣',module:'ticketing',permission:'tickets.read'},
    {group:'BUSINESS AUTOMATION',label:'Business Assistants',url:'/ai/agents',icon:'✦',module:'ai',permission:'agents.read'},
    {group:'BUSINESS AUTOMATION',label:'Knowledge',url:'/knowledge',icon:'▥',module:'knowledge',permission:'knowledge.read'},
    {group:'BUSINESS AUTOMATION',label:'Knowledge Gaps',url:'/knowledge/gaps',icon:'△',module:'knowledge',permission:'knowledge.read'},
    {group:'BUSINESS AUTOMATION',label:'Workflows',url:'/workflows',icon:'⌁',module:'automation',permission:'automation.read'},
    {group:'BUSINESS AUTOMATION',label:'Automations',url:'/automations',icon:'⚡',module:'automation',permission:'automation.read'},
    {group:'BUSINESS AUTOMATION',label:'Evaluations',url:'/evaluations',icon:'✓',module:'ai',permission:'agents.read'},
    {group:'PLATFORM',label:'Integrations',url:'/integrations',icon:'↗',module:'integrations',permission:'integrations.read'},
    {group:'PLATFORM',label:'Analytics & ROI',url:'/analytics',icon:'▥',module:'analytics',permission:'analytics.read'},
    {group:'PLATFORM',label:'Billing & Usage',url:'/billing',icon:'€',module:'billing',permission:'billing.read'},
    {group:'PLATFORM',label:'Users & Access',url:'/users',icon:'♙',module:'settings',permission:'users.read'},
    {group:'PLATFORM',label:'Security',url:'/security',icon:'◇',module:'settings',permission:'settings.manage'},
    {group:'PLATFORM',label:'White Label',url:'/white-label',icon:'◐',module:'settings',permission:'settings.manage'},
    {group:'PLATFORM',label:'Industry Packs',url:'/industry-packs',icon:'▦',module:'settings',permission:'settings.manage'},
    {group:'PLATFORM',label:'Audit Log',url:'/audit',icon:'≡',module:'settings',permission:'audit.read'}
  ];

  constructor(public readonly auth:AuthService,private readonly router:Router){}

  get session(){return this.auth.session()}
  get workspaceName(){return this.session?.tenantSlug||'Workspace'}
  get primaryRole(){return this.session?.roles[0]||'Member'}
  get visibleGroups(){return this.groups.filter(group=>this.navBy(group).length>0)}
  navBy(group:string){return this.nav.filter(item=>item.group===group&&this.auth.hasModule(item.module)&&this.auth.hasPermission(item.permission))}
  initials(value:string){return value.split(/\s+|@/).filter(Boolean).map(part=>part[0]).join('').slice(0,2).toUpperCase()||'U'}
  logout(){this.auth.logout();void this.router.navigate(['/login'])}
}
