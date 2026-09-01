import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Contact } from '../../core/models/platform.models';
import { Modal, PageHeader } from '../../shared/ui';
import { CrmService } from './crm.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  template: `
    <qai-page-header title="Contacts" subtitle="Unified customer profiles across conversations, sales and support.">
      <button class="refresh-action" (click)="load()">↻ Refresh data</button>
      <button class="export-action" (click)="exportCsv()">⇩ Export CSV</button>
      <button class="primary" (click)="open()">+ Add contact</button>
    </qai-page-header>
    <section class="directory-card">
      <header>
        <div><span class="eyebrow">CRM DIRECTORY</span><h2>Contact workspace</h2><p>Search, review and manage every person in the customer lifecycle.</p></div>
        <div class="directory-summary"><span><b>{{ rows.length }}</b>Total</span><span><b>{{ leadCount }}</b>Leads</span><span><b>{{ customerCount }}</b>Customers</span></div>
      </header>
      <div class="directory-toolbar">
        <label><span>⌕</span><input [(ngModel)]="q" placeholder="Search name, email or phone" /></label>
        <select [(ngModel)]="stage"><option value="">All lifecycle stages</option><option>visitor</option><option>lead</option><option>customer</option></select>
        <strong>{{ visible.length }} shown</strong>
      </div>
      <div class="table-wrap contacts-table">
        <table>
          <thead><tr><th>Contact</th><th>Email</th><th>Phone</th><th>Lifecycle</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody><tr *ngFor="let x of visible">
            <td><div class="directory-identity"><i>{{ initials(x) }}</i><span><b>{{ x.firstName }} {{ x.lastName }}</b><small>CRM contact</small></span></div></td>
            <td><a class="email-link" [href]="'mailto:' + x.email">{{ x.email || '—' }}</a></td><td>{{ x.phone || '—' }}</td>
            <td><span class="lifecycle" [class.customer]="x.lifecycleStage === 'customer'" [class.lead]="x.lifecycleStage === 'lead'">{{ x.lifecycleStage || 'visitor' }}</span></td>
            <td>{{ x.createdAtUtc | date: 'mediumDate' }}</td>
            <td><div class="directory-actions"><button (click)="open(x)">✎ Edit</button><button class="danger" (click)="remove(x)">Delete</button></div></td>
          </tr></tbody>
        </table>
        <div class="directory-empty" *ngIf="!visible.length"><i>◎</i><strong>No contacts found</strong><span>Change the filters or add the first contact.</span></div>
      </div>
    </section>
    <qai-modal [open]="show" [title]="form.id ? 'Edit contact' : 'New contact'" (close)="show = false">
      <form class="form" (ngSubmit)="save()">
        <div class="form2"><label>First name<input [(ngModel)]="form.firstName" name="first" required /></label><label>Last name<input [(ngModel)]="form.lastName" name="last" /></label></div>
        <label>Email<input [(ngModel)]="form.email" name="email" type="email" /></label><label>Phone<input [(ngModel)]="form.phone" name="phone" /></label>
        <label>Lifecycle<select [(ngModel)]="form.lifecycleStage" name="stage"><option>visitor</option><option>lead</option><option>customer</option></select></label>
        <footer><button type="button" (click)="show = false">Cancel</button><button class="primary" type="submit">Save contact</button></footer>
      </form>
    </qai-modal>`
})
export class ContactsPage implements OnInit {
  rows: Contact[] = []; q = ''; stage = ''; show = false; form: Partial<Contact> = { lifecycleStage: 'lead' };
  constructor(private readonly crm: CrmService) {}
  ngOnInit(): void { this.load(); }
  load(): void { this.crm.contacts().subscribe((r) => (this.rows = r)); }
  get visible(): Contact[] { const q = this.q.toLowerCase(); return this.rows.filter((x) => (!q || `${x.firstName} ${x.lastName} ${x.email} ${x.phone}`.toLowerCase().includes(q)) && (!this.stage || x.lifecycleStage === this.stage)); }
  get leadCount(): number { return this.rows.filter((x) => x.lifecycleStage === 'lead').length; }
  get customerCount(): number { return this.rows.filter((x) => x.lifecycleStage === 'customer').length; }
  open(x?: Contact): void { this.form = x ? { ...x } : { lifecycleStage: 'lead' }; this.show = true; }
  save(): void { const operation = this.form.id ? this.crm.updateContact(this.form.id, this.form) : this.crm.createContact(this.form); operation.subscribe((result) => { const index = this.rows.findIndex((x) => x.id === result.id); if (index >= 0) this.rows[index] = result; else this.rows.unshift(result); this.show = false; }); }
  remove(x: Contact): void { if (!confirm(`Delete ${x.firstName} ${x.lastName}?`)) return; this.crm.deleteContact(x.id).subscribe(() => (this.rows = this.rows.filter((v) => v.id !== x.id))); }
  initials(x: Contact): string { return ((x.firstName || '?')[0] + (x.lastName || '')[0]).toUpperCase(); }
  exportCsv(): void { const header = 'FirstName,LastName,Email,Phone,Lifecycle\n'; const body = this.visible.map((x) => [x.firstName,x.lastName,x.email,x.phone,x.lifecycleStage].map((v) => `"${String(v ?? '').replaceAll('"','""')}"`).join(',')).join('\n'); const anchor = document.createElement('a'); anchor.href = URL.createObjectURL(new Blob([header + body], { type: 'text/csv' })); anchor.download = 'qualifyai-contacts.csv'; anchor.click(); }
}
