import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AiAgent } from "../../core/models/platform.models";
import { Modal, PageHeader } from "../../shared/ui";
import { AiAgentsService } from "./ai-agents.service";
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  template: `<qai-page-header
      title="Business Assistant Studio"
      subtitle="Configure autonomous support, qualification and revenue actions."
      ><select [(ngModel)]="selectedId" (change)="selectAgent()">
        <option *ngFor="let a of agents" [value]="a.id">
          {{ a.name }}
        </option></select
      ><button (click)="newOpen = true">+ Agent</button
      ><button class="primary" (click)="save()">
        Save configuration
      </button></qai-page-header
    >
    <section class="agent-deployment panel">
      <div><span class="eyebrow">AGENT DEPLOYMENT</span><h2>Where {{agent.name || 'this assistant'}} works</h2><p>An active agent is available to the assistant runtime and sandbox test. It is not automatically connected to Inbox, a campaign or a workflow — that binding must be configured before it can act on customer data.</p></div>
      <ol><li><b [class.success-dot]="agent.active"></b><span><strong>Runtime</strong><small>{{agent.active ? 'Enabled for controlled tests' : 'Paused'}}</small></span></li><li><b class="neutral-dot"></b><span><strong>Live channel</strong><small>Not connected</small></span></li><li><b class="neutral-dot"></b><span><strong>Workflow binding</strong><small>Not connected</small></span></li></ol>
    </section>
    <div class="studio">
      <aside>
        <div class="agent-avatar">✦</div>
        <h3>{{ agent.name || "Revenue Assistant" }}</h3>
        <p>{{ agent.role || "Support & Sales" }}</p>
        <nav>
          <button
            [class.active]="tab === 'behavior'"
            (click)="tab = 'behavior'"
          >
            Behavior</button
          ><button [class.active]="tab === 'tools'" (click)="tab = 'tools'">
            Tools & actions</button
          ><button [class.active]="tab === 'model'" (click)="tab = 'model'">
            Model</button
          ><button
            [class.active]="tab === 'guardrails'"
            (click)="tab = 'guardrails'"
          >
            Guardrails
          </button>
        </nav>
      </aside>
      <section class="panel form" *ngIf="tab === 'behavior'">
        <h3>Agent behavior</h3>
        <div class="form2">
          <label>Name<input [(ngModel)]="agent.name" /></label
          ><label>Role<input [(ngModel)]="agent.role" /></label>
        </div>
        <label
          >Instructions<textarea
            class="large"
            [(ngModel)]="agent.instructions"
          ></textarea>
        </label>
        <div class="form2">
          <label
            >Tone<select [(ngModel)]="agent.tone">
              <option>professional</option>
              <option>friendly</option>
              <option>concise</option>
            </select></label
          ><label>Languages<input [(ngModel)]="agent.languagesCsv" /></label>
        </div>
        <label class="checkline"
          ><input type="checkbox" [(ngModel)]="agent.active" /> Agent
          active</label
        >
      </section>
      <section class="panel" *ngIf="tab === 'tools'">
        <h3>Tools & actions</h3>
        <p>
          Actions available to the workflow runtime after tenant and permission
          checks.
        </p>
        <div class="tools">
          <article *ngFor="let t of tools">
            <i>⚡</i>
            <div>
              <b>{{ t }}</b
              ><span>{{ desc(t) }}</span>
            </div>
            <span class="pill success">Enabled</span>
          </article>
        </div>
      </section>
      <section class="panel form" *ngIf="tab === 'model'">
        <h3>Model routing</h3>
        <label
          >Primary model<select [(ngModel)]="agent.model">
            <option>local</option>
            <option>gpt-5</option>
            <option>azure-openai</option>
          </select></label
        >
        <p class="muted">
          External models require provider credentials in production
          configuration.
        </p>
      </section>
      <section class="panel form" *ngIf="tab === 'guardrails'">
        <h3>Guardrails</h3>
        <label
          >Operational policy<textarea [(ngModel)]="guardrails"></textarea>
        </label>
      </section>
      <aside class="test">
        <header><div><b>Agent test</b><small>Safe sandbox only</small></div><span>Not live</span></header>
        <div class="testmsgs">
          <p class="user" *ngIf="prompt">{{ prompt }}</p>
          <p class="bot" *ngIf="answer">
            <b>{{ agent.name }}</b
            >{{ answer }}
          </p>
        </div>
        <textarea
          [(ngModel)]="prompt"
          placeholder="Test a customer message"
        ></textarea
        ><button class="primary" (click)="runTest()">Run test</button>
      </aside>
    </div>
    <qai-modal [open]="newOpen" title="New business assistant" (close)="newOpen = false"
      ><form class="form" (ngSubmit)="create()">
        <label
          >Name<input [(ngModel)]="newAgent.name" name="name" required /></label
        ><label>Role<input [(ngModel)]="newAgent.role" name="role" /></label>
        <footer>
          <button type="button" (click)="newOpen = false">Cancel</button
          ><button class="primary" type="submit">Create agent</button>
        </footer>
      </form></qai-modal
    >`,
  styles: [`.agent-deployment{align-items:center;background:linear-gradient(105deg,#eff6ff,#f8fafc);border-color:#cfe0ff;display:flex;gap:26px;justify-content:space-between;margin-bottom:16px;padding:18px 20px}.agent-deployment .eyebrow{color:#2563eb;font-size:.66rem;font-weight:800;letter-spacing:.11em}.agent-deployment h2{font-size:1rem;margin:4px 0}.agent-deployment p{color:#526278;font-size:.77rem;line-height:1.45;margin:0;max-width:680px}.agent-deployment ol{display:grid;gap:8px;list-style:none;margin:0;min-width:235px;padding:0}.agent-deployment li{align-items:center;background:#fff;border:1px solid #dbeafe;border-radius:9px;display:flex;gap:8px;padding:7px 9px}.agent-deployment li b{border-radius:50%;display:block;height:8px;width:8px}.success-dot{background:#22c55e}.neutral-dot{background:#94a3b8}.agent-deployment li span{display:flex;flex-direction:column}.agent-deployment li strong{font-size:.72rem}.agent-deployment li small{color:#64748b;font-size:.67rem}.test header div{display:flex;flex-direction:column}.test header small{color:#64748b;font-size:.68rem;margin-top:2px}@media(max-width:900px){.agent-deployment{align-items:stretch;flex-direction:column}.agent-deployment ol{min-width:0;width:100%}}`],
})
export class AiAgentsPage implements OnInit {
  agents: AiAgent[] = [];
  selectedId = "";
  agent: any = {
    name: "Revenue Assistant",
    role: "Support & Sales",
    instructions:
      "Resolve support questions from verified knowledge. Detect buying intent, collect qualification data, score leads and trigger approved revenue actions.",
    tone: "professional",
    languagesCsv: "en,de,it,mk",
    model: "local",
    active: true,
  };
  tab = "behavior";
  prompt = "We need weekly transport of 18 pallets from Stuttgart to Milan.";
  answer = "";
  tools: string[] = [];
  newOpen = false;
  newAgent: any = {
    name: "New Business Assistant",
    role: "Support & Sales",
    tone: "professional",
    model: "local",
    languagesCsv: "en",
    active: true,
    instructions: "Answer from verified knowledge, qualify demand and escalate when confidence is low.",
  };
  guardrails =
    "Never invent pricing. Never expose private customer data. Escalate when confidence is low.";
  constructor(private data: AiAgentsService) {}
  ngOnInit() {
    this.data.list().subscribe((r) => {
      this.agents = r;
      if (r.length) {
        this.selectedId = r[0].id;
        this.selectAgent();
      }
    });
    this.data.tools().subscribe((r) => (this.tools = r));
  }
  selectAgent() {
    const x = this.agents.find((a) => a.id === this.selectedId);
    if (x) this.agent = { ...x };
  }
  save() {
    if (!this.agent.name?.trim() || !this.agent.instructions?.trim()) {
      alert("Agent name and instructions are required.");
      return;
    }
    const op = this.agent.id
      ? this.data.update(this.agent.id, this.agent)
      : this.data.create(this.agent);
    op.subscribe((r) => {
      this.agent = r;
      const i = this.agents.findIndex((a) => a.id === r.id);
      i >= 0 ? (this.agents[i] = r) : this.agents.push(r);
      alert("Agent configuration saved. It is available for sandbox tests; connect a channel or workflow before using it with customers.");
    });
  }
  create() {
    if (!this.newAgent.name?.trim() || !this.newAgent.instructions?.trim()) {
      alert("Agent name and instructions are required.");
      return;
    }
    this.data.create(this.newAgent).subscribe({
      next: (r) => {
        this.agents.push(r);
        this.selectedId = r.id;
        this.agent = { ...r };
        this.newOpen = false;
      },
      error: (e) => alert(e?.error?.error || "Business assistant could not be created."),
    });
  }
  runTest() {
    if (!this.prompt.trim() || !this.agent.id) return;
    this.answer = "Thinking…";
    this.data
      .test(this.agent.id, this.prompt)
      .subscribe({
        next: (r) => (this.answer = r.message || "No response"),
        error: () =>
          (this.answer =
            "Agent test failed. Check API/provider configuration."),
      });
  }
  desc(t: string) {
    const d: any = {
      SearchKnowledge: "Retrieve grounded answers",
      CreateLead: "Capture sales demand",
      CreateTicket: "Open a support case",
      CreateOpportunity: "Create pipeline revenue",
      BookMeeting: "Schedule a sales call",
      CallWebhook: "Execute external workflow",
    };
    return d[t] || "Business action";
  }
}
