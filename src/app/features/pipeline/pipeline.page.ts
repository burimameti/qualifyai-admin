import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Opportunity } from '../../core/models/platform.models';
import { Modal, PageHeader } from '../../shared/ui';
import { PipelineService } from './pipeline.service';

interface SalesPipeline { id: string; name: string; isDefault: boolean; }
interface PipelineStage { id: string; pipelineId: string; name: string; sortOrder: number; probability: number; }

@Component({ standalone: true, imports: [CommonModule, FormsModule, Modal, PageHeader], templateUrl: './pipeline.page.html', styleUrl: './pipeline.page.css' })
export class PipelinePage implements OnInit {
  pipelines: SalesPipeline[] = []; stages: PipelineStage[] = []; opps: Opportunity[] = [];
  selectedId = ''; view: 'overview' | 'board' | 'configuration' = 'overview';
  loading = false; saving = false; error = ''; drag: Opportunity | null = null; selectedOpportunity: Opportunity | null = null;
  pipelineForm = { name: '', isDefault: false }; stageForm = { name: '', probability: 0 };
  constructor(private data: PipelineService) {}
  ngOnInit() { this.load(); }
  load() {
    this.loading = true; this.error = '';
    this.data.load().subscribe({next: r => { this.pipelines = r.pipelines || []; this.stages = r.stages || []; if (this.selectedId && !this.pipelines.some(x => x.id === this.selectedId)) this.selectedId = ''; this.loading = false; }, error: e => { this.error = this.apiError(e, 'Pipelines could not be loaded.'); this.loading = false; }});
    this.data.opportunities().subscribe({next: r => this.opps = r || [], error: e => this.error = this.apiError(e, 'Opportunities could not be loaded.')});
  }
  open(pipeline: SalesPipeline, view: 'board' | 'configuration' = 'board') { this.selectedId = pipeline.id; this.pipelineForm = { name: pipeline.name, isDefault: pipeline.isDefault }; this.view = view; }
  back() { this.view = 'overview'; this.selectedId = ''; }
  get selected() { return this.pipelines.find(x => x.id === this.selectedId); }
  get selectedStages() { return this.stages.filter(x => x.pipelineId === this.selectedId).sort((a, b) => a.sortOrder - b.sortOrder); }
  pipelineStages(id: string) { return this.stages.filter(x => x.pipelineId === id); }
  pipelineOpps(id: string) { const ids = new Set(this.pipelineStages(id).map(x => x.id)); return this.opps.filter(x => !!x.pipelineStageId && ids.has(x.pipelineStageId)); }
  pipelineValue(id: string) { return this.pipelineOpps(id).reduce((sum, x) => sum + Number(x.amount || 0), 0); }
  cards(id: string) { return this.opps.filter(x => x.pipelineStageId === id); }
  stageTotal(id: string) { return this.cards(id).reduce((sum, x) => sum + Number(x.amount || 0), 0); }
  get total() { return this.selectedId ? this.pipelineValue(this.selectedId) : this.opps.reduce((sum, x) => sum + Number(x.amount || 0), 0); }
  get weighted() { return this.selectedStages.reduce((sum, s) => sum + this.stageTotal(s.id) * (Number(s.probability || 0) / 100), 0); }
  newPipeline() { this.selectedId = ''; this.pipelineForm = { name: '', isDefault: this.pipelines.length === 0 }; this.view = 'configuration'; }
  savePipeline() {
    const name = this.pipelineForm.name.trim(); if (!name) return; this.saving = true;
    const request = this.selected ? this.data.updatePipeline(this.selected.id, { ...this.pipelineForm, name }) : this.data.createPipeline({ ...this.pipelineForm, name });
    request.subscribe({next: p => { const existing = this.pipelines.find(x => x.id === p.id); existing ? Object.assign(existing, p) : this.pipelines.push(p); this.selectedId = p.id; this.saving = false; }, error: e => { this.error = this.apiError(e, 'Pipeline could not be saved.'); this.saving = false; }});
  }
  addStage() { if (!this.selected || !this.stageForm.name.trim()) return; const input = { name: this.stageForm.name.trim(), probability: Number(this.stageForm.probability), sortOrder: this.selectedStages.length }; this.data.createStage(this.selected.id, input).subscribe({next: s => { this.stages.push(s); this.stageForm = { name: '', probability: 0 }; }, error: e => this.error = this.apiError(e, 'Stage could not be added.')}); }
  saveStage(stage: PipelineStage) { this.data.updateStage(stage.pipelineId, stage.id, { name: stage.name, probability: Number(stage.probability), sortOrder: Number(stage.sortOrder) }).subscribe({next: s => Object.assign(stage, s), error: e => this.error = this.apiError(e, 'Stage could not be saved.')}); }
  removeStage(stage: PipelineStage) { if (!confirm(`Delete stage “${stage.name}”?`)) return; this.data.deleteStage(stage.pipelineId, stage.id).subscribe({next: () => this.stages = this.stages.filter(x => x.id !== stage.id), error: e => this.error = this.apiError(e, 'Stage could not be deleted. Move its opportunities first.')}); }
  dropOn(id: string) { if (!this.drag) return; const x = this.drag, before = x.pipelineStageId; x.pipelineStageId = id; this.data.move(x.id, id).subscribe({next: r => Object.assign(x, r), error: e => { x.pipelineStageId = before; this.error = this.apiError(e, 'Opportunity could not be moved.'); }}); }
  money(v: number) { return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v || 0); }
  scoreFor(x: Opportunity) { return x.amount > 30000 ? 93 : x.amount > 15000 ? 84 : 71; }
  private apiError(error: any, fallback: string) { return error?.error?.detail || error?.error?.error || (error?.status ? `${fallback} API returned ${error.status}.` : fallback); }
}
