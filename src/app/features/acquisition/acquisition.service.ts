import { Injectable } from "@angular/core";
import { ApiService } from "../../core/api.service";

@Injectable({ providedIn: "root" })
export class AcquisitionService {
  constructor(private api: ApiService) {}
  overview() {
    return this.api.get<any>("acquisition/overview");
  }
  icps() {
    return this.api.get<any[]>("acquisition/icp");
  }
  createIcp(input: any) {
    return this.api.post<any>("acquisition/icp", input);
  }
  discoveryProviders() {
    return this.api.get<any[]>("acquisition/discovery/providers");
  }
  discoverOnline(icpId: string, input: any) {
    return this.api.post<any>(`acquisition/icp/${icpId}/discover`, input);
  }
  prospects(minimumScore = 0) {
    return this.api.get<any[]>(
      `acquisition/prospects?minimumScore=${minimumScore}`,
    );
  }
  addProspect(input: any) {
    return this.api.post<any>("acquisition/prospects", input);
  }
  importProspects(input: any) {
    return this.api.post<any>("acquisition/prospects/import", input);
  }
  previewProspectImport(file: File, sheetName = "", headerRow?: number) {
    const form = new FormData();
    form.append("file", file);
    if (sheetName) form.append("sheetName", sheetName);
    if (headerRow) form.append("headerRow", String(headerRow));
    return this.api.post<any>("acquisition/prospects/import/preview", form);
  }
  addSignal(id: string, input: any) {
    return this.api.post<any>(`acquisition/prospects/${id}/signals`, input);
  }
  targetLists() {
    return this.api.get<any[]>("acquisition/target-lists");
  }
  createTargetList(input: any) {
    return this.api.post<any>("acquisition/target-lists", input);
  }
  addMembers(id: string, prospectIds: string[]) {
    return this.api.post<any>(
      `acquisition/target-lists/${id}/members`,
      prospectIds,
    );
  }
  campaigns() {
    return this.api.get<any[]>("acquisition/campaigns");
  }
  campaignActivity(id: string) {
    return this.api.get<any[]>(`acquisition/campaigns/${id}/activity`);
  }
  messages() {
    return this.api.get<any[]>("acquisition/messages");
  }
  requestApproval(id: string) {
    return this.api.post<any>(
      `email-operations/messages/${id}/request-approval`,
      {},
    );
  }
  approveAndSend(id: string) {
    return this.api.post<any>(
      `email-operations/messages/${id}/approve-and-send`,
      {},
    );
  }
  retryMessage(id: string) {
    return this.api.post<any>(`email-operations/messages/${id}/retry`, {});
  }
  createCampaign(input: any) {
    return this.api.post<any>("acquisition/campaigns", input);
  }
  startCampaign(id: string) {
    return this.api.post<any>(`acquisition/campaigns/${id}/start`, {});
  }
}
