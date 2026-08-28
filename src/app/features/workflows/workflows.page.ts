import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Modal, PageHeader } from "../../shared/ui";
import { WorkflowsService } from "./workflows.service";
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  template: `<qai-page-header
      title="Qualification Workflows"
      subtitle="Design how QualifyAI asks, branches, scores and executes revenue actions."
      ><select [(ngModel)]="activeId" (change)="loadDesigner()">
        <option *ngFor="let f of flows" [value]="f.id">
          {{ f.name }}
        </option></select
      ><button (click)="newOpen = true">+ Workflow</button
      ><button class="primary" (click)="save()">
        Save workflow
      </button></qai-page-header
    >
    <div class="workflow">
      <aside>
        <b>NODE LIBRARY</b
        ><button *ngFor="let n of library" (click)="add(n.type)">
          <span>{{ n.icon }}</span
          >{{ n.label }}
        </button>
        <hr />
        <b>LOGISTICS STARTERS</b>
        <button *ngFor="let starter of starters" (click)="installStarter(starter)">
          <span>▦</span>{{ starter.name }}
        </button>
        <hr />
        <button (click)="connectSelected()" [disabled]="!selected">
          Connect selected → last node
        </button>
      </aside>
      <section class="canvas">
        <div
          class="node"
          *ngFor="let n of nodes"
          [style.left.px]="n.x"
          [style.top.px]="n.y"
          (click)="selected = n"
        >
          <small>{{ n.type | uppercase }}</small
          ><b>{{ nodeTitle(n) }}</b
          ><span>{{ nodeText(n) }}</span
          ><i></i>
        </div>
        <svg>
          <line
            *ngFor="let e of edges; let i = index"
            [attr.x1]="edgePoint(e, true, 'x')"
            [attr.y1]="edgePoint(e, true, 'y')"
            [attr.x2]="edgePoint(e, false, 'x')"
            [attr.y2]="edgePoint(e, false, 'y')"
            stroke="#94a3b8"
            stroke-width="2"
          />
        </svg>
      </section>
      <aside class="inspector" *ngIf="selected">
        <h3>Node settings</h3>
        <label>Type<input [(ngModel)]="selected.type" /></label
        ><label
          >Configuration<textarea [(ngModel)]="selected.configJson"></textarea>
        </label>
        <div class="form2">
          <label>X<input type="number" [(ngModel)]="selected.x" /></label
          ><label>Y<input type="number" [(ngModel)]="selected.y" /></label>
        </div>
        <button class="danger" (click)="remove(selected)">Delete node</button>
      </aside>
    </div>
    <qai-modal
      [open]="newOpen"
      title="New qualification workflow"
      (close)="newOpen = false"
      ><form class="form" (ngSubmit)="createFlow()">
        <label>Name<input [(ngModel)]="newName" name="name" required /></label>
        <footer>
          <button type="button" (click)="newOpen = false">Cancel</button
          ><button class="primary" type="submit">Create</button>
        </footer>
      </form></qai-modal
    >`,
})
export class WorkflowsPage implements OnInit {
  flows: any[] = [];
  activeId = "";
  nodes: any[] = [];
  edges: any[] = [];
  selected: any;
  newOpen = false;
  newName = "";
  library = [
    { type: "question", label: "Question", icon: "?" },
    { type: "condition", label: "Condition", icon: "◇" },
    { type: "score", label: "Lead score", icon: "+" },
    { type: "action", label: "Action", icon: "⚡" },
    { type: "meeting", label: "Book meeting", icon: "◷" },
    { type: "handoff", label: "Human handoff", icon: "↗" },
  ];
  starters = [
    {
      name: "Freight RFQ → sales",
      nodes: [
        ["start", "Inbound freight request", { event: "inquiry.received", channel: "web,email" }],
        ["question", "Capture shipment details", { question: "Collect origin, destination, cargo, weight, frequency and target pickup date" }],
        ["condition", "Check commercial fit", { condition: "Supported lane, valid cargo and pickup within 30 days" }],
        ["score", "Prioritize opportunity", { action: "Score by recurring volume, margin band, urgency and company fit" }],
        ["action", "Create quote opportunity", { action: "Create CRM opportunity and pricing task with shipment context" }],
        ["handoff", "Assign sales owner", { action: "Route high-value RFQ to the lane owner and notify sales" }],
      ]
    },
    {
      name: "Shipment delay response",
      nodes: [
        ["start", "Delay event received", { event: "shipment.delay.detected" }],
        ["condition", "Assess customer impact", { condition: "Delay exceeds SLA or affects a priority account" }],
        ["action", "Notify customer", { action: "Send status, revised ETA and recovery options" }],
        ["action", "Create operations ticket", { action: "Open an exception ticket with shipment and carrier data" }],
        ["handoff", "Escalate exception", { action: "Assign severe cases to operations management" }],
      ]
    },
    {
      name: "Dormant customer reactivation",
      nodes: [
        ["start", "Account inactivity", { event: "customer.no_booking_60_days" }],
        ["condition", "Check account value", { condition: "Previous revenue and lane activity exceed threshold" }],
        ["action", "Prepare account brief", { action: "Summarize previous lanes, volume, rates and service issues" }],
        ["action", "Create sales follow-up", { action: "Create owner task with a tailored reactivation offer" }],
        ["meeting", "Schedule account review", { action: "Offer available meeting times to the customer" }],
      ]
    }
  ];
  constructor(private data: WorkflowsService) {}
  ngOnInit() {
    this.load();
  }
  load() {
    this.data.list().subscribe((r) => {
      this.flows = r;
      if (r.length && !this.activeId) {
        this.activeId = r[0].id;
        this.loadDesigner();
      }
    });
  }
  createFlow() {
    this.data.create({ name: this.newName, active: true }).subscribe((r) => {
      this.flows.push(r);
      this.activeId = r.id;
      this.nodes = [{
        id: crypto.randomUUID(),
        flowId: r.id,
        nodeKey: "start",
        type: "start",
        configJson: "{}",
        x: 180,
        y: 120,
      }];
      this.edges = [];
      this.newName = "";
      this.newOpen = false;
    });
  }
  installStarter(starter: any) {
    this.data.create({ name: starter.name, active: true }).subscribe({
      next: (flow) => {
        const nodes = starter.nodes.map((definition: any[], index: number) => ({
          id: crypto.randomUUID(),
          flowId: flow.id,
          nodeKey: index === 0 ? "start" : `step_${index}`,
          type: definition[0],
          configJson: JSON.stringify({ title: definition[1], ...definition[2] }),
          x: 100 + (index % 3) * 260,
          y: 90 + Math.floor(index / 3) * 180,
        }));
        const edges = nodes.slice(1).map((node: any, index: number) => ({
          id: crypto.randomUUID(),
          flowId: flow.id,
          fromNodeKey: nodes[index].nodeKey,
          toNodeKey: node.nodeKey,
          conditionJson: "{}",
        }));
        this.data.saveDesigner(flow.id, { nodes, edges }).subscribe({
          next: () => {
            this.flows.push(flow);
            this.activeId = flow.id;
            this.nodes = nodes;
            this.edges = edges;
            this.selected = nodes[0];
          },
          error: () => alert("The workflow was created, but its steps could not be saved."),
        });
      },
      error: () => alert("The workflow starter could not be installed."),
    });
  }
  loadDesigner() {
    if (!this.activeId) return;
    this.data.designer(this.activeId).subscribe((r) => {
      this.nodes = r.nodes || [];
      this.edges = r.edges || [];
    });
  }
  add(type: string) {
    const n = {
      id: crypto.randomUUID(),
      flowId: this.activeId,
      nodeKey: "node_" + Date.now(),
      type,
      configJson: "{}",
      x: 180 + (this.nodes.length % 4) * 220,
      y: 100 + Math.floor(this.nodes.length / 4) * 150,
    };
    this.nodes.push(n);
    this.selected = n;
  }
  remove(n: any) {
    this.nodes = this.nodes.filter((x) => x !== n);
    this.edges = this.edges.filter(
      (e) => e.fromNodeKey !== n.nodeKey && e.toNodeKey !== n.nodeKey,
    );
    this.selected = null;
  }
  connectSelected() {
    if (!this.selected || this.nodes.length < 2) return;
    let target: any = null;
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      if (this.nodes[i] !== this.selected) {
        target = this.nodes[i];
        break;
      }
    }
    if (!target) return;
    if (this.edges.some((edge) => edge.fromNodeKey === this.selected.nodeKey && edge.toNodeKey === target.nodeKey)) {
      alert("These nodes are already connected.");
      return;
    }
    this.edges.push({
      id: crypto.randomUUID(),
      flowId: this.activeId,
      fromNodeKey: this.selected.nodeKey,
      toNodeKey: target.nodeKey,
      conditionJson: "{}",
    });
  }
  save() {
    if (!this.activeId) return;
    if (!this.nodes.length) {
      alert("A workflow requires at least one node.");
      return;
    }
    const keys = new Set(this.nodes.map((node) => String(node.nodeKey).trim().toLowerCase()));
    if (keys.size !== this.nodes.length || keys.has("")) {
      alert("Every node requires a unique key.");
      return;
    }
    try {
      this.nodes.forEach((node) => JSON.parse(node.configJson || "{}"));
      this.edges.forEach((edge) => JSON.parse(edge.conditionJson || "{}"));
    } catch {
      alert("Node configuration and edge conditions must be valid JSON.");
      return;
    }
    this.data
      .saveDesigner(this.activeId, { nodes: this.nodes, edges: this.edges })
      .subscribe({
        next: () => {
          alert("Workflow saved.");
          this.loadDesigner();
        },
        error: (e) => alert(e?.error?.error || "Workflow could not be saved."),
      });
  }
  nodeTitle(n: any) {
    return (
      (
        {
          question: "Qualification question",
          condition: "Branch condition",
          score: "Adjust lead score",
          action: "Execute business action",
          meeting: "Book sales meeting",
          handoff: "Assign human agent",
        } as any
      )[n.type] || n.type
    );
  }
  nodeText(n: any) {
    try {
      const c = JSON.parse(n.configJson || "{}");
      return c.title || c.question || c.action || c.condition || "Configure this node";
    } catch {
      return "Configure this node";
    }
  }
  edgePoint(e: any, from: boolean, axis: "x" | "y") {
    const n = this.nodes.find(
      (x) => x.nodeKey === (from ? e.fromNodeKey : e.toNodeKey),
    );
    return axis === "x" ? (n?.x || 0) + 140 : (n?.y || 0) + 50;
  }
}
