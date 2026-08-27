import { CommonModule } from '@angular/common';
import { Component,OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Contact } from '../../core/models/platform.models';
import { Modal,PageHeader } from '../../shared/ui';
import { CrmService } from './crm.service';
@Component({standalone:true,imports:[CommonModule,FormsModule,Modal,PageHeader],template:`
<qai-page-header title="Contacts" subtitle="Unified customer profiles across conversations, sales and support.">
  <button (click)="exportCsv()">Export CSV</button><button class="primary" (click)="open()">+ Add contact</button>
</qai-page-header>
<div class="toolbar"><input [(ngModel)]="q" placeholder="Search name, email, phone"><select [(ngModel)]="stage"><option value="">All lifecycle stages</option><option>visitor</option><option>lead</option><option>customer</option></select></div>
<section class="panel table-wrap"><table><thead><tr><th>Contact</th><th>Email</th><th>Phone</th><th>Lifecycle</th><th>Created</th><th>Actions</th></tr></thead><tbody>
<tr *ngFor="let x of visible"><td><div class="person"><i>{{initials(x)}}</i><b>{{x.firstName}} {{x.lastName}}</b></div></td><td>{{x.email}}</td><td>{{x.phone||'—'}}</td><td><span class="pill">{{x.lifecycleStage}}</span></td><td>{{x.createdAtUtc|date:'mediumDate'}}</td><td><button class="small" (click)="open(x)">Edit</button><button class="small danger" (click)="remove(x)">Delete</button></td></tr>
</tbody></table></section>
<qai-modal [open]="show" [title]="form.id?'Edit contact':'New contact'" (close)="show=false"><form class="form" (ngSubmit)="save()"><div class="form2"><label>First name<input [(ngModel)]="form.firstName" name="first" required></label><label>Last name<input [(ngModel)]="form.lastName" name="last"></label></div><label>Email<input [(ngModel)]="form.email" name="email" type="email"></label><label>Phone<input [(ngModel)]="form.phone" name="phone"></label><label>Lifecycle<select [(ngModel)]="form.lifecycleStage" name="stage"><option>visitor</option><option>lead</option><option>customer</option></select></label><footer><button type="button" (click)="show=false">Cancel</button><button class="primary" type="submit">Save contact</button></footer></form></qai-modal>`})
export class ContactsPage implements OnInit{
 rows:Contact[]=[];q='';stage='';show=false;form:Partial<Contact>={lifecycleStage:'lead'};
 constructor(private crm:CrmService){} ngOnInit(){this.load()} load(){this.crm.contacts().subscribe(r=>this.rows=r)}
 get visible(){const q=this.q.toLowerCase();return this.rows.filter(x=>(!q||`${x.firstName} ${x.lastName} ${x.email} ${x.phone}`.toLowerCase().includes(q))&&(!this.stage||x.lifecycleStage===this.stage))}
 open(x?:Contact){this.form=x?{...x}:{lifecycleStage:'lead'};this.show=true}
 save(){const op=this.form.id?this.crm.updateContact(this.form.id,this.form):this.crm.createContact(this.form);op.subscribe(r=>{const i=this.rows.findIndex(x=>x.id===r.id);if(i>=0)this.rows[i]=r;else this.rows.unshift(r);this.show=false})}
 remove(x:Contact){if(!confirm(`Delete ${x.firstName} ${x.lastName}?`))return;this.crm.deleteContact(x.id).subscribe(()=>this.rows=this.rows.filter(v=>v.id!==x.id))}
 initials(x:Contact){return ((x.firstName||'?')[0]+(x.lastName||'')[0]).toUpperCase()}
 exportCsv(){const h='FirstName,LastName,Email,Phone,Lifecycle\n';const b=this.visible.map(x=>[x.firstName,x.lastName,x.email,x.phone,x.lifecycleStage].map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([h+b],{type:'text/csv'}));a.download='qualifyai-contacts.csv';a.click()}
}
