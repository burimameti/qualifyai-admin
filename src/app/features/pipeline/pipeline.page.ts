import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Opportunity } from "../../core/models/platform.models";
import { Modal, PageHeader } from "../../shared/ui";
import { PipelineService } from "./pipeline.service";

interface SalesPipeline {
  id: string;
  name: string;
  isDefault: boolean;
}
interface PipelineStage {
  id: string;
  pipelineId: string;
  name: string;
  sortOrder: number;
  probability: number;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  templateUrl: "./pipeline.page.html",
  styleUrl: "./pipeline.page.css",
  styles: [`.pipeline-explainer{align-items:center;background:linear-gradient(100deg,#eff6ff,#f8fafc);border:1px solid #cfe0ff;border-radius:15px;display:flex;justify-content:space-between;margin-bottom:14px;padding:14px 17px}.pipeline-explainer .eyebrow,.unassigned-deals .eyebrow{color:#2563eb;display:block;font-size:.65rem;font-weight:800;letter-spacing:.1em;margin-bottom:3px}.pipeline-explainer b{color:#172554;font-size:.9rem}.pipeline-explainer p{color:#526278;font-size:.75rem;margin:3px 0 0;max-width:690px}.unassigned-deals{background:#fffaf0;border:1px solid #fed7aa;border-radius:15px;margin:16px 0;padding:16px}.unassigned-deals header h3{color:#7c2d12;font-size:.93rem;margin:2px 0}.unassigned-deals header p{color:#9a3412;font-size:.76rem;margin:3px 0 12px}.unassigned-deals article{align-items:center;background:#fff;border:1px solid #fde7be;border-radius:10px;display:grid;gap:11px;grid-template-columns:1fr 190px auto;margin-top:8px;padding:10px 11px}.unassigned-deals article div{display:flex;flex-direction:column}.unassigned-deals article b{font-size:.8rem}.unassigned-deals article span{color:#64748b;font-size:.72rem;margin-top:3px}.unassigned-deals select{border:1px solid #f3c980;border-radius:8px;height:34px;padding:0 8px}@media(max-width:760px){.pipeline-explainer,.unassigned-deals article{align-items:stretch;flex-direction:column;grid-template-columns:1fr}.pipeline-explainer{display:flex}}`],
})
export class PipelinePage implements OnInit {
  pipelines: SalesPipeline[] = [];
  stages: PipelineStage[] = [];
  opps: Opportunity[] = [];
  selectedId = "";
  view: "overview" | "board" | "configuration" = "overview";
  loading = false;
  saving = false;
  error = "";
  pipelineQuery = "";
  drag: Opportunity | null = null;
  selectedOpportunity: Opportunity | null = null;
  pipelineForm = { name: "", isDefault: false };
  stageForm = { name: "", probability: 0 };
  constructor(private data: PipelineService) {}
  ngOnInit() {
    this.load();
  }
  load() {
    this.loading = true;
    this.error = "";
    this.data.load().subscribe({
      next: (r) => {
        this.pipelines = r.pipelines || [];
        this.stages = r.stages || [];
        if (
          this.selectedId &&
          !this.pipelines.some((x) => x.id === this.selectedId)
        )
          this.selectedId = "";
        this.loading = false;
      },
      error: (e) => {
        this.error = this.apiError(e, "Pipelines could not be loaded.");
        this.loading = false;
      },
    });
    this.data
      .opportunities()
      .subscribe({
        next: (r) => (this.opps = r || []),
        error: (e) =>
          (this.error = this.apiError(e, "Opportunities could not be loaded.")),
      });
  }
  open(pipeline: SalesPipeline, view: "board" | "configuration" = "board") {
    this.selectedId = pipeline.id;
    this.pipelineForm = { name: pipeline.name, isDefault: pipeline.isDefault };
    this.view = view;
  }
  back() {
    this.view = "overview";
    this.selectedId = "";
  }
  get selected() {
    return this.pipelines.find((x) => x.id === this.selectedId);
  }
  get visiblePipelines() {
    const term = this.pipelineQuery.trim().toLowerCase();
    return this.pipelines.filter((pipeline) => !term || pipeline.name.toLowerCase().includes(term));
  }
  get selectedStages() {
    return this.stages
      .filter((x) => x.pipelineId === this.selectedId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }
  get unassignedOpen() {
    return this.opps.filter(
      (x) => !x.pipelineStageId && this.opportunityStatus(x.status) === "Open",
    );
  }
  pipelineStages(id: string) {
    return this.stages.filter((x) => x.pipelineId === id);
  }
  pipelineOpps(id: string) {
    const ids = new Set(this.pipelineStages(id).map((x) => x.id));
    return this.opps.filter(
      (x) => !!x.pipelineStageId && ids.has(x.pipelineStageId),
    );
  }
  pipelineValue(id: string) {
    return this.pipelineOpps(id).reduce(
      (sum, x) => sum + Number(x.amount || 0),
      0,
    );
  }
  cards(id: string) {
    return this.opps.filter((x) => x.pipelineStageId === id);
  }
  stageTotal(id: string) {
    return this.cards(id).reduce((sum, x) => sum + Number(x.amount || 0), 0);
  }
  get total() {
    return this.selectedId
      ? this.pipelineValue(this.selectedId)
      : this.opps.reduce((sum, x) => sum + Number(x.amount || 0), 0);
  }
  get weighted() {
    return this.selectedStages.reduce(
      (sum, s) =>
        sum + this.stageTotal(s.id) * (Number(s.probability || 0) / 100),
      0,
    );
  }
  newPipeline() {
    this.selectedId = "";
    this.pipelineForm = { name: "", isDefault: this.pipelines.length === 0 };
    this.view = "configuration";
  }
  savePipeline() {
    const name = this.pipelineForm.name.trim();
    if (!name) return;
    this.saving = true;
    const request = this.selected
      ? this.data.updatePipeline(this.selected.id, {
          ...this.pipelineForm,
          name,
        })
      : this.data.createPipeline({ ...this.pipelineForm, name });
    request.subscribe({
      next: (p) => {
        const existing = this.pipelines.find((x) => x.id === p.id);
        existing ? Object.assign(existing, p) : this.pipelines.push(p);
        this.selectedId = p.id;
        this.saving = false;
      },
      error: (e) => {
        this.error = this.apiError(e, "Pipeline could not be saved.");
        this.saving = false;
      },
    });
  }
  addStage() {
    if (!this.selected || !this.stageForm.name.trim()) return;
    const input = {
      name: this.stageForm.name.trim(),
      probability: Number(this.stageForm.probability),
      sortOrder: this.selectedStages.length,
    };
    this.data.createStage(this.selected.id, input).subscribe({
      next: (s) => {
        this.stages.push(s);
        this.stageForm = { name: "", probability: 0 };
      },
      error: (e) =>
        (this.error = this.apiError(e, "Stage could not be added.")),
    });
  }
  saveStage(stage: PipelineStage) {
    this.data
      .updateStage(stage.pipelineId, stage.id, {
        name: stage.name,
        probability: Number(stage.probability),
        sortOrder: Number(stage.sortOrder),
      })
      .subscribe({
        next: (s) => Object.assign(stage, s),
        error: (e) =>
          (this.error = this.apiError(e, "Stage could not be saved.")),
      });
  }
  removeStage(stage: PipelineStage) {
    if (!confirm(`Delete stage “${stage.name}”?`)) return;
    this.data
      .deleteStage(stage.pipelineId, stage.id)
      .subscribe({
        next: () =>
          (this.stages = this.stages.filter((x) => x.id !== stage.id)),
        error: (e) =>
          (this.error = this.apiError(
            e,
            "Stage could not be deleted. Move its opportunities first.",
          )),
      });
  }
  dropOn(id: string) {
    if (!this.drag) return;
    const x = this.drag,
      before = x.pipelineStageId;
    x.pipelineStageId = id;
    this.data.move(x.id, id).subscribe({
      next: (r) => Object.assign(x, r),
      error: (e) => {
        x.pipelineStageId = before;
        this.error = this.apiError(e, "Opportunity could not be moved.");
      },
    });
  }
  assignUnassigned(opportunity: Opportunity, stageId: string) {
    if (!stageId) return;
    const before = opportunity.pipelineStageId;
    opportunity.pipelineStageId = stageId;
    this.data.move(opportunity.id, stageId).subscribe({
      next: (saved) => Object.assign(opportunity, saved),
      error: (e) => {
        opportunity.pipelineStageId = before;
        this.error = this.apiError(e, "Opportunity could not be assigned.");
      },
    });
  }
  closeSelected(won: boolean) {
    if (!this.selectedOpportunity) return;
    const current = this.selectedOpportunity;
    const reason = won
      ? ""
      : (prompt("Why was this opportunity lost?") || "").trim();
    if (!won && !reason) return;
    this.data.closeOpportunity(current.id, won, reason).subscribe({
      next: (r) => {
        Object.assign(current, r);
        this.selectedOpportunity = null;
        this.load();
      },
      error: (e) =>
        (this.error = this.apiError(e, "Opportunity could not be closed.")),
    });
  }
  reopenSelected() {
    if (!this.selectedOpportunity) return;
    const current = this.selectedOpportunity;
    this.data.reopenOpportunity(current.id).subscribe({
      next: (r) => {
        Object.assign(current, r);
        this.selectedOpportunity = null;
        this.load();
      },
      error: (e) =>
        (this.error = this.apiError(e, "Opportunity could not be reopened.")),
    });
  }
  opportunityStatus(value: any) {
    return typeof value === "string"
      ? value
      : ["Open", "Won", "Lost"][value] || String(value);
  }
  money(v: number) {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(v || 0);
  }
  scoreFor(x: Opportunity) {
    return x.amount > 30000 ? 93 : x.amount > 15000 ? 84 : 71;
  }
  private apiError(error: any, fallback: string) {
    return (
      error?.error?.detail ||
      error?.error?.error ||
      (error?.status ? `${fallback} API returned ${error.status}.` : fallback)
    );
  }
}
