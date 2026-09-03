import { Injectable } from '@angular/core';
import { ApiService } from '../../core/api.service';

@Injectable({ providedIn: 'root' })
export class EvaluationsService {
  constructor(private api: ApiService) {}
  datasets() { return this.api.get<any[]>('evaluations/datasets'); }
  create(x: any) { return this.api.post<any>('evaluations/datasets', x); }
  cases(datasetId: string) { return this.api.get<any[]>(`evaluations/datasets/${datasetId}/cases`); }
  createCase(datasetId: string, x: any) { return this.api.post<any>(`evaluations/datasets/${datasetId}/cases`, x); }
  deleteCase(id: string) { return this.api.delete<void>(`evaluations/cases/${id}`); }
  runs(datasetId: string) { return this.api.get<any[]>(`evaluations/datasets/${datasetId}/runs`); }
  agents() { return this.api.get<any[]>('ai/agents'); }
  run(id: string, agentId?: string) { return this.api.post<any>(`evaluations/datasets/${id}/run`, { agentId: agentId || null }); }
}
