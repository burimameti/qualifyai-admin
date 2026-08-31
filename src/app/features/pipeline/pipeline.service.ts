import { Injectable } from "@angular/core";
import { ApiService } from "../../core/api.service";
import { Opportunity } from "../../core/models/platform.models";
@Injectable({ providedIn: "root" })
export class PipelineService {
  constructor(private api: ApiService) {}
  load() {
    return this.api.get<any>("sales/pipelines");
  }
  opportunities() {
    return this.api.get<Opportunity[]>("crm/opportunities");
  }
  move(id: string, stageId: string) {
    return this.api.put<Opportunity>(`crm/opportunities/${id}/stage`, {
      stageId,
    });
  }
  createPipeline(input: any) {
    return this.api.post<any>("sales/pipelines", input);
  }
  updatePipeline(id: string, input: any) {
    return this.api.put<any>(`sales/pipelines/${id}`, input);
  }
  createStage(pipelineId: string, input: any) {
    return this.api.post<any>(`sales/pipelines/${pipelineId}/stages`, input);
  }
  updateStage(pipelineId: string, stageId: string, input: any) {
    return this.api.put<any>(
      `sales/pipelines/${pipelineId}/stages/${stageId}`,
      input,
    );
  }
  deleteStage(pipelineId: string, stageId: string) {
    return this.api.delete<void>(
      `sales/pipelines/${pipelineId}/stages/${stageId}`,
    );
  }
  closeOpportunity(id: string, won: boolean, lossReason = "") {
    return this.api.post<Opportunity>(`crm/opportunities/${id}/close`, {
      won,
      lossReason,
    });
  }
  reopenOpportunity(id: string) {
    return this.api.post<Opportunity>(`crm/opportunities/${id}/reopen`, {});
  }
}
