import { Injectable } from '@angular/core';
import { ApiService } from '../../core/api.service';
@Injectable({ providedIn: 'root' })
export class IntegrationsService {
  constructor(private api: ApiService) {}
  list() {
    return this.api.get<any[]>('integrations');
  }
  providers() {
    return this.api.get<any[]>('integrations/providers');
  }
  create(x: any) {
    return this.api.post<any>('integrations', x);
  }
  update(id: string, x: any) {
    return this.api.put<any>(`integrations/${id}`, x);
  }
  test(id: string) {
    return this.api.post<any>(`integrations/${id}/test`, {});
  }
  senders() {
    return this.api.get<any[]>('email-operations/senders');
  }
  configureSender(x: any) {
    return this.api.post<any>('email-operations/senders', x);
  }
  verifySender(id: string, token: string | null) {
    return this.api.post<any>(`email-operations/senders/${id}/verify`, { token });
  }
  sendVerification(id: string) {
    return this.api.post<any>(`email-operations/senders/${id}/send-verification`, {});
  }
  suppress(email: string, reason: string) {
    return this.api.post<any>('email-operations/suppressions', { email, reason });
  }
}
