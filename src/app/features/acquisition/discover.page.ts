import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { Callout, Modal, PageHeader, WizardSteps } from "../../shared/ui";
import { AcquisitionService } from "./acquisition.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader, WizardSteps, Callout],
  template: `
    <qai-page-header
      title="Prospect Discovery"
      subtitle="Define who you want to sell to, collect market evidence and prioritize companies showing real buying intent."
    >
      <button class="quiet-action" (click)="load()">↻ Refresh data</button>
      <button (click)="openIcp()">+ New ICP</button>
      <button (click)="prospectOpen = true">+ Add prospect</button>
      <button class="primary" [disabled]="!activeIcp || discoveryRunning" (click)="openOnlineDiscovery()">⌕ Find online</button>
      <button class="primary" [disabled]="!activeIcp" (click)="openBulk()">⇧ Import companies</button>
    </qai-page-header>
    <section class="discovery-hero">
      <div class="hero-copy">
        <span class="section-kicker">Acquisition workflow</span>
        <h2>Build an evidence-backed target market</h2>
        <p>Define fit, import verified accounts and move only qualified prospects into controlled outreach.</p>
        <div class="hero-context">
          <span><i></i>{{ activeIcp ? activeIcp.name : 'ICP required' }}</span>
          <span><b>{{ selectedIds.size }}</b> selected</span>
          <span><b>{{ overview.hot || 0 }}</b> high priority</span>
        </div>
      </div>
      <div class="journey-panel">
        <span class="journey-label">Current workflow progress</span>
        <qai-wizard-steps
          [steps]="['Define ICP', 'Verify data', 'Build audience', 'Launch']"
          [descriptions]="['Target market', 'Trusted source', 'Qualified accounts', 'Approval gate']"
          [current]="journeyStep"
        />
      </div>
    </section>

    <section class="discovery-metrics">
      <article class="metric-card blue"><i>◆</i><div><span>Discovered</span><strong>{{ overview.discovered || 0 }}</strong><small>Verified accounts</small></div></article>
      <article class="metric-card rose"><i>↗</i><div><span>Hot prospects</span><strong>{{ overview.hot || 0 }}</strong><small>Fit + buying intent</small></div></article>
      <article class="metric-card violet"><i>◈</i><div><span>Active campaigns</span><strong>{{ overview.activeCampaigns || 0 }}</strong><small>Controlled outreach</small></div></article>
      <article class="metric-card amber"><i>↩</i><div><span>Replies</span><strong>{{ overview.replies || 0 }}</strong><small>Open conversations</small></div></article>
      <article class="metric-card green"><i>✓</i><div><span>Demo ready</span><strong>{{ overview.demoReady || 0 }}</strong><small>Sales handoff</small></div></article>
    </section>

    <div class="notice error-notice" *ngIf="error"><b>!</b><span>{{ error }}</span></div>
    <div class="notice success-notice" *ngIf="message"><b>✓</b><span>{{ message }}</span></div>

    <section class="workspace-grid">
      <article class="workspace-card icp-card">
        <header class="workspace-header">
          <div><span class="section-kicker">QUALIFICATION MODEL</span><h3>Ideal customer profiles</h3><p>Choose the rules used to qualify this audience.</p></div>
          <button class="header-action" (click)="openIcp()">+ New profile</button>
        </header>
        <div class="profile-list" *ngIf="icps.length">
          <label class="profile-option" *ngFor="let x of icps" [class.selected]="selectedIcpId === x.id" [class.paused]="!x.active">
            <input type="radio" name="activeIcp" [value]="x.id" [(ngModel)]="selectedIcpId" [disabled]="!x.active" />
            <span class="profile-mark">{{ x.name.charAt(0) }}</span>
            <span class="profile-copy"><strong>{{ x.name }}</strong><small>{{ x.industry || 'All industries' }} · {{ x.countriesCsv || 'All countries' }}</small><em>{{ x.minimumEmployees || 0 }}–{{ x.maximumEmployees || '∞' }} employees</em></span>
            <span class="profile-state">{{ x.active ? (selectedIcpId === x.id ? 'Selected' : 'Use profile') : 'Paused' }}</span>
          </label>
        </div>
        <div class="empty-state" *ngIf="!icps.length"><i>◎</i><strong>No customer profile yet</strong><span>Create an ICP before importing company data.</span><button (click)="openIcp()">Create first profile</button></div>
      </article>

      <article class="workspace-card audience-card">
        <header class="workspace-header">
          <div><span class="section-kicker">AUDIENCE BUILDER</span><h3>Create target list</h3><p>Turn selected companies into a reusable campaign audience.</p></div>
        </header>
        <div class="selection-summary">
          <span class="selection-count">{{ selectedIds.size }}</span>
          <div><strong>Prospects selected</strong><span>{{ selectedIds.size ? 'Ready to create an audience' : 'Select accounts from the grid below' }}</span></div>
        </div>
        <label class="list-name">Target list name<input [(ngModel)]="listName" placeholder="DACH manufacturers with freight demand" /></label>
        <button class="primary create-list" [disabled]="!selectedIds.size || !listName.trim()" (click)="createList()">Create target list <span>→</span></button>
        <small class="audience-help">Creating a list does not send outreach.</small>
      </article>
    </section>

    <section class="prospect-card">
      <header class="prospect-header">
        <div><span class="section-kicker">MARKET EVIDENCE</span><h3>Prioritized prospects</h3><p>Fit and intent remain separate so account size is never mistaken for buying readiness.</p></div>
        <label class="score-filter"><span>Minimum score</span><input type="number" min="0" max="100" [(ngModel)]="minimumScore" (change)="loadProspects()" /></label>
      </header>
      <div class="prospect-toolbar">
        <span><b>{{ prospects.length }}</b> prospects shown</span>
        <span *ngIf="selectedIds.size"><b>{{ selectedIds.size }}</b> selected for audience</span>
        <button *ngIf="selectedIds.size" (click)="selectedIds.clear()">Clear selection</button>
      </div>
      <div class="prospect-table-wrap" *ngIf="prospects.length">
      <table class="prospect-table">
        <thead>
          <tr>
            <th class="select-column"><input type="checkbox" [checked]="allSelected" [disabled]="!prospects.length" (change)="toggleAll()" /></th>
            <th>Company account</th>
            <th>Decision maker</th>
            <th>Market</th>
            <th class="center">Fit</th>
            <th class="center">Intent</th>
            <th>Priority</th>
            <th>Status</th>
            <th class="action-column">Action</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let x of prospects" [class.selected-row]="selectedIds.has(x.id)">
            <td class="select-column"><input type="checkbox" [checked]="selectedIds.has(x.id)" (change)="toggle(x.id)" /></td>
            <td><div class="company-cell"><span>{{ x.companyName.charAt(0) }}</span><div><b>{{ x.companyName }}</b><small>{{ x.domain }} · {{ x.datasetOrigin || x.source || 'Source not recorded' }}</small></div></div></td>
            <td><b class="cell-title">{{ x.contactName || x.suggestedBuyer || 'Research needed' }}</b><small>{{ x.jobTitle || x.suggestedBuyer || 'Role unknown' }} · {{ x.email || 'Email needed' }}</small></td>
            <td><b class="cell-title">{{ x.industry || 'Unclassified' }}</b><small>{{ x.country || 'Market unknown' }}</small></td>
            <td class="center"><span class="score fit-score">{{ x.fitScore }}</span></td>
            <td class="center"><span class="score intent-score">{{ x.intentScore }}</span></td>
            <td><span class="priority-value" [class.high]="priority(x) >= 70">{{ x.priority || priority(x) }}</span><small *ngIf="x.contactReadiness">{{ x.contactReadiness }}</small></td>
            <td><span class="status-pill">{{ status(x.status) }}</span></td>
            <td class="action-column"><button class="signal-action" (click)="signalFor = x; signalOpen = true">+ Evidence</button></td>
          </tr>
        </tbody>
      </table>
      </div>
      <div class="empty-state prospects-empty" *ngIf="!prospects.length"><i>⌕</i><strong>No prospects match this score</strong><span>Lower the score filter or import a verified company dataset.</span><button class="primary" [disabled]="!activeIcp" (click)="openBulk()">Import companies</button></div>
    </section>

    <qai-modal [open]="onlineDiscoveryOpen" title="Find companies online" (close)="onlineDiscoveryOpen = false">
      <form class="form" (ngSubmit)="runOnlineDiscovery()">
        <qai-callout icon="⌕" title="Company-level public discovery" text="The search connector finds public company websites, scores them against this ICP and creates a review list. It never invents contacts or email addresses." />
        <label>Search provider
          <select name="discoverySource" [(ngModel)]="onlineDiscovery.source">
            <option *ngFor="let provider of discoveryProviders" [value]="provider.name" [disabled]="!provider.configured">{{ provider.name }}{{ provider.configured ? '' : ' — needs API key' }}</option>
          </select>
          <small class="field-help" *ngIf="selectedDiscoveryProvider && !selectedDiscoveryProvider.configured">{{ selectedDiscoveryProvider.description }}</small>
        </label>
        <label>State or region <input name="discoveryRegion" [(ngModel)]="onlineDiscovery.region" placeholder="North Rhine-Westphalia, Bavaria, DACH" /><small class="field-help">Optional. The region becomes an additional market-match signal.</small></label>
        <div class="form2">
          <label>Maximum companies <input type="number" name="discoveryMax" min="1" max="100" [(ngModel)]="onlineDiscovery.maximumResults" /></label>
          <label>Minimum qualification score <input type="number" name="discoveryScore" min="0" max="100" [(ngModel)]="onlineDiscovery.minimumScore" /></label>
        </div>
        <label>Review target list name <input name="discoveryList" [(ngModel)]="onlineDiscovery.targetListName" placeholder="Review — German logistics prospects" /><small class="field-help">Qualified accounts are placed here for human review; no outreach is sent.</small></label>
        <footer><button type="button" (click)="onlineDiscoveryOpen = false">Cancel</button><button class="primary" type="submit" [disabled]="discoveryRunning || !selectedDiscoveryProvider?.configured">{{ discoveryRunning ? 'Searching…' : 'Find and qualify companies' }}</button></footer>
      </form>
    </qai-modal>

    <qai-modal
      [open]="icpOpen"
      title="Create ideal customer profile"
      (close)="icpOpen = false"
      ><form class="form" (ngSubmit)="icpStep === 2 ? saveIcp() : nextIcp()">
        <qai-wizard-steps
          [steps]="['Market', 'Company fit', 'Buying intent']"
          [descriptions]="[
            'Name the segment',
            'Set account limits',
            'Define hot signals',
          ]"
          [current]="icpStep"
        />
        <section *ngIf="icpStep === 0">
          <h4 class="section-title">Which market are you targeting?</h4>
          <p class="section-copy">
            This profile becomes the reusable qualification rule for imports,
            scoring and campaign audiences.
          </p>
          <label
            >Profile name<input
              [(ngModel)]="icp.name"
              name="name"
              required
              placeholder="European logistics growth accounts"
            /><small class="field-help"
              >Use a name your sales team will recognize later.</small
            ></label
          ><label
            >Industries<input
              [(ngModel)]="icp.industry"
              name="industry"
              placeholder="Manufacturing, e-commerce, distribution"
            /><small class="field-help"
              >Comma-separated industries likely to need your offer.</small
            ></label
          ><label
            >Countries<input
              [(ngModel)]="icp.countriesCsv"
              name="countries"
              placeholder="Germany, Italy, France"
            /><small class="field-help"
              >Markets where outreach is intended.</small
            ></label
          >
        </section>
        <section *ngIf="icpStep === 1">
          <h4 class="section-title">What does a good-fit company look like?</h4>
          <p class="section-copy">
            Company size prevents discovery from filling the pipeline with
            accounts you cannot serve.
          </p>
          <div class="form2">
            <label
              >Minimum employees<input
                type="number"
                min="1"
                [(ngModel)]="icp.minimumEmployees"
                name="min"
              /><small class="field-help"
                >Smallest viable customer.</small
              ></label
            ><label
              >Maximum employees<input
                type="number"
                min="1"
                [(ngModel)]="icp.maximumEmployees"
                name="max"
              /><small class="field-help">Largest target account.</small></label
            >
          </div>
          <qai-callout
            icon="i"
            title="Fit is not intent"
            text="Company size and industry decide whether an account fits. Current evidence decides whether it is ready now."
          />
        </section>
        <section *ngIf="icpStep === 2">
          <h4 class="section-title">Which events indicate buying intent?</h4>
          <p class="section-copy">
            Use observable events, not generic buzzwords.
          </p>
          <label
            >Intent signals<input
              [(ngModel)]="icp.intentKeywordsCsv"
              name="keywords"
              placeholder="freight tender, warehouse expansion, delivery delays"
            /><small class="field-help"
              >Examples: new warehouse, logistics hiring, tender announcement,
              service complaints.</small
            ></label
          ><qai-callout
            icon="✓"
            tone="success"
            title="Ready to save"
            [text]="
              icp.name +
              ' will target ' +
              (icp.industry || 'all industries') +
              ' in ' +
              (icp.countriesCsv || 'all markets') +
              '.'
            "
          />
        </section>
        <footer>
          <button
            type="button"
            (click)="icpStep ? (icpStep = icpStep - 1) : (icpOpen = false)"
          >
            {{ icpStep ? "Back" : "Cancel" }}</button
          ><button class="primary" type="submit" [disabled]="!canContinueIcp">
            {{ icpStep === 2 ? "Save profile" : "Continue" }}
          </button>
        </footer>
      </form></qai-modal
    >
    <qai-modal
      [open]="prospectOpen"
      title="Import discovered prospect"
      (close)="prospectOpen = false"
      ><form class="form" (ngSubmit)="saveProspect()">
        <div class="form2">
          <label
            >Company<input
              [(ngModel)]="prospect.companyName"
              name="company"
              required /></label
          ><label
            >Domain<input [(ngModel)]="prospect.domain" name="domain" required
          /></label>
        </div>
        <div class="form2">
          <label
            >Contact name<input
              [(ngModel)]="prospect.contactName"
              name="contact" /></label
          ><label
            >Email<input type="email" [(ngModel)]="prospect.email" name="email"
          /></label>
        </div>
        <div class="form2">
          <label
            >Job title<input
              [(ngModel)]="prospect.jobTitle"
              name="title" /></label
          ><label
            >Industry<input [(ngModel)]="prospect.industry" name="industry"
          /></label>
        </div>
        <div class="form2">
          <label
            >Country<input
              [(ngModel)]="prospect.country"
              name="country" /></label
          ><label
            >Source<input [(ngModel)]="prospect.source" name="source"
          /></label>
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
    <qai-modal
      [open]="bulkOpen"
      [wide]="true"
      title="Import verified companies"
      (close)="bulkOpen = false"
      ><form
        class="form import-form"
        (ngSubmit)="bulkStep === 3 ? importDataset() : nextBulk()"
      >
        <qai-wizard-steps
          [steps]="['Upload', 'Map fields', 'Validate', 'Create audience']"
          [descriptions]="[
            'Choose the source',
            'Match your columns',
            'Review and confirm',
            'Name the resulting list',
          ]"
          [current]="bulkStep"
        />
        <section *ngIf="bulkStep === 0">
          <h4 class="section-title">Upload a company dataset</h4>
          <p class="section-copy">
            Upload a CSV or XLSX from any provider. We detect worksheets,
            headers and likely field mappings before any record is imported.
          </p>
          <label
            >Company data file<input
              type="file"
              accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              (change)="selectDataset($event)"
            /><small class="field-help"
              >CSV or Excel · maximum 10,000 companies or 15 MB.</small
            ></label
          ><label *ngIf="bulkPreview?.sheets?.length > 1"
            >Worksheet<select [(ngModel)]="bulkSheet" name="bulkSheet" (change)="reloadSheet()"><option *ngFor="let sheet of bulkPreview.sheets" [value]="sheet">{{sheet}}</option></select><small class="field-help">The best matching worksheet is selected automatically.</small></label
          ><label
            >Recorded data source<input
              [(ngModel)]="bulkSource"
              name="bulkSource"
              placeholder="Licensed provider, registry export or customer CSV"
              required
            /><small class="field-help"
              >Retained for compliance and audit purposes.</small
            ></label
          >
          <p class="error" *ngIf="bulkError">{{ bulkError }}</p>
        </section>
        <section *ngIf="bulkStep === 1">
          <h4 class="section-title">Map spreadsheet columns</h4>
          <p class="section-copy">{{bulkPreview?.fileName}} · {{bulkPreview?.selectedSheet}} · header row {{bulkPreview?.headerRow}}. Required fields are marked.</p>
          <div class="import-mapping">
            <label *ngFor="let field of importFields">{{field.label}} <b *ngIf="field.required">Required</b><select [(ngModel)]="bulkMapping[field.key]" [name]="'map_'+field.key" (change)="rebuildMappedRows()"><option value="">Do not import</option><option *ngFor="let header of bulkPreview?.headers" [value]="header">{{header}}</option></select></label>
          </div>
          <div class="import-preview" *ngIf="bulkPreview?.sampleRows?.length"><table><thead><tr><th *ngFor="let field of mappedFields">{{field.label}}</th></tr></thead><tbody><tr *ngFor="let row of bulkRows.slice(0,5)"><td *ngFor="let field of mappedFields">{{row[field.key] || '—'}}</td></tr></tbody></table></div>
          <p class="error" *ngIf="bulkError">{{bulkError}}</p>
        </section>
        <section *ngIf="bulkStep === 2">
          <h4 class="section-title">Validate before adding data</h4>
          <p class="section-copy">
            {{ bulkRows.length | number }} valid rows are ready. {{bulkRejected | number}} rows are incomplete and will be skipped. Importing does not send any message.
          </p>
          <qai-callout
            icon="!"
            tone="warning"
            title="Confirm lawful use"
            text="You are responsible for a lawful or licensed source. Every outreach campaign still requires sender verification and approval."
          /><label class="checkline"
            ><input
              type="checkbox"
              [(ngModel)]="bulkConfirmed"
              name="bulkConfirmed"
            />
            I confirm the source can be used for this business purpose.</label
          >
        </section>
        <section *ngIf="bulkStep === 3">
          <h4 class="section-title">Create the first campaign audience</h4>
          <p class="section-copy">
            Imported companies will be connected to the selected ICP and placed
            in a target list.
          </p>
          <label
            >Target list name<input
              [(ngModel)]="bulkListName"
              name="bulkListName"
              placeholder="European logistics prospects – Q3"
              required
            /><small class="field-help"
              >Use a specific market and campaign purpose.</small
            ></label
          ><qai-callout
            icon="✓"
            tone="success"
            title="Ready to import"
            [text]="
              (bulkRows.length | number) +
              ' companies will be added to ' +
              bulkListName +
              '. No email will be sent.'
            "
          />
        </section>
        <footer>
          <button
            type="button"
            (click)="bulkStep ? (bulkStep = bulkStep - 1) : (bulkOpen = false)"
          >
            {{ bulkStep ? "Back" : "Cancel" }}</button
          ><button
            class="primary"
            type="submit"
            [disabled]="bulkImporting || !canContinueBulk"
          >
            {{
              bulkStep === 3
                ? bulkImporting
                  ? "Importing…"
                  : "Import and create list"
                : "Continue"
            }}
          </button>
        </footer>
      </form></qai-modal
    >
    <qai-modal
      [open]="signalOpen"
      title="Add intent evidence"
      (close)="signalOpen = false"
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
        ><label
          >Evidence<textarea
            [(ngModel)]="signal.evidence"
            name="evidence"
          ></textarea></label
        ><label
          >Source URL<input [(ngModel)]="signal.sourceUrl" name="url" /></label
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
  `,
  styleUrl: "./discover.page.css",
})
export class DiscoverPage implements OnInit {
  overview: any = {};
  icps: any[] = [];
  prospects: any[] = [];
  minimumScore = 0;
  selectedIds = new Set<string>();
  listName = "";
  selectedIcpId = "";
  message = "";
  error = "";
  icpOpen = false;
  prospectOpen = false;
  signalOpen = false;
  bulkOpen = false;
  bulkImporting = false;
  bulkSource = "";
  bulkListName = "European logistics prospects";
  bulkConfirmed = false;
  bulkRows: any[] = [];
  bulkPreview: any;
  bulkFile?: File;
  bulkSheet = "";
  bulkMapping: Record<string, string> = {};
  bulkRejected = 0;
  bulkError = "";
  discoveryProviders: any[] = [];
  onlineDiscoveryOpen = false;
  discoveryRunning = false;
  onlineDiscovery: any = {
    source: "serpapi",
    region: "",
    maximumResults: 50,
    minimumScore: 70,
    targetListName: "",
    createTargetList: true,
  };
  icpStep = 0;
  bulkStep = 0;
  signalFor: any;
  icp: any = {
    name: "Logistics growth accounts",
    industry: "Manufacturing, e-commerce, distribution",
    countriesCsv: "Germany, Italy, France",
    minimumEmployees: 20,
    maximumEmployees: 1000,
    intentKeywordsCsv: "freight tender, warehouse expansion, delivery delays",
    criteriaJson: "{}",
    active: true,
  };
  prospect: any = {
    companyName: "",
    domain: "",
    contactName: "",
    email: "",
    jobTitle: "",
    industry: "",
    country: "",
    source: "manual",
    fitScore: 60,
    intentScore: 20,
  };
  signal: any = {
    type: "expansion",
    source: "web-research",
    evidence: "",
    sourceUrl: "",
    score: 15,
  };
  readonly importFields = [
    { key: "companyName", label: "Company name", required: true },
    { key: "domain", label: "Website / domain", required: true },
    { key: "contactName", label: "Contact name", required: false },
    { key: "email", label: "Business email", required: false },
    { key: "jobTitle", label: "Job title", required: false },
    { key: "industry", label: "Industry", required: false },
    { key: "country", label: "Country", required: false },
    { key: "source", label: "Row source", required: false },
    { key: "priority", label: "Priority tier", required: false },
    { key: "contactReadiness", label: "Contact readiness", required: false },
    { key: "suggestedBuyer", label: "Suggested buyer", required: false },
    { key: "sizeBand", label: "Company size band", required: false },
    { key: "painHypothesis", label: "Pain hypothesis", required: false },
    { key: "offer", label: "Recommended offer", required: false },
    { key: "sourceUrl", label: "Evidence source URL", required: false },
    { key: "verificationStatus", label: "Verification status", required: false },
    { key: "outreachStatus", label: "Outreach status", required: false },
    { key: "datasetOrigin", label: "Dataset origin", required: false },
    { key: "fitScore", label: "Fit score", required: false },
    { key: "intentScore", label: "Intent score", required: false },
  ];
  constructor(
    private data: AcquisitionService,
    private router: Router,
  ) {}
  ngOnInit() {
    this.load();
  }
  load() {
    this.data.overview().subscribe((r) => (this.overview = r));
    this.data.discoveryProviders().subscribe({
      next: (r) => (this.discoveryProviders = r),
      error: () => (this.discoveryProviders = []),
    });
    this.data.icps().subscribe((r) => {
      this.icps = r;
      if (!this.activeIcp)
        this.selectedIcpId = r.find((x) => x.active)?.id || "";
    });
    this.loadProspects();
  }
  loadProspects() {
    this.data.prospects(this.minimumScore).subscribe((r) => {
      this.prospects = r;
      this.selectedIds = new Set(
        [...this.selectedIds].filter((id) => r.some((x) => x.id === id)),
      );
    });
  }
  get activeIcp() {
    return this.icps.find((x) => x.id === this.selectedIcpId && x.active);
  }
  get selectedDiscoveryProvider() {
    return this.discoveryProviders.find((x) => x.name === this.onlineDiscovery.source);
  }
  get journeyStep() {
    if (!this.activeIcp) return 0;
    if (!this.prospects.length) return 1;
    if (!this.selectedIds.size) return 2;
    return 3;
  }
  get canContinueIcp() {
    if (this.icpStep === 0)
      return !!this.icp.name?.trim() && !!this.icp.countriesCsv?.trim();
    if (this.icpStep === 1)
      return (
        Number(this.icp.minimumEmployees) > 0 &&
        Number(this.icp.maximumEmployees) >= Number(this.icp.minimumEmployees)
      );
    return !!this.icp.intentKeywordsCsv?.trim();
  }
  get canContinueBulk() {
    if (this.bulkStep === 0)
      return (
        !!this.bulkPreview && !!this.bulkSource.trim() && !this.bulkError
      );
    if (this.bulkStep === 1)
      return !!this.bulkMapping["companyName"] && !!this.bulkMapping["domain"] && !!this.bulkRows.length && !this.bulkError;
    if (this.bulkStep === 2) return this.bulkConfirmed;
    return !!this.bulkListName.trim();
  }
  get mappedFields() { return this.importFields.filter((field) => !!this.bulkMapping[field.key]); }
  openIcp() {
    this.icpStep = 0;
    this.icpOpen = true;
  }
  nextIcp() {
    if (this.canContinueIcp && this.icpStep < 2) this.icpStep++;
  }
  openBulk() {
    this.bulkStep = 0;
    this.bulkError = "";
    this.bulkConfirmed = false;
    this.bulkPreview = undefined;
    this.bulkFile = undefined;
    this.bulkRows = [];
    this.bulkMapping = {};
    this.bulkRejected = 0;
    this.bulkOpen = true;
  }
  openOnlineDiscovery() {
    if (!this.activeIcp) return;
    this.error = "";
    this.message = "";
    this.onlineDiscovery.targetListName = `Review — ${this.activeIcp.name} — ${new Date().toISOString().slice(0, 10)}`;
    this.onlineDiscoveryOpen = true;
  }
  runOnlineDiscovery() {
    if (!this.activeIcp || !this.selectedDiscoveryProvider?.configured) return;
    this.discoveryRunning = true;
    this.error = "";
    this.data.discoverOnline(this.activeIcp.id, this.onlineDiscovery).subscribe({
      next: (result) => {
        this.discoveryRunning = false;
        this.onlineDiscoveryOpen = false;
        this.message = `Online discovery found ${result.received} companies. ${result.qualified} qualified; ${result.created} new and ${result.updated} refreshed. Review list is ready before any outreach.`;
        this.load();
      },
      error: (error) => {
        this.discoveryRunning = false;
        this.error = error?.error?.detail || "Online discovery could not run. Check the provider connection and try again.";
      },
    });
  }
  nextBulk() {
    if (this.bulkStep === 1) this.rebuildMappedRows();
    if (this.canContinueBulk && this.bulkStep < 3) this.bulkStep++;
  }
  get allSelected() {
    return (
      !!this.prospects.length &&
      this.prospects.every((x) => this.selectedIds.has(x.id))
    );
  }
  priority(x: any) {
    return Math.round(
      Number(x.fitScore || 0) * 0.55 + Number(x.intentScore || 0) * 0.45,
    );
  }
  status(v: number) {
    return (
      [
        "Discovered",
        "Enriched",
        "Qualified",
        "Nurturing",
        "Replied",
        "Demo ready",
        "Converted",
        "Suppressed",
      ][v] || v
    );
  }
  toggle(id: string) {
    this.selectedIds.has(id)
      ? this.selectedIds.delete(id)
      : this.selectedIds.add(id);
  }
  toggleAll() {
    this.allSelected
      ? this.selectedIds.clear()
      : this.prospects.forEach((x) => this.selectedIds.add(x.id));
  }
  saveIcp() {
    this.data.createIcp(this.icp).subscribe((r) => {
      this.icps.push(r);
      this.selectedIcpId = r.id;
      this.icpOpen = false;
      this.icpStep = 0;
      this.message =
        "Profile saved. Import verified companies to build its target audience.";
    });
  }
  saveProspect() {
    this.data.addProspect(this.prospect).subscribe((r) => {
      this.prospects.unshift(r);
      this.prospectOpen = false;
      this.data.overview().subscribe((x) => (this.overview = x));
    });
  }
  selectDataset(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.bulkFile = file;
    this.bulkPreview = undefined;
    this.bulkRows = [];
    this.bulkError = "";
    if (!file) return;
    if (file.size > 15_000_000) {
      this.bulkError = "The import file must be smaller than 15 MB.";
      return;
    }
    this.loadPreview();
  }
  reloadSheet() { if (this.bulkFile) this.loadPreview(this.bulkSheet); }
  private loadPreview(sheet = "") {
    if (!this.bulkFile) return;
    this.bulkImporting = true;
    this.bulkError = "";
    this.data.previewProspectImport(this.bulkFile, sheet).subscribe({
      next: (preview) => {
        this.bulkPreview = preview;
        this.bulkSheet = preview.selectedSheet;
        this.bulkMapping = { ...preview.suggestedMappings };
        this.rebuildMappedRows();
        this.bulkImporting = false;
      },
      error: (error) => {
        this.bulkImporting = false;
        this.bulkError = error?.error?.detail || "The company dataset could not be read.";
      },
    });
  }
  rebuildMappedRows() {
    const sourceRows: any[] = this.bulkPreview?.rows || [];
    const mapped = sourceRows.map((source) => {
      const row: any = {};
      for (const field of this.importFields) {
        const header = this.bulkMapping[field.key];
        row[field.key] = header ? source[header] ?? "" : "";
      }
      row.fitScore = Math.max(0, Math.min(100, Number(row.fitScore) || 0));
      row.intentScore = Math.max(0, Math.min(100, Number(row.intentScore) || 0));
      return row;
    });
    this.bulkRows = mapped.filter((row) => String(row.companyName).trim() && String(row.domain).trim());
    this.bulkRejected = mapped.length - this.bulkRows.length;
    this.bulkError = !this.bulkMapping["companyName"] || !this.bulkMapping["domain"] ? "Map both Company name and Website / domain." : "";
  }
  importDataset() {
    if (!this.bulkRows.length || !this.bulkConfirmed) return;
    this.bulkImporting = true;
    this.data
      .importProspects({
        source: this.bulkSource,
        complianceConfirmed: this.bulkConfirmed,
        targetListName: this.bulkListName,
        icpProfileId: this.selectedIcpId || null,
        prospects: this.bulkRows,
      })
      .subscribe({
        next: (result) => {
          this.bulkImporting = false;
          this.bulkOpen = false;
          this.bulkStep = 0;
          this.message = `${result.imported} imported; ${result.updated || 0} enriched; ${result.duplicates} duplicate rows and ${result.rejected + this.bulkRejected} invalid rows skipped.`;
          this.bulkRows = [];
          this.load();
          if (
            result.targetListId &&
            confirm("Target list is ready. Continue to campaign setup?")
          )
            this.router.navigate(["/campaigns"], {
              queryParams: { targetListId: result.targetListId },
            });
        },
        error: (error) => {
          this.bulkImporting = false;
          this.bulkError = error?.error?.detail || "Company import failed.";
        },
      });
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
    this.error = "";
    this.data
      .createTargetList({
        name: this.listName,
        description: "Selected from prospect discovery",
        icpProfileId: this.selectedIcpId || null,
        dynamic: false,
      })
      .subscribe({
        next: (list) =>
          this.data.addMembers(list.id, [...this.selectedIds]).subscribe({
            next: () => {
              this.message = `Target list “${this.listName}” created with ${this.selectedIds.size} prospects.`;
              this.selectedIds.clear();
              this.listName = "";
            },
            error: (e) =>
              (this.error =
                e?.error?.detail ||
                "The list was created, but prospects could not be added."),
          }),
        error: (e) =>
          (this.error =
            e?.error?.detail || "Target list could not be created."),
      });
  }
}
