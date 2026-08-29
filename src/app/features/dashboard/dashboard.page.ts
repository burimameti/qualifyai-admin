import { CommonModule } from '@angular/common';
import { Component,OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { DashboardService } from './dashboard.service';
import { PageHeader } from '../../shared/ui';

@Component({standalone:true,imports:[CommonModule,PageHeader],template:`
<qai-page-header title="Revenue Command Center" subtitle="Automated support, sales qualification and revenue automation in one operating view."><button (click)="refresh()">↻ Refresh</button><button class="primary" (click)="go('/automations')">Review automations</button></qai-page-header>
<div class="error" *ngIf="error">{{error}}</div>
<section class="panel empty" *ngIf="loaded&&!error&&!hasData"><b>No revenue scenario is installed for this workspace</b><span>The dashboard reads persisted records for tenant {{tenantLabel}}. Install the complete safe demo to add prospects, a campaign, qualified lead, pipeline opportunity, meeting, tickets and automation results.</span><button class="primary" style="margin-top:14px" (click)="installDemo()" [disabled]="installing">{{installing?'Installing…':'Install complete demo scenario'}}</button></section>
<ng-container *ngIf="hasData">
<div class="metrics"><article (click)="go('/crm/leads')"><span>Qualified leads</span><strong>{{d.leads||0}}</strong><small>Persisted CRM leads</small></article><article (click)="go('/crm/leads')"><span>Hot leads</span><strong>{{d.hotLeads||0}}</strong><small>Needs sales action</small></article><article (click)="go('/pipeline')"><span>Open pipeline</span><strong>{{money(d.pipeline||0)}}</strong><small>Current SQL pipeline</small></article><article (click)="go('/inbox')"><span>Open conversations</span><strong>{{d.openConversations||0}}</strong><small>Customer conversations</small></article><article (click)="go('/tickets')"><span>Open tickets</span><strong>{{d.openTickets||0}}</strong><small>Requires resolution</small></article></div>
<div class="grid2"><section class="panel"><header><div><b>Revenue influenced</b><span>Persisted attribution and pipeline</span></div><strong>{{money(d.influencedRevenue||0)}}</strong></header><footer><span>Open pipeline <b>{{money(d.pipeline||0)}}</b></span><span>Won revenue <b>{{money(d.wonRevenue||0)}}</b></span></footer></section><section class="panel"><header><div><b>Automation impact</b><span>Measured from completed database records</span></div></header><div class="impact"><div><b>{{d.estimatedHoursSaved||0}}h</b><span>Estimated time saved</span></div><div><b>{{d.automationActions||0}}</b><span>Actions executed</span></div><div><b>{{d.meetingsBooked||0}}</b><span>Meetings booked</span></div><div><b>{{d.completedRuns||0}}</b><span>Completed runs</span></div></div><button class="link" (click)="go('/automations')">Review automations →</button></section></div>
<div class="grid2"><section class="panel"><header><b>Priority opportunities</b><button (click)="go('/pipeline')">View pipeline</button></header><table><thead><tr><th>Company</th><th>Intent</th><th>Score</th><th>Value</th><th>Next action</th></tr></thead><tbody><tr *ngFor="let x of d.opportunities||[]"><td><b>{{x.company}}</b><small>{{x.country}}</small></td><td>{{x.intent}}</td><td><span class="score hot">{{x.score}}</span></td><td>{{money(x.value)}}</td><td><button class="small" (click)="go('/pipeline')">Open</button></td></tr></tbody></table><p *ngIf="!d.opportunities?.length">No persisted opportunities yet.</p></section><section class="panel"><header><b>Knowledge gaps</b><button (click)="go('/knowledge/gaps')">Resolve</button></header><div class="gap" *ngFor="let g of d.knowledgeGaps||[]"><div><b>{{g.topic}}</b><span>{{g.count}} unanswered questions</span></div><em>{{g.impact}}</em></div><p *ngIf="!d.knowledgeGaps?.length">No open knowledge gaps.</p></section></div>
</ng-container>`})
export class DashboardPage implements OnInit{
  d:any={};loaded=false;installing=false;error='';tenantLabel=localStorage.getItem('qai-tenant')||'current tenant';
  constructor(private data:DashboardService,private router:Router){}
  ngOnInit(){this.refresh()}
  get hasData(){return Number(this.d.contacts||0)+Number(this.d.leads||0)+Number(this.d.openConversations||0)+Number(this.d.openTickets||0)+Number(this.d.pipeline||0)>0}
  refresh(){this.error='';this.data.summary<any>().subscribe({next:r=>{this.d=r;this.loaded=true},error:e=>{this.loaded=true;this.error=e?.error?.detail||e?.error?.title||`Dashboard request failed (${e.status||'network error'}).`}})}
  installDemo(){this.installing=true;this.error='';this.data.installDemo().subscribe({next:()=>{this.installing=false;this.refresh()},error:e=>{this.installing=false;this.error=e?.error?.detail||e?.error?.title||'Demo scenario could not be installed.'}})}
  go(x:string){void this.router.navigateByUrl(x)}
  money(v:number){return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v||0)}
}
