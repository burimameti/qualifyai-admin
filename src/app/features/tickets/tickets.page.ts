import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal, PageHeader } from '../../shared/ui';
import { TicketsService } from './tickets.service';

@Component({standalone:true,imports:[CommonModule,FormsModule,Modal,PageHeader],template:`
<qai-page-header title="Issues & Tickets" subtitle="Run support operations with assignment, priority, SLA and resolution tracking."><button (click)="load()">↻ Refresh</button><button class="primary" (click)="create()">+ Create ticket</button></qai-page-header>
<div class="callout warning" *ngIf="error"><span class="callout-icon">!</span><div><b>Tickets could not be loaded</b><p>{{error}}</p></div></div>
<section class="directory-card"><header><div><span class="eyebrow">SUPPORT DIRECTORY</span><h2>Ticket workspace</h2><p>Track priority, ownership, SLA and resolution from one operational list.</p></div><div class="directory-summary"><span><b>{{rows.length}}</b>Total</span><span><b>{{openCount}}</b>Open</span><span><b>{{pendingCount}}</b>Pending</span></div></header>
<div class="directory-toolbar"><label><span>⌕</span><input [(ngModel)]="q" placeholder="Search ticket number or subject"></label><select [(ngModel)]="status"><option value="">All statuses</option><option>New</option><option>Open</option><option>Pending</option><option>Resolved</option><option>Closed</option></select><strong>{{visible.length}} shown</strong></div>
<div class="data-state" *ngIf="loading">Loading tickets…</div><div class="directory-empty" *ngIf="!loading && !error && !visible.length"><i>▣</i><strong>{{rows.length?'No tickets match the filter':'No tickets yet'}}</strong><span>{{rows.length?'Change the search or status filter.':'Create the first ticket to start tracking SLA and resolution.'}}</span><button *ngIf="!rows.length" class="primary" (click)="create()">Create ticket</button></div>
<div class="table-wrap" *ngIf="!loading && visible.length"><table><thead><tr><th>Ticket</th><th>Subject</th><th>Priority</th><th>Status</th><th>SLA</th><th>Created</th><th>Action</th></tr></thead><tbody><tr *ngFor="let t of visible" (click)="edit(t)"><td><div class="directory-identity"><i>▣</i><span><b>{{t.number}}</b><small>Support issue</small></span></div></td><td><b>{{t.subject}}</b></td><td><span class="pill" [class.hot]="isHigh(t)">{{priorityLabel(t.priority)}}</span></td><td><span class="pill" [ngClass]="statusClass(t.status)">{{statusLabel(t.status)}}</span></td><td><span class="sla">{{sla(t)}}</span></td><td>{{t.createdAtUtc|date:'short'}}</td><td><div class="directory-actions"><button class="small" (click)="edit(t);$event.stopPropagation()">Open</button></div></td></tr></tbody></table></div></section>
<qai-modal [open]="show" [title]="form.id?'Ticket details':'Create support ticket'" (close)="show=false"><form class="form" (ngSubmit)="save()"><label>Subject<input [(ngModel)]="form.subject" name="subject" required></label><label>Description<textarea [(ngModel)]="form.description" name="description"></textarea></label><div class="form2"><label>Priority<select [(ngModel)]="form.priority" name="priority"><option [ngValue]="0">Low</option><option [ngValue]="1">Normal</option><option [ngValue]="2">High</option><option [ngValue]="3">Urgent</option></select></label><label>Status<select [(ngModel)]="form.status" name="status"><option [ngValue]="0">New</option><option [ngValue]="1">Open</option><option [ngValue]="2">Pending</option><option [ngValue]="3">Resolved</option><option [ngValue]="4">Closed</option></select></label></div><footer><button type="button" (click)="show=false">Cancel</button><button class="primary" [disabled]="saving" type="submit">{{saving?'Saving…':(form.id?'Save ticket':'Create ticket')}}</button></footer></form></qai-modal>`})
export class TicketsPage implements OnInit {
  rows:any[]=[];q='';status='';show=false;loading=false;saving=false;error='';form:any={subject:'',description:'',priority:1,status:0};
  constructor(private data:TicketsService){} ngOnInit(){this.load()}
  load(){this.loading=true;this.error='';this.data.list<any[]>().subscribe({next:r=>{this.rows=r||[];this.loading=false},error:e=>{this.error=this.apiError(e);this.loading=false}})}
  get visible(){return this.rows.filter(x=>(!this.q||`${x.number} ${x.subject}`.toLowerCase().includes(this.q.toLowerCase()))&&(!this.status||this.statusLabel(x.status)===this.status))}
  create(){this.form={subject:'',description:'',priority:1,status:0};this.show=true}
  save(){this.saving=true;const request=this.form.id?this.data.update<any>(this.form.id,this.form):this.data.create<any>(this.form);request.subscribe({next:r=>{const i=this.rows.findIndex(x=>x.id===r.id);i>=0?this.rows[i]=r:this.rows.unshift(r);this.show=false;this.saving=false},error:e=>{this.error=this.apiError(e);this.saving=false}})}
  edit(t:any){this.form={...t};this.show=true}
  statusLabel(v:any){return typeof v==='string'?v:['New','Open','Pending','Resolved','Closed'][v]||String(v)}
  priorityLabel(v:any){return typeof v==='string'?v:['Low','Normal','High','Urgent'][v]||String(v)}
  isHigh(t:any){return t.priority===2||t.priority===3||/High|Urgent/i.test(String(t.priority))}
  get openCount(){return this.rows.filter(x=>['New','Open'].includes(this.statusLabel(x.status))).length}
  get pendingCount(){return this.rows.filter(x=>this.statusLabel(x.status)==='Pending').length}
  statusClass(v:any){const status=this.statusLabel(v).toLowerCase();return status==='pending'?'status-pending':status==='resolved'||status==='closed'?'status-success':''}
  sla(t:any){return t.resolutionDueUtc?'Due '+new Date(t.resolutionDueUtc).toLocaleString():'Within SLA'}
  private apiError(e:any){return e?.error?.detail||e?.error?.title||(e?.status?`Tickets API returned ${e.status}.`:'Tickets API is unavailable.')}
}
