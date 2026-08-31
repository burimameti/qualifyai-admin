import { Injectable } from "@angular/core";
import { ApiService } from "../../core/api.service";
@Injectable({ providedIn: "root" })
export class MeetingsService {
  constructor(private api: ApiService) {}
  list() {
    return this.api.get<any[]>("meetings");
  }
  types() {
    return this.api.get<any[]>("meetings/types");
  }
  create(x: any) {
    return this.api.post<any>("meetings", x);
  }
  update(id: string, x: any) {
    return this.api.put<any>(`meetings/${id}`, x);
  }
  remove(id: string) {
    return this.api.delete<void>(`meetings/${id}`);
  }
}
