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
      <button (click)="load()">↻ Refresh</button
      ><button (click)="openIcp()">+ Ideal customer profile</button
      ><button class="primary" [disabled]="!activeIcp" (click)="openBulk()">
        ⇧ Import verified companies</button
      ><button (click)="prospectOpen = true">+ One prospect</button>
    </qai-page-header>
    <section class="product-journey">
      <header>
        <div>
          <span class="section-kicker">Acquisition workflow</span>
          <h2>From market definition to a controlled campaign</h2>
          <p>
            Complete each stage in order. QualifyAI keeps the evidence, audience
            and approval trail connected.
          </p>
        </div>
      </header>
      <qai-wizard-steps
        [steps]="[
          'Define ICP',
          'Add verified data',
          'Build audience',
          'Launch campaign',
        ]"
        [descriptions]="[
          'Who should buy',
          'Import with source',
          'Select qualified accounts',
          'Approve before send',
        ]"
        [current]="journeyStep"
      />
    </section>
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
        <span>Active campaigns</span
        ><strong>{{ overview.activeCampaigns || 0 }}</strong
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
          <div>
            <b>Ideal customer profiles</b
            ><span>Discovery and scoring rules</span>
          </div>
        </header>
        <div class="gap" *ngFor="let x of icps">
          <div>
            <b>{{ x.name }}</b
            ><span
              >{{ x.industry || "All industries" }} ·
              {{ x.countriesCsv || "All countries" }} ·
              {{ x.minimumEmployees || 0 }}–{{
                x.maximumEmployees || "∞"
              }}
              employees</span
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
            {{ x.active ? "Use profile" : "Paused" }}</label
          >
        </div>
        <p *ngIf="!icps.length">
          Create an ideal customer profile, then import companies from a
          verified source.
        </p>
        <p class="error" *ngIf="error">{{ error }}</p>
        <p *ngIf="message">{{ message }}</p>
      </section>
      <section class="panel">
        <header>
          <div>
            <b>Build target list</b
            ><span>Select prospects and prepare a campaign audience</span>
          </div>
        </header>
        <label
          >List name<input
            [(ngModel)]="listName"
            placeholder="DACH manufacturers with freight demand"
        /></label>
        <button
          class="primary"
          [disabled]="!selectedIds.size || !listName.trim()"
          (click)="createList()"
        >
          Create list with {{ selectedIds.size }} prospects
        </button>
      </section>
    </div>
    <section class="panel table-wrap">
      <header>
        <div>
          <b>Prioritized prospects</b
          ><span
            >Fit and intent are scored separately so famous does not mean
            hot.</span
          >
        </div>
        <label
          >Minimum score
          <input
            type="number"
            min="0"
            max="100"
            [(ngModel)]="minimumScore"
            (change)="loadProspects()"
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
            <td>
              <input
                type="checkbox"
                [checked]="selectedIds.has(x.id)"
                (change)="toggle(x.id)"
              />
            </td>
            <td>
              <b>{{ x.companyName }}</b
              ><small
                >{{ x.domain }} · {{ x.source || "Source not recorded" }}</small
              >
            </td>
            <td>
              {{ x.contactName || "Research needed"
              }}<small>{{ x.jobTitle }} · {{ x.email }}</small>
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
            <td>
              <button class="small" (click)="signalFor = x; signalOpen = true">
                + Signal
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

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
      title="Import verified companies"
      (close)="bulkOpen = false"
      ><form
        class="form"
        (ngSubmit)="bulkStep === 2 ? importCsv() : nextBulk()"
      >
        <qai-wizard-steps
          [steps]="['Upload', 'Validate', 'Create audience']"
          [descriptions]="[
            'Choose the source',
            'Review and confirm',
            'Name the resulting list',
          ]"
          [current]="bulkStep"
        />
        <section *ngIf="bulkStep === 0">
          <h4 class="section-title">Upload a company dataset</h4>
          <p class="section-copy">
            Required columns: companyName and domain. Optional: contactName,
            email, jobTitle, industry, country, fitScore and intentScore.
          </p>
          <label
            >CSV file<input
              type="file"
              accept=".csv,text/csv"
              (change)="selectCsv($event)"
            /><small class="field-help"
              >Maximum 10,000 companies or 15 MB.</small
            ></label
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
          <h4 class="section-title">Validate before adding data</h4>
          <p class="section-copy">
            We found {{ bulkRows.length | number }} valid company rows.
            Importing does not send any message.
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
        <section *ngIf="bulkStep === 2">
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
              bulkStep === 2
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
  bulkError = "";
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
  constructor(
    private data: AcquisitionService,
    private router: Router,
  ) {}
  ngOnInit() {
    this.load();
  }
  load() {
    this.data.overview().subscribe((r) => (this.overview = r));
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
        !!this.bulkRows.length && !!this.bulkSource.trim() && !this.bulkError
      );
    if (this.bulkStep === 1) return this.bulkConfirmed;
    return !!this.bulkListName.trim();
  }
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
    this.bulkOpen = true;
  }
  nextBulk() {
    if (this.canContinueBulk && this.bulkStep < 2) this.bulkStep++;
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
  selectCsv(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.bulkRows = [];
    this.bulkError = "";
    if (!file) return;
    if (file.size > 15_000_000) {
      this.bulkError = "The CSV must be smaller than 15 MB.";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      try {
        this.bulkRows = this.parseCsv(String(reader.result || ""));
        if (!this.bulkRows.length)
          this.bulkError = "No valid company rows were found.";
      } catch (error) {
        this.bulkError =
          error instanceof Error ? error.message : "CSV could not be read.";
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
        prospects: this.bulkRows,
      })
      .subscribe({
        next: (result) => {
          this.bulkImporting = false;
          this.bulkOpen = false;
          this.bulkStep = 0;
          this.message = `${result.imported} imported; ${result.duplicates} duplicates and ${result.rejected} invalid rows skipped.`;
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
  private parseCsv(text: string) {
    const lines = text
      .replace(/^\uFEFF/, "")
      .split(/\r?\n/)
      .filter((line) => line.trim());
    if (lines.length < 2)
      throw new Error("CSV requires a header and at least one company.");
    if (lines.length > 10_001)
      throw new Error("Maximum 10,000 companies per import.");
    const parseLine = (line: string) => {
      const values: string[] = [];
      let value = "";
      let quoted = false;
      for (let index = 0; index < line.length; index++) {
        const character = line[index];
        if (character === '"' && line[index + 1] === '"') {
          value += '"';
          index++;
        } else if (character === '"') quoted = !quoted;
        else if (character === "," && !quoted) {
          values.push(value.trim());
          value = "";
        } else value += character;
      }
      values.push(value.trim());
      return values;
    };
    const headers = parseLine(lines[0]).map((header) =>
      header.replace(/[ _-]/g, "").toLowerCase(),
    );
    const column = (name: string) => headers.indexOf(name.toLowerCase());
    const company = column("companyname");
    const domain = column("domain");
    if (company < 0 || domain < 0)
      throw new Error("CSV must include companyName and domain columns.");
    const read = (row: string[], name: string) => {
      const index = column(name);
      return index < 0 ? "" : row[index] || "";
    };
    return lines
      .slice(1)
      .map(parseLine)
      .filter((row) => row[company] && row[domain])
      .map((row) => ({
        companyName: row[company],
        domain: row[domain],
        contactName: read(row, "contactname"),
        email: read(row, "email"),
        jobTitle: read(row, "jobtitle"),
        industry: read(row, "industry"),
        country: read(row, "country"),
        fitScore: Number(read(row, "fitscore")) || 0,
        intentScore: Number(read(row, "intentscore")) || 0,
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
