import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Modal, PageHeader } from '../../shared/ui';
import { AcquisitionService } from './acquisition.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  template: `
    <qai-page-header
      title="Prospect Discovery"
      subtitle="Define who you want to sell to, collect market evidence and prioritize companies showing real buying intent."
    >
      <button (click)="load()">↻ Refresh</button
      ><button (click)="icpOpen = true">+ Ideal customer profile</button
      ><button class="primary" [disabled]="!activeIcp" (click)="bulkOpen = true">
        ⇧ Import verified companies</button
      ><button (click)="prospectOpen = true">+ One prospect</button>
    </qai-page-header>
    <div class="metrics">
      <article>
        <span>Discovered</span><strong>{{ overview.discovered || 0 }}</strong
        ><small>Companies and decision-makers</small>
      </article>
      <article>
        <span>Hot prospects</span><strong>{{ overview.hot || 0 }}</strong
        ><small>High fit and current intent</small>
      </article>
      <article>
        <span>Active campaigns</span><strong>{{ overview.activeCampaigns || 0 }}</strong
        ><small>Running outreach sequences</small>
      </article>
      <article>
        <span>Replies</span><strong>{{ overview.replies || 0 }}</strong
        ><small>Campaign conversations</small>
      </article>
      <article>
        <span>Demo ready</span><strong>{{ overview.demoReady || 0 }}</strong
        ><small>Ready for sales handoff</small>
      </article>
    </div>
    <div class="grid2">
      <section class="panel">
        <header>
          <div><b>Ideal customer profiles</b><span>Discovery and scoring rules</span></div>
        </header>
        <div class="gap" *ngFor="let x of icps">
          <div>
            <b>{{ x.name }}</b
            ><span
              >{{ x.industry || 'All industries' }} · {{ x.countriesCsv || 'All countries' }} ·
              {{ x.minimumEmployees || 0 }}–{{ x.maximumEmployees || '∞' }} employees</span
            >
          </div>
          <label
            ><input
              type="radio"
              name="activeIcp"
              [value]="x.id"
              [(ngModel)]="selectedIcpId"
              [disabled]="!x.active"
            />
            {{ x.active ? 'Use profile' : 'Paused' }}</label
          >
        </div>
        <p *ngIf="!icps.length">Create an ideal customer profile, then import companies from a verified source.</p>
        <p class="error" *ngIf="error">{{ error }}</p>
        <p *ngIf="message">{{ message }}</p>
      </section>
      <section class="panel">
        <header>
          <div><b>Build target list</b><span>Select prospects and prepare a campaign audience</span></div>
        </header>
        <label
          >List name<input [(ngModel)]="listName" placeholder="DACH manufacturers with freight demand"
        /></label>
        <button class="primary" [disabled]="!selectedIds.size || !listName.trim()" (click)="createList()">
          Create list with {{ selectedIds.size }} prospects
        </button>
      </section>
    </div>
    <section class="panel table-wrap">
      <header>
        <div>
          <b>Prioritized prospects</b
          ><span>Fit and intent are scored separately so famous does not mean hot.</span>
        </div>
        <label
          >Minimum score
          <input type="number" min="0" max="100" [(ngModel)]="minimumScore" (change)="loadProspects()"
        /></label>
      </header>
      <table>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                [checked]="allSelected"
                [disabled]="!prospects.length"
                (change)="toggleAll()"
              />
            </th>
            <th>Company</th>
            <th>Decision maker</th>
            <th>Market</th>
            <th>Fit</th>
            <th>Intent</th>
            <th>Priority</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let x of prospects">
            <td><input type="checkbox" [checked]="selectedIds.has(x.id)" (change)="toggle(x.id)" /></td>
            <td>
              <b>{{ x.companyName }}</b
              ><small>{{ x.domain }} · {{ x.source || 'Source not recorded' }}</small>
            </td>
            <td>
              {{ x.contactName || 'Research needed' }}<small>{{ x.jobTitle }} · {{ x.email }}</small>
            </td>
            <td>
              {{ x.industry }}<small>{{ x.country }}</small>
            </td>
            <td>
              <span class="score">{{ x.fitScore }}</span>
            </td>
            <td>
              <span class="score hot">{{ x.intentScore }}</span>
            </td>
            <td>
              <b>{{ priority(x) }}</b>
            </td>
            <td>
              <span class="pill">{{ status(x.status) }}</span>
            </td>
            <td><button class="small" (click)="signalFor = x; signalOpen = true">+ Signal</button></td>
          </tr>
        </tbody>
      </table>
    </section>

    <qai-modal [open]="icpOpen" title="Ideal customer profile" (close)="icpOpen = false"
      ><form class="form" (ngSubmit)="saveIcp()">
        <label>Name<input [(ngModel)]="icp.name" name="name" required /></label
        ><label
          >Industry<input
            [(ngModel)]="icp.industry"
            name="industry"
            placeholder="Manufacturing, e-commerce, distribution" /></label
        ><label>Countries (comma separated)<input [(ngModel)]="icp.countriesCsv" name="countries" /></label>
        <div class="form2">
          <label>Minimum employees<input type="number" [(ngModel)]="icp.minimumEmployees" name="min" /></label
          ><label
            >Maximum employees<input type="number" [(ngModel)]="icp.maximumEmployees" name="max"
          /></label>
        </div>
        <label
          >Intent keywords<input
            [(ngModel)]="icp.intentKeywordsCsv"
            name="keywords"
            placeholder="warehouse expansion, freight tender, delivery delays"
        /></label>
        <footer>
          <button type="button" (click)="icpOpen = false">Cancel</button
          ><button class="primary" type="submit">Save profile</button>
        </footer>
      </form></qai-modal
    >
    <qai-modal [open]="prospectOpen" title="Import discovered prospect" (close)="prospectOpen = false"
      ><form class="form" (ngSubmit)="saveProspect()">
        <div class="form2">
          <label>Company<input [(ngModel)]="prospect.companyName" name="company" required /></label
          ><label>Domain<input [(ngModel)]="prospect.domain" name="domain" required /></label>
        </div>
        <div class="form2">
          <label>Contact name<input [(ngModel)]="prospect.contactName" name="contact" /></label
          ><label>Email<input type="email" [(ngModel)]="prospect.email" name="email" /></label>
        </div>
        <div class="form2">
          <label>Job title<input [(ngModel)]="prospect.jobTitle" name="title" /></label
          ><label>Industry<input [(ngModel)]="prospect.industry" name="industry" /></label>
        </div>
        <div class="form2">
          <label>Country<input [(ngModel)]="prospect.country" name="country" /></label
          ><label>Source<input [(ngModel)]="prospect.source" name="source" /></label>
        </div>
        <div class="form2">
          <label
            >Fit score<input
              type="number"
              min="0"
              max="100"
              [(ngModel)]="prospect.fitScore"
              name="fit" /></label
          ><label
            >Intent score<input
              type="number"
              min="0"
              max="100"
              [(ngModel)]="prospect.intentScore"
              name="intent"
          /></label>
        </div>
        <footer>
          <button type="button" (click)="prospectOpen = false">Cancel</button
          ><button class="primary" type="submit">Add prospect</button>
        </footer>
      </form></qai-modal
    >
    <qai-modal [open]="bulkOpen" title="Import up to 10,000 companies" (close)="bulkOpen = false"
      ><form class="form" (ngSubmit)="importCsv()">
        <p>
          Upload CSV with companyName and domain. Optional columns: contactName, email, jobTitle, industry,
          country, fitScore and intentScore.
        </p>
        <label>CSV file<input type="file" accept=".csv,text/csv" (change)="selectCsv($event)" /></label>
        <label
          >Data source<input
            [(ngModel)]="bulkSource"
            name="bulkSource"
            placeholder="Licensed provider, registry export or customer CSV"
            required
        /></label>
        <label
          >Target list name<input
            [(ngModel)]="bulkListName"
            name="bulkListName"
            placeholder="European logistics prospects – Q3"
            required
        /></label>
        <label
          ><input type="checkbox" [(ngModel)]="bulkConfirmed" name="bulkConfirmed" /> I confirm that the
          company data has a recorded lawful/licensed source. Outreach still requires separate
          approval.</label
        >
        <p *ngIf="bulkRows.length">
          <b>{{ bulkRows.length }}</b> valid rows ready.
        </p>
        <p class="error" *ngIf="bulkError">{{ bulkError }}</p>
        <footer>
          <button type="button" (click)="bulkOpen = false">Cancel</button
          ><button
            class="primary"
            type="submit"
            [disabled]="
              bulkImporting ||
              !bulkRows.length ||
              !bulkConfirmed ||
              !bulkSource.trim() ||
              !bulkListName.trim()
            "
          >
            {{ bulkImporting ? 'Importing…' : 'Import companies' }}
          </button>
        </footer>
      </form></qai-modal
    >
    <qai-modal [open]="signalOpen" title="Add intent evidence" (close)="signalOpen = false"
      ><form class="form" (ngSubmit)="addSignal()">
        <label
          >Signal type<select [(ngModel)]="signal.type" name="type">
            <option>expansion</option>
            <option>hiring</option>
            <option>freight-tender</option>
            <option>delivery-problem</option>
            <option>website-engagement</option>
            <option>campaign-reply</option>
          </select></label
        ><label>Evidence<textarea [(ngModel)]="signal.evidence" name="evidence"></textarea></label
        ><label>Source URL<input [(ngModel)]="signal.sourceUrl" name="url" /></label
        ><label
          >Intent score contribution<input
            type="number"
            min="-100"
            max="100"
            [(ngModel)]="signal.score"
            name="score"
        /></label>
        <footer>
          <button type="button" (click)="signalOpen = false">Cancel</button
          ><button class="primary" type="submit">Add evidence</button>
        </footer>
      </form></qai-modal
    >
  `
})
export class DiscoverPage implements OnInit {
  overview: any = {};
  icps: any[] = [];
  prospects: any[] = [];
  minimumScore = 0;
  selectedIds = new Set<string>();
  listName = '';
  selectedIcpId = '';
  message = '';
  error = '';
  icpOpen = false;
  prospectOpen = false;
  signalOpen = false;
  bulkOpen = false;
  bulkImporting = false;
  bulkSource = '';
  bulkListName = 'European logistics prospects';
  bulkConfirmed = false;
  bulkRows: any[] = [];
  bulkError = '';
  signalFor: any;
  icp: any = {
    name: 'Logistics growth accounts',
    industry: 'Manufacturing, e-commerce, distribution',
    countriesCsv: 'Germany, Italy, France',
    minimumEmployees: 20,
    maximumEmployees: 1000,
    intentKeywordsCsv: 'freight tender, warehouse expansion, delivery delays',
    criteriaJson: '{}',
    active: true
  };
  prospect: any = {
    companyName: '',
    domain: '',
    contactName: '',
    email: '',
    jobTitle: '',
    industry: '',
    country: '',
    source: 'manual',
    fitScore: 60,
    intentScore: 20
  };
  signal: any = { type: 'expansion', source: 'web-research', evidence: '', sourceUrl: '', score: 15 };
  constructor(
    private data: AcquisitionService,
    private router: Router
  ) {}
  ngOnInit() {
    this.load();
  }
  load() {
    this.data.overview().subscribe((r) => (this.overview = r));
    this.data.icps().subscribe((r) => {
      this.icps = r;
      if (!this.activeIcp) this.selectedIcpId = r.find((x) => x.active)?.id || '';
    });
    this.loadProspects();
  }
  loadProspects() {
    this.data.prospects(this.minimumScore).subscribe((r) => {
      this.prospects = r;
      this.selectedIds = new Set([...this.selectedIds].filter((id) => r.some((x) => x.id === id)));
    });
  }
  get activeIcp() {
    return this.icps.find((x) => x.id === this.selectedIcpId && x.active);
  }
  get allSelected() {
    return !!this.prospects.length && this.prospects.every((x) => this.selectedIds.has(x.id));
  }
  priority(x: any) {
    return Math.round(Number(x.fitScore || 0) * 0.55 + Number(x.intentScore || 0) * 0.45);
  }
  status(v: number) {
    return (
      [
        'Discovered',
        'Enriched',
        'Qualified',
        'Nurturing',
        'Replied',
        'Demo ready',
        'Converted',
        'Suppressed'
      ][v] || v
    );
  }
  toggle(id: string) {
    this.selectedIds.has(id) ? this.selectedIds.delete(id) : this.selectedIds.add(id);
  }
  toggleAll() {
    this.allSelected ? this.selectedIds.clear() : this.prospects.forEach((x) => this.selectedIds.add(x.id));
  }
  saveIcp() {
    this.data.createIcp(this.icp).subscribe((r) => {
      this.icps.push(r);
      this.selectedIcpId = r.id;
      this.icpOpen = false;
      this.message = 'Profile saved. Import verified companies to build its target audience.';
    });
  }
  saveProspect() {
    this.data.addProspect(this.prospect).subscribe((r) => {
      this.prospects.unshift(r);
      this.prospectOpen = false;
      this.data.overview().subscribe((x) => (this.overview = x));
    });
  }
  selectCsv(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.bulkRows = [];
    this.bulkError = '';
    if (!file) return;
    if (file.size > 15_000_000) {
      this.bulkError = 'The CSV must be smaller than 15 MB.';
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.bulkRows = this.parseCsv(String(reader.result || ''));
        if (!this.bulkRows.length) this.bulkError = 'No valid company rows were found.';
      } catch (error) {
        this.bulkError = error instanceof Error ? error.message : 'CSV could not be read.';
      }
    };
    reader.readAsText(file);
  }
  importCsv() {
    if (!this.bulkRows.length || !this.bulkConfirmed) return;
    this.bulkImporting = true;
    this.data
      .importProspects({
        source: this.bulkSource,
        complianceConfirmed: this.bulkConfirmed,
        targetListName: this.bulkListName,
        icpProfileId: this.selectedIcpId || null,
        prospects: this.bulkRows
      })
      .subscribe({
        next: (result) => {
          this.bulkImporting = false;
          this.bulkOpen = false;
          this.message = `${result.imported} imported; ${result.duplicates} duplicates and ${result.rejected} invalid rows skipped.`;
          this.bulkRows = [];
          this.load();
          if (result.targetListId && confirm('Target list is ready. Continue to campaign setup?'))
            this.router.navigate(['/campaigns'], { queryParams: { targetListId: result.targetListId } });
        },
        error: (error) => {
          this.bulkImporting = false;
          this.bulkError = error?.error?.detail || 'Company import failed.';
        }
      });
  }
  private parseCsv(text: string) {
    const lines = text
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter((line) => line.trim());
    if (lines.length < 2) throw new Error('CSV requires a header and at least one company.');
    if (lines.length > 10_001) throw new Error('Maximum 10,000 companies per import.');
    const parseLine = (line: string) => {
      const values: string[] = [];
      let value = '';
      let quoted = false;
      for (let index = 0; index < line.length; index++) {
        const character = line[index];
        if (character === '"' && line[index + 1] === '"') {
          value += '"';
          index++;
        } else if (character === '"') quoted = !quoted;
        else if (character === ',' && !quoted) {
          values.push(value.trim());
          value = '';
        } else value += character;
      }
      values.push(value.trim());
      return values;
    };
    const headers = parseLine(lines[0]).map((header) => header.replace(/[ _-]/g, '').toLowerCase());
    const column = (name: string) => headers.indexOf(name.toLowerCase());
    const company = column('companyname');
    const domain = column('domain');
    if (company < 0 || domain < 0) throw new Error('CSV must include companyName and domain columns.');
    const read = (row: string[], name: string) => {
      const index = column(name);
      return index < 0 ? '' : row[index] || '';
    };
    return lines
      .slice(1)
      .map(parseLine)
      .filter((row) => row[company] && row[domain])
      .map((row) => ({
        companyName: row[company],
        domain: row[domain],
        contactName: read(row, 'contactname'),
        email: read(row, 'email'),
        jobTitle: read(row, 'jobtitle'),
        industry: read(row, 'industry'),
        country: read(row, 'country'),
        fitScore: Number(read(row, 'fitscore')) || 0,
        intentScore: Number(read(row, 'intentscore')) || 0
      }));
  }
  addSignal() {
    if (!this.signalFor) return;
    this.data.addSignal(this.signalFor.id, this.signal).subscribe((r) => {
      Object.assign(this.signalFor, r);
      this.signalOpen = false;
    });
  }
  createList() {
    if (!this.selectedIds.size || !this.listName.trim()) return;
    this.error = '';
    this.data
      .createTargetList({
        name: this.listName,
        description: 'Selected from prospect discovery',
        icpProfileId: this.selectedIcpId || null,
        dynamic: false
      })
      .subscribe({
        next: (list) =>
          this.data.addMembers(list.id, [...this.selectedIds]).subscribe({
            next: () => {
              this.message = `Target list “${this.listName}” created with ${this.selectedIds.size} prospects.`;
              this.selectedIds.clear();
              this.listName = '';
            },
            error: (e) =>
              (this.error = e?.error?.detail || 'The list was created, but prospects could not be added.')
          }),
        error: (e) => (this.error = e?.error?.detail || 'Target list could not be created.')
      });
  }
}
