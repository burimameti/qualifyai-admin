import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AutomationRule } from "../../core/models/platform.models";
import { Modal, PageHeader } from "../../shared/ui";
import { AutomationsService } from "./automations.service";
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  styleUrl: "./automations.page.css",
  template: `<qai-page-header
      title="Automations"
      subtitle="Turn customer and sales signals into automated revenue actions."
      ><button (click)="installScenarios()" [disabled]="installing">{{installing?'Installing…':'Install realistic scenarios'}}</button><button (click)="runAll()">▶ Run sales engine</button
      ><button class="primary" (click)="open()">
        + New automation
      </button></qai-page-header
    >
    <section class="directory-card automation-workspace">
      <header>
        <div><span class="eyebrow">Revenue automation</span><h2>Automation rules</h2><p>Review triggers, business actions and execution controls in one workspace.</p></div>
        <div class="directory-summary">
          <span><b>{{ rows.length }}</b>Total</span>
          <span><b>{{ activeCount }}</b>Active</span>
          <span><b>{{ failedCount }}</b>Failed runs</span>
        </div>
      </header>
      <div class="directory-toolbar">
        <label><span>⌕</span><input [(ngModel)]="query" placeholder="Search automation or trigger" /></label>
        <select [(ngModel)]="statusFilter"><option value="">All statuses</option><option value="active">Active</option><option value="paused">Paused</option></select>
        <strong>{{ visibleRows.length }} shown · Last run {{ lastRun }}</strong>
      </div>
      <div class="table-wrap" *ngIf="visibleRows.length; else noAutomations">
        <table><thead><tr><th>Automation</th><th>Trigger</th><th>Business actions</th><th>Status</th><th>Enabled</th><th>Actions</th></tr></thead>
        <tbody><tr *ngFor="let a of visibleRows">
          <td><div class="directory-identity"><i>⚡</i><span><b>{{a.name}}</b><small>{{conditionSummary(a)}}</small></span></div></td>
          <td><span class="event-name">{{a.trigger}}</span></td>
          <td><span class="action-flow">{{actions(a)}}</span></td>
          <td><span class="pill" [class.success]="a.active" [class.status-pending]="!a.active">{{a.active ? 'Active' : 'Paused'}}</span></td>
          <td><label class="toggle" [attr.aria-label]="'Enable ' + a.name"><input type="checkbox" [(ngModel)]="a.active" (change)="toggle(a)" /><span></span></label></td>
          <td><div class="directory-actions"><button (click)="run(a)">▶ Run</button><button (click)="publish(a)">Publish event</button><button class="primary" (click)="open(a)">Edit</button></div></td>
        </tr></tbody></table>
      </div>
      <ng-template #noAutomations><div class="directory-empty"><i>⚡</i><strong>No automation rules found</strong><span>Adjust the filter or create a new automation.</span><button class="primary" (click)="open()">Create automation</button></div></ng-template>
    </section>
    <section class="panel table-wrap">
      <header><div><b>Execution history</b><span>Real action results and failures</span></div><button (click)="load()">↻ Refresh</button></header>
      <table><thead><tr><th>Started</th><th>Automation</th><th>Status</th><th>Execution log</th><th></th></tr></thead>
      <tbody><tr *ngFor="let run of runs"><td>{{run.createdAtUtc|date:'short'}}</td><td>{{ruleName(run.ruleId)}}</td><td><span class="pill" [class.success]="run.status==='completed'" [class.hot]="run.status==='failed'">{{run.status}}</span></td><td><small>{{runSummary(run)}}</small></td><td><button *ngIf="run.status==='failed'" (click)="retry(run)">Retry</button></td></tr></tbody></table>
      <p *ngIf="!runs.length">No automation has executed yet.</p>
    </section>
    <section class="panel table-wrap" *ngIf="deadLetters.length"><header><div><b>Dead-letter queue</b><span>Runs that exhausted automatic retries</span></div></header><table><thead><tr><th>Created</th><th>Entity</th><th>Error</th><th>Status</th></tr></thead><tbody><tr *ngFor="let x of deadLetters"><td>{{x.createdAtUtc|date:'short'}}</td><td>{{x.entityType}}</td><td><small>{{x.error}}</small></td><td><span class="pill hot">{{x.status}}</span></td></tr></tbody></table></section>
    <qai-modal
      [open]="show"
      [title]="form.id ? 'Edit automation' : 'Create revenue automation'"
      (close)="show = false"
      ><form class="form" (ngSubmit)="save()">
        <label>Name<input [(ngModel)]="form.name" name="name" required /></label
        ><label
          >Trigger<select [(ngModel)]="form.trigger" name="trigger">
            <option>lead.score.changed</option>
            <option>lead.qualified</option>
            <option>conversation.sales_intent</option>
            <option>ticket.sla_breach</option>
            <option>meeting.booked</option>
          </select></label
        ><label
          >Conditions JSON<textarea
            [(ngModel)]="form.conditionsJson"
            name="conditions"
          ></textarea></label
        ><label
          >Actions JSON<textarea
            class="large"
            [(ngModel)]="form.actionsJson"
            name="actions"
          ></textarea></label
        ><label class="checkline"
          ><input type="checkbox" [(ngModel)]="form.active" name="active" />
          Active</label
        >
        <footer>
          <button type="button" (click)="show = false">Cancel</button
          ><button class="primary" type="submit">Save automation</button>
        </footer>
      </form></qai-modal
    >`,
})
export class AutomationsPage implements OnInit {
  rows: AutomationRule[] = [];
  runs: any[] = [];
  deadLetters: any[] = [];
  show = false;
  lastRun = "Never";
  installing = false;
  query = "";
  statusFilter = "";
  form: any = {
    name: "Hot lead → pipeline",
    trigger: "lead.qualified",
    conditionsJson: '[{"field":"score","operator":">=","value":80}]',
    actionsJson:
      '[{"type":"createOpportunity"},{"type":"createTask"},{"type":"notifySales"}]',
    active: true,
  };
  constructor(private data: AutomationsService) {}
  ngOnInit() {
    this.load();
  }
  get activeCount() { return this.rows.filter(x => x.active).length; }
  get failedCount() { return this.runs.filter(x => x.status === "failed").length; }
  get visibleRows() {
    const term = this.query.trim().toLowerCase();
    return this.rows.filter(x => {
      const statusMatches = !this.statusFilter || (this.statusFilter === "active" ? x.active : !x.active);
      return statusMatches && (!term || `${x.name} ${x.trigger} ${this.actions(x)}`.toLowerCase().includes(term));
    });
  }
  load() {
    this.data.list().subscribe((r) => (this.rows = r));
    this.data.runs().subscribe((r) => {
      this.runs = r;
      if (r.length) this.lastRun = new Date(r[0].createdAtUtc).toLocaleString();
    });
    this.data.deadLetters().subscribe(r=>this.deadLetters=r);
  }
  open(a?: AutomationRule) {
    this.form = a
      ? { ...a }
      : {
          name: "",
          trigger: "lead.qualified",
          conditionsJson: "[]",
          actionsJson: '[{"type":"notifySales"}]',
          active: true,
        };
    this.show = true;
  }
  actions(a: AutomationRule) {
    try {
      return JSON.parse(a.actionsJson || "[]")
        .map((x: any) => x.type || x.action || x)
        .join(" → ");
    } catch {
      return a.actionsJson;
    }
  }
  conditionSummary(a: AutomationRule) {
    try {
      const conditions = JSON.parse(a.conditionsJson || "[]");
      return conditions.length ? `${conditions.length} execution condition${conditions.length === 1 ? "" : "s"}` : "Runs whenever the event is received";
    } catch {
      return "Custom execution conditions";
    }
  }
  save() {
    try {
      JSON.parse(this.form.conditionsJson || "[]");
      const actions = JSON.parse(this.form.actionsJson || "[]");
      if (!Array.isArray(actions) || actions.length === 0) throw new Error();
    } catch {
      alert("Conditions must be valid JSON and at least one action is required.");
      return;
    }
    const op = this.form.id
      ? this.data.update(this.form.id, this.form)
      : this.data.create(this.form);
    op.subscribe({
      next: (r) => {
        const i = this.rows.findIndex((x) => x.id === r.id);
        i >= 0 ? (this.rows[i] = r) : this.rows.unshift(r);
        this.show = false;
      },
      error: (e) => alert(e?.error?.error || "Automation could not be saved."),
    });
  }
  toggle(a: AutomationRule) {
    this.data.update(a.id, a).subscribe();
  }
  run(a: AutomationRule) {
    this.data.run(a.id).subscribe({next:(r) => {
      this.lastRun = new Date().toLocaleString();
      this.load();
    },error:e=>alert(e?.error?.detail||'Automation execution failed.')});
  }
  retry(run:any){this.data.retry(run.id).subscribe({next:()=>this.load(),error:e=>alert(e?.error?.detail||'Retry failed.')})}
  publish(a:AutomationRule){this.data.publishTrigger(a.id).subscribe({next:r=>alert(`Event ${r.eventId} published to RabbitMQ.`),error:()=>alert('Event could not be published.')})}
  ruleName(id:string){return this.rows.find(x=>x.id===id)?.name||id?.slice(0,8)||'Unknown'}
  runSummary(run:any){try{return JSON.parse(run.logJson||'[]').map((x:any)=>x.message||x).join(' · ')}catch{return run.logJson||'—'}}
  runAll() {
    this.data.runSales().subscribe((r) => {
      this.lastRun = new Date().toLocaleString();
      alert(
        `Processed ${r.processed || 0} leads; ${r.opportunitiesCreated || 0} opportunities; ${r.tasksCreated || 0} tasks; ${r.pipelineCreated || 0} pipeline.`,
      );
    });
  }
  installScenarios(){this.installing=true;this.data.installScenarios().subscribe({next:r=>{this.installing=false;this.load();alert(`${r.scenario} installed in SQL: ${r.prospects} prospects, ${r.campaigns} campaigns, ${r.opportunities} opportunities, ${r.meetings} meetings, ${r.tickets} tickets and ${r.automations} automations.`)},error:e=>{this.installing=false;alert(e?.error?.detail||'Scenarios could not be installed.')}})}
}
