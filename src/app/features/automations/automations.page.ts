import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AutomationRule } from "../../core/models/platform.models";
import { Modal, PageHeader } from "../../shared/ui";
import { AutomationsService } from "./automations.service";
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  template: `<qai-page-header
      title="Automations"
      subtitle="Turn customer and sales signals into automated revenue actions."
      ><button (click)="runAll()">▶ Run sales engine</button
      ><button class="primary" (click)="open()">
        + New automation
      </button></qai-page-header
    >
    <div class="automation-hero">
      <div>
        <span>REVENUE AUTOMATION</span><b>{{ rows.length }} active rules</b
        ><small
          >Hot leads can create pipeline, tasks and attribution
          automatically.</small
        >
      </div>
      <div>
        <b>{{ lastRun }}</b
        ><span>Last execution</span>
      </div>
    </div>
    <section class="automation-list">
      <article *ngFor="let a of rows">
        <div class="auto-icon">⚡</div>
        <div class="auto-main">
          <header>
            <b>{{ a.name }}</b
            ><span class="pill success" *ngIf="a.active">Active</span>
          </header>
          <p>
            <strong>WHEN</strong> {{ a.trigger }} <strong>THEN</strong>
            {{ actions(a) }}
          </p>
          <small>{{ a.conditionsJson }}</small>
        </div>
        <label class="toggle"
          ><input
            type="checkbox"
            [(ngModel)]="a.active"
            (change)="toggle(a)" /><span></span></label
        ><button (click)="run(a)">Run</button
        ><button (click)="open(a)">Edit</button>
      </article>
    </section>
    <section class="panel table-wrap">
      <header><div><b>Execution history</b><span>Real action results and failures</span></div><button (click)="load()">↻ Refresh</button></header>
      <table><thead><tr><th>Started</th><th>Automation</th><th>Status</th><th>Execution log</th><th></th></tr></thead>
      <tbody><tr *ngFor="let run of runs"><td>{{run.createdAtUtc|date:'short'}}</td><td>{{ruleName(run.ruleId)}}</td><td><span class="pill" [class.success]="run.status==='completed'" [class.hot]="run.status==='failed'">{{run.status}}</span></td><td><small>{{runSummary(run)}}</small></td><td><button *ngIf="run.status==='failed'" (click)="retry(run)">Retry</button></td></tr></tbody></table>
      <p *ngIf="!runs.length">No automation has executed yet.</p>
    </section>
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
  show = false;
  lastRun = "Never";
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
  load() {
    this.data.list().subscribe((r) => (this.rows = r));
    this.data.runs().subscribe((r) => {
      this.runs = r;
      if (r.length) this.lastRun = new Date(r[0].createdAtUtc).toLocaleString();
    });
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
}
