import { CommonModule } from '@angular/common';
import { Component,OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CrmService } from './crm.service';
import { Modal,PageHeader } from '../../shared/ui';

@Component({
  standalone:true,
  imports:[CommonModule,FormsModule,Modal,PageHeader],
  template:`
    <qai-page-header title="Leads" subtitle="Automatically qualified demand ranked by intent, fit and buying readiness.">
      <button (click)="runAutomation()">⚡ Run sales automation</button>
      <button class="primary" (click)="openCreate()">+ Create lead</button>
    </qai-page-header>

    <div class="callout warning" *ngIf="error"><span class="callout-icon">!</span><div><b>Leads could not be loaded</b><p>{{error}}</p></div></div>

    <section class="directory-card">
      <header>
        <div><span class="eyebrow">SALES DIRECTORY</span><h2>Qualified lead workspace</h2><p>Review intent, value and qualification state from one structured list.</p></div>
        <div class="directory-summary"><span><b>{{rows.length}}</b>Total</span><span><b>{{count(80,101)}}</b>Hot</span><span><b>{{money(total())}}</b>Value</span></div>
      </header>
      <div class="directory-toolbar">
        <label><span>⌕</span><input [(ngModel)]="q" placeholder="Search intent or source"></label>
        <select [(ngModel)]="temp"><option value="">All temperatures</option><option>Hot</option><option>Warm</option><option>Cold</option></select>
        <strong>{{visible.length}} shown</strong>
      </div>
      <div class="data-state" *ngIf="loading">Loading leads…</div>
      <div class="directory-empty" *ngIf="!loading && !error && !visible.length"><i>◆</i><strong>{{rows.length?'No matching leads':'No leads yet'}}</strong><span>Create a lead from an existing contact or run the acquisition workflow.</span><button class="primary" (click)="openCreate()">Create lead</button></div>
      <div class="table-wrap" *ngIf="!loading && visible.length"><table><thead><tr><th>Lead</th><th>Score</th><th>Source</th><th>Temperature</th><th>Status</th><th>Est. value</th><th>Actions</th></tr></thead>
      <tbody><tr *ngFor="let x of visible">
        <td><div class="directory-identity"><i>{{x.score}}</i><span><b>{{x.intentSummary||'New enquiry'}}</b><small>Qualified demand</small></span></div></td>
        <td><span class="score" [class.hot]="x.score>=80">{{x.score}}</span></td><td>{{x.source||'—'}}</td><td><span class="pill" [class.hot]="x.score>=80">{{temperature(x)}}</span></td>
        <td>{{x.status||'New'}}</td><td><b>{{money(x.estimatedValue||0)}}</b></td>
        <td><div class="directory-actions"><button class="small" (click)="qualify(x)">Qualify</button><button class="small primary" (click)="convert(x)">Create opportunity</button></div></td>
      </tr></tbody></table></div>
    </section>

    <qai-modal [open]="showCreate" title="Create lead" (close)="showCreate=false">
      <form class="form" (ngSubmit)="createLead()">
        <label>Contact
          <select [(ngModel)]="form.contactId" name="contactId" required>
            <option value="" disabled>Select contact</option>
            <option *ngFor="let c of contacts" [value]="c.id">{{contactName(c)}} · {{c.email}}</option>
          </select>
        </label>
        <label>Intent summary<input [(ngModel)]="form.intentSummary" name="intentSummary" required></label>
        <div class="form2">
          <label>Source<input [(ngModel)]="form.source" name="source"></label>
          <label>Score<input type="number" min="0" max="100" [(ngModel)]="form.score" name="score"></label>
        </div>
        <label>Estimated value<input type="number" min="0" [(ngModel)]="form.estimatedValue" name="estimatedValue"></label>
        <footer><button type="button" (click)="showCreate=false">Cancel</button><button class="primary" type="submit">Create lead</button></footer>
      </form>
    </qai-modal>`
})
export class LeadsPage implements OnInit{
  rows:any[]=[]; contacts:any[]=[]; q=''; temp=''; showCreate=false; loading=false; error='';
  form:any={contactId:'',source:'manual',score:50,estimatedValue:0,intentSummary:''};
  constructor(private data:CrmService){}
  ngOnInit(){this.load()}
  load(){this.loading=true;this.error='';this.data.leads().subscribe({next:r=>{this.rows=r||[];this.loading=false},error:e=>{this.error=this.apiError(e);this.loading=false}});this.data.contacts().subscribe({next:r=>this.contacts=r||[],error:e=>this.error=this.apiError(e)})}
  openCreate(){this.form={contactId:this.contacts[0]?.id||'',source:'manual',score:50,estimatedValue:0,intentSummary:''};this.showCreate=true}
  createLead(){if(!this.form.contactId||!this.form.intentSummary.trim())return;this.data.createLead(this.form).subscribe({next:r=>{this.rows.unshift(r);this.showCreate=false},error:()=>alert('Lead creation failed. Check the selected contact and API logs.')})}
  contactName(c:any){return `${c.firstName||''} ${c.lastName||''}`.trim()||c.email||'Contact'}
  get visible(){return this.rows.filter(x=>(!this.q||(x.intentSummary+' '+x.source).toLowerCase().includes(this.q.toLowerCase()))&&(!this.temp||this.temperature(x)===this.temp))}
  count(a:number,b:number){return this.rows.filter(x=>x.score>=a&&x.score<b).length}
  total(){return this.rows.reduce((s,x)=>s+(x.estimatedValue||0),0)}
  temperature(x:any){return x.score>=80?'Hot':x.score>=50?'Warm':'Cold'}
  money(v:number){return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(v)}
  qualify(x:any){this.data.qualify(x.id).subscribe({next:r=>Object.assign(x,r),error:()=>alert('Lead qualification failed.')})}
  convert(x:any){this.data.convert(x.id).subscribe({next:()=>alert('Opportunity created and follow-up automation scheduled.'),error:()=>alert('Could not create opportunity.')})}
  runAutomation(){this.data.runSales().subscribe({next:r=>alert(`Automation complete: ${r.processed||0} leads processed, ${r.opportunitiesCreated||0} opportunities created.`),error:()=>alert('Sales automation run failed.')})}
  private apiError(e:any){return e?.error?.detail||e?.error?.title||(e?.status?`CRM API returned ${e.status}.`:'CRM API is unavailable.')}
}
