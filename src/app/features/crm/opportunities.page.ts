import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Opportunity } from "../../core/models/platform.models";
import { Modal, PageHeader } from "../../shared/ui";
import { CrmService } from "./crm.service";

interface SalesPipeline { id: string; name: string; isDefault: boolean; }
interface PipelineStage { id: string; pipelineId: string; name: string; sortOrder: number; probability: number; }
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  styleUrl: "./opportunities.page.css",
  template: `<qai-page-header
      title="Opportunities"
      subtitle="See exactly how qualified demand becomes a deal, then place it in the right sales process."
      ><button (click)="load()">↻ Refresh</button
      ><button class="primary" (click)="open()">
        + Opportunity
      </button></qai-page-header
    >
    <div class="callout warning" *ngIf="error">
      <span class="callout-icon">!</span>
      <div>
        <b>Opportunities could not be loaded</b>
        <p>{{ error }}</p>
      </div>
    </div>
    <section class="panel conversion-guide">
      <div><span class="eyebrow">CONVERSION PATH</span><h2>From prospect to revenue</h2><p>Prospects enter campaigns. A qualified lead or interested reply creates an opportunity. Every opportunity must be assigned to a pipeline stage to appear on its board.</p></div>
      <ol><li><b>1</b>Prospect & campaign</li><li><b>2</b>Qualified lead / reply</li><li><b>3</b>Opportunity</li><li><b>4</b>Pipeline stage</li><li><b>5</b>Won or lost</li></ol>
    </section>
    <div class="metrics compact">
      <article>
        <span>Open value</span><strong>{{ money(openValue) }}</strong>
      </article>
      <article>
        <span>Won</span><strong>{{ money(wonValue) }}</strong>
      </article>
      <article>
        <span>Open deals</span><strong>{{ openCount }}</strong>
      </article>
    </div>
    <section class="panel table-wrap">
      <div class="data-state" *ngIf="loading">Loading opportunities…</div>
      <div class="data-state" *ngIf="!loading && !error && !rows.length">
        <b>No opportunities yet</b
        ><span>Convert a qualified lead or add an opportunity manually.</span
        ><button class="primary" (click)="open()">Create opportunity</button>
      </div>
      <table *ngIf="!loading && rows.length">
        <thead>
          <tr>
            <th>Opportunity</th>
            <th>Value</th>
            <th>Sales process</th>
            <th>Status</th>
            <th>Expected close</th>
            <th>Automation influence</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let x of rows">
            <td>
              <b>{{ x.name }}</b>
            </td>
            <td>{{ money(x.amount) }}</td>
            <td><span class="stage-assignment" [class.unassigned]="!x.pipelineStageId">{{ stageLabel(x) }}</span></td>
            <td><span class="pill">{{ status(x.status) }}</span></td>
            <td>{{ x.expectedCloseUtc | date: "mediumDate" }}</td>
            <td><span [class.positive]="!!x.leadId">{{ x.leadId ? 'Qualified lead / campaign' : 'Manual opportunity' }}</span></td>
            <td><button class="small" (click)="open(x)">Edit</button></td>
          </tr>
        </tbody>
      </table>
    </section>
    <qai-modal
      [open]="show"
      [title]="form.id ? 'Edit opportunity' : 'New opportunity'"
      (close)="show = false"
      ><form class="form" (ngSubmit)="save()">
        <label
          >Name<input [(ngModel)]="form.name" name="name" required
        /></label>
        <div class="form2">
          <label
            >Amount<input
              type="number"
              [(ngModel)]="form.amount"
              name="amount" /></label
          ><label
            >Status<select [(ngModel)]="form.status" name="status">
              <option [ngValue]="0">Open</option>
              <option [ngValue]="1">Won</option>
              <option [ngValue]="2">Lost</option>
            </select></label
          >
        </div>
        <div class="form2">
          <label>Sales pipeline<select [(ngModel)]="formPipelineId" name="pipeline" (ngModelChange)="choosePipeline($event)"><option value="">Assign later</option><option *ngFor="let pipeline of pipelines" [value]="pipeline.id">{{pipeline.name}}{{pipeline.isDefault ? ' · Default' : ''}}</option></select></label>
          <label>Pipeline stage<select [(ngModel)]="form.pipelineStageId" name="stage" [disabled]="!formPipelineId"><option [ngValue]="undefined">Choose stage</option><option *ngFor="let stage of formStages" [value]="stage.id">{{stage.name}} · {{stage.probability}}%</option></select><small *ngIf="!pipelines.length">Create a pipeline first, then assign this deal.</small></label>
        </div>
        <p class="form-note" *ngIf="!form.pipelineStageId">This opportunity will remain unassigned until you choose a pipeline stage. It will not appear on any board.</p>
        <label
          >Expected close<input
            type="date"
            [(ngModel)]="closeDate"
            name="close"
        /></label>
        <footer>
          <button type="button" (click)="show = false">Cancel</button
          ><button class="primary" type="submit">Save opportunity</button>
        </footer>
      </form></qai-modal
    >`,
})
export class OpportunitiesPage implements OnInit {
  rows: Opportunity[] = [];
  pipelines: SalesPipeline[] = [];
  stages: PipelineStage[] = [];
  show = false;
  loading = false;
  error = "";
  form: any = { status: 0, amount: 0 };
  closeDate = "";
  formPipelineId = "";
  constructor(private crm: CrmService) {}
  ngOnInit() {
    this.load();
  }
  load() {
    this.loading = true;
    this.error = "";
    this.crm.opportunities().subscribe({
      next: (r) => {
        this.rows = r || [];
        this.loading = false;
      },
      error: (e) => {
        this.error = this.apiError(e);
        this.loading = false;
      },
    });
    this.crm.salesPipelines().subscribe({
      next: (r) => { this.pipelines = r?.pipelines || []; this.stages = r?.stages || []; },
      error: (e) => { if (!this.error) this.error = this.apiError(e); },
    });
  }
  get openValue() {
    return this.rows
      .filter((x) => this.status(x.status) === "Open")
      .reduce((s, x) => s + (x.amount || 0), 0);
  }
  get wonValue() {
    return this.rows
      .filter((x) => this.status(x.status) === "Won")
      .reduce((s, x) => s + (x.amount || 0), 0);
  }
  get openCount() {
    return this.rows.filter((x) => this.status(x.status) === "Open").length;
  }
  open(x?: Opportunity) {
    this.form = x ? { ...x } : { status: 0, amount: 0 };
    this.formPipelineId = x?.pipelineStageId ? this.stage(x.pipelineStageId)?.pipelineId || "" : this.defaultPipeline?.id || "";
    if (!x && this.formPipelineId) this.form.pipelineStageId = this.formStages[0]?.id;
    this.closeDate = x?.expectedCloseUtc
      ? String(x.expectedCloseUtc).slice(0, 10)
      : "";
    this.show = true;
  }
  save() {
    this.form.expectedCloseUtc = this.closeDate
      ? new Date(this.closeDate).toISOString()
      : null;
    const desired = this.status(this.form.status);
    const op = this.form.id
      ? this.crm.updateOpportunity(this.form.id, this.form)
      : this.crm.createOpportunity(this.form);
    op.subscribe({
      next: (r) => this.applyStatus(r, desired),
      error: (e) => (this.error = this.apiError(e)),
    });
  }
  get defaultPipeline() { return this.pipelines.find(x => x.isDefault) || this.pipelines[0]; }
  get formStages() { return this.stages.filter(x => x.pipelineId === this.formPipelineId).sort((a,b) => a.sortOrder - b.sortOrder); }
  choosePipeline(id: string) { this.formPipelineId = id; this.form.pipelineStageId = this.formStages[0]?.id; }
  stage(id?: string) { return this.stages.find(x => x.id === id); }
  stageLabel(x: Opportunity) { const stage = this.stage(x.pipelineStageId); return stage ? `${this.pipelines.find(p => p.id === stage.pipelineId)?.name || 'Pipeline'} · ${stage.name}` : 'Unassigned'; }
  private applyStatus(r: Opportunity, desired: string) {
    const finish = (saved: Opportunity) => {
      const i = this.rows.findIndex((x) => x.id === saved.id);
      i >= 0 ? (this.rows[i] = saved) : this.rows.unshift(saved);
      this.show = false;
    };
    if (desired === this.status(r.status)) {
      finish(r);
      return;
    }
    if (desired === "Open") {
      this.crm
        .reopenOpportunity(r.id)
        .subscribe({
          next: finish,
          error: (e) => (this.error = this.apiError(e)),
        });
      return;
    }
    const lossReason =
      desired === "Lost"
        ? prompt("Why was this opportunity lost?") || "Not specified"
        : "";
    this.crm
      .closeOpportunity(r.id, desired === "Won", lossReason)
      .subscribe({
        next: finish,
        error: (e) => (this.error = this.apiError(e)),
      });
  }
  money(v: number) {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(v || 0);
  }
  status(v: any) {
    return typeof v === "string" ? v : ["Open", "Won", "Lost"][v] || String(v);
  }
  private apiError(e: any) {
    return (
      e?.error?.detail ||
      e?.error?.title ||
      (e?.status ? `CRM API returned ${e.status}.` : "CRM API is unavailable.")
    );
  }
}
