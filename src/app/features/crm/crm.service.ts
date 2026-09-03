import { Injectable } from "@angular/core";
import { ApiService } from "../../core/api.service";
import {
  Company,
  Contact,
  Lead,
  Opportunity,
} from "../../core/models/platform.models";
@Injectable({ providedIn: "root" })
export class CrmService {
  constructor(private api: ApiService) {}
  contacts() {
    return this.api.get<Contact[]>("crm/contacts");
  }
  createContact(x: Partial<Contact>) {
    return this.api.post<Contact>("crm/contacts", x);
  }
  updateContact(id: string, x: Partial<Contact>) {
    return this.api.put<Contact>(`crm/contacts/${id}`, x);
  }
  deleteContact(id: string) {
    return this.api.delete<void>(`crm/contacts/${id}`);
  }
  companies() {
    return this.api.get<Company[]>("crm/companies");
  }
  createCompany(x: Partial<Company>) {
    return this.api.post<Company>("crm/companies", x);
  }
  updateCompany(id: string, x: Partial<Company>) {
    return this.api.put<Company>(`crm/companies/${id}`, x);
  }
  deleteCompany(id: string) {
    return this.api.delete<void>(`crm/companies/${id}`);
  }
  leads() {
    return this.api.get<Lead[]>("crm/leads");
  }
  createLead(x: Partial<Lead>) {
    return this.api.post<Lead>("crm/leads", x);
  }
  updateLead(id: string, x: Partial<Lead>) {
    return this.api.put<Lead>(`crm/leads/${id}`, x);
  }
  qualify(id: string) {
    return this.api.post<Lead>(`sales/leads/${id}/qualify`, {});
  }
  convert(id: string) {
    return this.api.post<Opportunity>(`sales/leads/${id}/convert`, {});
  }
  opportunities() {
    return this.api.get<Opportunity[]>("crm/opportunities");
  }
  salesPipelines() {
    return this.api.get<any>("sales/pipelines");
  }
  createOpportunity(x: Partial<Opportunity>) {
    return this.api.post<Opportunity>("crm/opportunities", x);
  }
  updateOpportunity(id: string, x: Partial<Opportunity>) {
    return this.api.put<Opportunity>(`crm/opportunities/${id}`, x);
  }
  moveOpportunity(id: string, stageId: string) {
    return this.api.put<Opportunity>(`crm/opportunities/${id}/stage`, {
      stageId,
    });
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
  runSales() {
    return this.api.post<any>("sales/automation/run", {});
  }
  tasks() {
    return this.api.get<any[]>("sales/tasks");
  }
}
