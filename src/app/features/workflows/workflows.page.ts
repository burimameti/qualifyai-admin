import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Modal, PageHeader } from '../../shared/ui';
import { WorkflowsService } from './workflows.service';

type StepType = 'start' | 'trigger' | 'question' | 'enrich' | 'condition' | 'score' | 'action' | 'approval' | 'send' | 'wait' | 'meeting' | 'handoff' | 'notify' | 'stop';
interface Step {
  id: string;
  flowId: string;
  nodeKey: string;
  type: StepType;
  configJson: string;
  x: number;
  y: number;
}
interface Edge {
  id: string;
  flowId: string;
  fromNodeKey: string;
  toNodeKey: string;
  conditionJson: string;
}
interface Template {
  name: string;
  segment: string;
  summary: string;
  outcome: string;
  steps: Array<[StepType, string, string]>;
}
interface WorkflowSummary {
  id: string;
  name: string;
  active?: boolean;
  createdAtUtc?: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  templateUrl: './workflows.page.html',
  styleUrl: './workflows.page.css'
})
export class WorkflowsPage implements OnInit {
  flows: WorkflowSummary[] = [];
  view: 'list' | 'designer' = 'list';
  workflowQuery = '';
  workflowStatus = '';
  activeId = '';
  nodes: Step[] = [];
  edges: Edge[] = [];
  selected: Step | null = null;
  newOpen = false;
  templateOpen = false;
  saving = false;
  newName = '';
  message = '';
  error = '';

  readonly library: Array<{ type: StepType; label: string; detail: string }> = [
    { type: 'trigger', label: 'Event trigger', detail: 'Start from a reply, score change, form or schedule' },
    { type: 'question', label: 'Collect data', detail: 'Capture missing qualification data' },
    { type: 'enrich', label: 'Enrich prospect', detail: 'Verify company, contact and buying evidence' },
    { type: 'condition', label: 'Business rule', detail: 'Continue only when criteria match' },
    { type: 'score', label: 'Score prospect', detail: 'Calculate fit, intent and priority' },
    { type: 'action', label: 'Business action', detail: 'Create lead, task, opportunity or notification' },
    { type: 'approval', label: 'Approval gate', detail: 'Pause before a high-impact action' },
    { type: 'send', label: 'Send outreach', detail: 'Use verified sender, suppression and approval checks' },
    { type: 'wait', label: 'Wait or schedule', detail: 'Delay follow-up or wait for a business event' },
    { type: 'meeting', label: 'Book meeting', detail: 'Offer a demo or sales meeting' },
    { type: 'handoff', label: 'Human handoff', detail: 'Assign an owner with the full context' },
    { type: 'notify', label: 'Notify team', detail: 'Alert sales or operations in the right channel' },
    { type: 'stop', label: 'Stop or suppress', detail: 'End safely on opt-out, loss or failed eligibility' }
  ];

  readonly templates: Template[] = [
    {
      name: 'Logistics customer acquisition',
      segment: 'Sales acquisition',
      summary: 'Turn European companies with freight demand into qualified sales demos.',
      outcome: 'Qualified meetings',
      steps: [
        ['start', 'Import target companies', 'Licensed provider or reviewed CSV'],
        ['action', 'Verify and enrich', 'Deduplicate domains and collect company evidence'],
        ['score', 'Score fit and intent', 'Geography, industry, size and current buying signals'],
        ['condition', 'Keep sales-ready prospects', 'Fit ≥ 65 and intent ≥ 40'],
        ['handoff', 'Approve audience and message', 'Sales owner reviews every external send'],
        ['action', 'Start controlled outreach', 'Suppression checks, verified sender and throttling'],
        ['meeting', 'Book logistics demo', 'Create CRM opportunity and offer meeting slots']
      ]
    },
    {
      name: 'Freight RFQ qualification',
      segment: 'Inbound sales',
      summary: 'Qualify freight requests and route valuable lanes to the right owner.',
      outcome: 'Quote opportunities',
      steps: [
        ['start', 'Freight request received', 'Web, email or integration event'],
        ['question', 'Capture shipment details', 'Origin, destination, cargo, weight and pickup date'],
        ['condition', 'Check commercial fit', 'Supported lane, cargo and pickup within 30 days'],
        ['score', 'Prioritize opportunity', 'Volume, margin, urgency and company fit'],
        ['action', 'Create quote opportunity', 'Create CRM opportunity and pricing task'],
        ['handoff', 'Assign lane owner', 'Notify the responsible sales owner']
      ]
    },
    {
      name: 'Customer support resolution',
      segment: 'Service operations',
      summary: 'Classify requests, check contracts and safely resolve known issues.',
      outcome: 'Resolved cases',
      steps: [
        ['start', 'Customer request received', 'Support portal, email or integration'],
        ['action', 'Classify issue', 'Delivery, payment, refund or contract category'],
        ['condition', 'Check contract and SLA', 'Validate entitlement and resolution policy'],
        ['action', 'Apply known resolution', 'Use approved knowledge and audit each action'],
        ['handoff', 'Escalate complex case', 'Assign unresolved or high-risk case to specialist']
      ]
    }
  ];

  constructor(private readonly data: WorkflowsService) {}
  ngOnInit(): void {
    this.load();
  }
  get activeName(): string {
    return this.flows.find((x) => x.id === this.activeId)?.name || 'Select a workflow';
  }
  get activeWorkflowCount(): number {
    return this.flows.filter((x) => x.active !== false).length;
  }
  get draftWorkflowCount(): number {
    return this.flows.length - this.activeWorkflowCount;
  }
  get visibleFlows(): WorkflowSummary[] {
    const term = this.workflowQuery.trim().toLowerCase();
    return this.flows.filter((x) => {
      const statusMatches = !this.workflowStatus || (this.workflowStatus === 'active' ? x.active !== false : x.active === false);
      return statusMatches && (!term || `${x.name} ${this.flowSummary(x)}`.toLowerCase().includes(term));
    });
  }
  get readiness(): number {
    const checks = [
      this.nodes.some((x) => x.type === 'start'),
      this.nodes.some((x) => x.type === 'condition' || x.type === 'score'),
      this.nodes.some((x) => ['action', 'meeting', 'handoff'].includes(x.type)),
      this.edges.length >= Math.max(0, this.nodes.length - 1)
    ];
    return this.nodes.length ? checks.filter(Boolean).length * 25 : 0;
  }
  load(): void {
    this.data.list().subscribe({ next: (r) => (this.flows = r), error: (e) => (this.error = this.apiError(e, 'Workflows could not be loaded.')) });
  }
  openFlow(flow: WorkflowSummary): void {
    this.activeId = flow.id;
    this.view = 'designer';
    this.loadDesigner();
  }
  flowSummary(flow: WorkflowSummary): string {
    const name = flow.name.toLowerCase();
    if (name.includes('logistic') || name.includes('freight')) return 'Qualify demand, control outreach and create sales meetings.';
    if (name.includes('support') || name.includes('ticket')) return 'Classify customer issues and route safe resolutions.';
    return 'Business process with configurable rules, actions and human approvals.';
  }
  createFlow(): void {
    this.data.create({ name: this.newName, active: true }).subscribe((flow) => {
      this.flows.push(flow);
      this.activeId = flow.id;
      this.nodes = [this.makeStep('start', 0, 'Workflow started', 'Manual start')];
      this.rebuildEdges();
      this.selected = this.nodes[0];
      this.view = 'designer';
      this.newName = '';
      this.newOpen = false;
      this.message = 'Workflow created. Add the next business step.';
    });
  }
  install(template: Template): void {
    this.data.create({ name: template.name, active: true }).subscribe({
      next: (flow) => {
        this.activeId = flow.id;
        this.nodes = template.steps.map((x, i) => this.makeStep(x[0], i, x[1], x[2]));
        this.view = 'designer';
        this.rebuildEdges();
        this.data.saveDesigner(flow.id, { nodes: this.nodes, edges: this.edges }).subscribe({
          next: () => {
            this.flows.push(flow);
            this.selected = this.nodes[0];
            this.templateOpen = false;
            this.message = `“${template.name}” is ready to review.`;
          },
          error: () => (this.error = 'The steps could not be saved.')
        });
      },
      error: () => (this.error = 'The workflow template could not be installed.')
    });
  }
  loadDesigner(): void {
    if (this.activeId)
      this.data.designer(this.activeId).subscribe({ next: (r) => {
        this.nodes = r.nodes || [];
        this.edges = r.edges || [];
        this.selected = this.nodes[0] || null;
      }, error: (e) => (this.error = this.apiError(e, 'Workflow details could not be loaded.')) });
  }
  add(type: StepType): void {
    if (!this.activeId) {
      this.error = 'Create or select a workflow first.';
      return;
    }
    const step = this.makeStep(
      type,
      this.nodes.length,
      this.label(type),
      'Configure this business instruction'
    );
    this.nodes.push(step);
    this.rebuildEdges();
    this.selected = step;
  }
  remove(step: Step): void {
    this.nodes = this.nodes.filter((x) => x !== step);
    this.position();
    this.rebuildEdges();
    this.selected = this.nodes[0] || null;
  }
  move(step: Step, direction: -1 | 1): void {
    const i = this.nodes.indexOf(step);
    const target = i + direction;
    if (target < 0 || target >= this.nodes.length) return;
    [this.nodes[i], this.nodes[target]] = [this.nodes[target], this.nodes[i]];
    this.position();
    this.rebuildEdges();
  }
  save(): void {
    if (!this.activeId || !this.nodes.length) {
      this.error = 'A workflow requires at least one step.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.data.saveDesigner(this.activeId, { nodes: this.nodes, edges: this.edges }).subscribe({
      next: () => {
        this.saving = false;
        this.message = 'Workflow saved and ready for review.';
      },
      error: (e) => {
        this.saving = false;
        this.error = e?.error?.error || 'Workflow could not be saved.';
      }
    });
  }
  title(step: Step): string {
    return this.config(step).title || this.label(step.type);
  }
  detail(step: Step): string {
    const c = this.config(step);
    return c.detail || c.question || c.condition || c.action || c.event || 'Configure this step';
  }
  updateTitle(value: string): void {
    if (this.selected)
      this.selected.configJson = JSON.stringify({ ...this.config(this.selected), title: value });
  }
  updateDetail(value: string): void {
    if (this.selected)
      this.selected.configJson = JSON.stringify({ ...this.config(this.selected), detail: value });
  }
  instructionGuide(step: Step): { input: string; outcome: string; controls: string; next: string } {
    const guides: Record<StepType, { input: string; outcome: string; controls: string; next: string }> = {
      start: { input: 'Manual launch or installed template', outcome: 'Creates a process context', controls: 'Tenant scope', next: 'Choose an entry trigger' },
      trigger: { input: 'Event, schedule, form, reply or score change', outcome: 'Starts one traceable run', controls: 'Event schema and tenant', next: 'Collect or enrich data' },
      question: { input: 'Prospect, contact or customer response', outcome: 'Stores required qualification facts', controls: 'Required fields and consent', next: 'Validate eligibility' },
      enrich: { input: 'Company domain or contact details', outcome: 'Verified company and buying evidence', controls: 'Source confidence and duplicate checks', next: 'Score fit and intent' },
      condition: { input: 'Stored facts and policy rules', outcome: 'Routes yes/no branch', controls: 'Explainable rule expression', next: 'Score, act or stop' },
      score: { input: 'Fit, intent, firmographic and engagement signals', outcome: 'Priority and qualification result', controls: 'Thresholds and score explanation', next: 'Route to nurture or sales' },
      action: { input: 'Approved process context', outcome: 'Creates a business record or task', controls: 'Permission and idempotency checks', next: 'Notify owner or continue' },
      approval: { input: 'Proposed external or high-risk action', outcome: 'Review task for a responsible owner', controls: 'No execution before approval', next: 'Send, edit or stop' },
      send: { input: 'Approved message and verified sender', outcome: 'Provider delivery request', controls: 'Suppression, sender verification and rate limits', next: 'Wait for provider event or reply' },
      wait: { input: 'Delay duration or target event', outcome: 'Scheduled next step', controls: 'Cancellation and timeout policy', next: 'Resume at the configured step' },
      meeting: { input: 'Qualified contact and meeting type', outcome: 'Booking or sales task', controls: 'Calendar availability and consent', next: 'Create or advance opportunity' },
      handoff: { input: 'Full run context and reason', outcome: 'Assigned human work item', controls: 'Owner, SLA and audit record', next: 'Resume after human decision' },
      notify: { input: 'Relevant outcome and target team', outcome: 'Traceable notification', controls: 'Role-based recipients', next: 'Track acknowledgement' },
      stop: { input: 'Opt-out, loss, invalid data or policy decision', outcome: 'Process ends safely', controls: 'Suppression and audit trail', next: 'No further external action' }
    };
    return guides[step.type];
  }
  track(_: number, step: Step): string {
    return step.id;
  }
  private makeStep(type: StepType, index: number, title: string, detail: string): Step {
    return {
      id: crypto.randomUUID(),
      flowId: this.activeId,
      nodeKey: index ? `step_${index}_${Date.now()}` : 'start',
      type,
      configJson: JSON.stringify({ title, detail }),
      x: 120,
      y: 80 + index * 150
    };
  }
  private rebuildEdges(): void {
    this.edges = this.nodes
      .slice(1)
      .map((node, i) => ({
        id: crypto.randomUUID(),
        flowId: this.activeId,
        fromNodeKey: this.nodes[i].nodeKey,
        toNodeKey: node.nodeKey,
        conditionJson: '{}'
      }));
  }
  private position(): void {
    this.nodes.forEach((x, i) => {
      x.x = 120;
      x.y = 80 + i * 150;
    });
  }
  private config(step: Step): Record<string, string> {
    try {
      return JSON.parse(step.configJson || '{}');
    } catch {
      return {};
    }
  }
  private label(type: StepType): string {
    return (
      {
        start: 'Start workflow',
        question: 'Collect qualification data',
        trigger: 'Start from an event',
        enrich: 'Verify and enrich data',
        condition: 'Check business rule',
        score: 'Score prospect',
        action: 'Run business action',
        approval: 'Request human approval',
        send: 'Send controlled outreach',
        wait: 'Wait or schedule next step',
        meeting: 'Book meeting',
        handoff: 'Human handoff',
        notify: 'Notify responsible team',
        stop: 'Stop process safely'
      } as Record<StepType, string>
    )[type];
  }
  private apiError(error: any, fallback: string): string {
    return error?.error?.detail || error?.error?.title || (error?.status ? `${fallback} API returned ${error.status}.` : fallback);
  }
}
