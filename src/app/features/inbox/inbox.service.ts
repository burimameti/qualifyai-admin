import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiService } from "../../core/api.service";
@Injectable({ providedIn: "root" })
export class InboxService {
  constructor(private api: ApiService) {}
  conversations<T = any>(): Observable<T> {
    return this.api.get<T>("inbox/conversations");
  }
  create<T = any>(input: any) {
    return this.api.post<T>("inbox/conversations", input);
  }
  messages<T = any>(id: string): Observable<T> {
    return this.api.get<T>(`inbox/conversations/${id}/messages`);
  }
  send<T = any>(id: string, text: string) {
    return this.api.post<T>(`inbox/conversations/${id}/messages`, {
      text,
      senderType: "agent",
    });
  }
  note<T = any>(id: string, text: string) {
    return this.api.post<T>(`inbox/conversations/${id}/notes`, { text });
  }
  takeover<T = any>(id: string) {
    return this.api.post<T>(`inbox/conversations/${id}/takeover`, {});
  }
  update<T = any>(id: string, x: any) {
    return this.api.put<T>(`inbox/conversations/${id}`, x);
  }
}
