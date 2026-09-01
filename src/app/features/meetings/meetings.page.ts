import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { Modal, PageHeader } from "../../shared/ui";
import { CrmService } from "../crm/crm.service";
import { MeetingsService } from "./meetings.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  template: `<qai-page-header
      title="Demos & Meetings"
      subtitle="Schedule discovery calls and retain the booking against the real CRM contact."
      ><button (click)="load()">↻ Refresh</button
      ><button class="primary" (click)="open()">
        + Schedule meeting
      </button></qai-page-header
    >
    <div class="callout warning" *ngIf="error">
      <span class="callout-icon">!</span>
      <div>
        <b>Meeting action failed</b>
        <p>{{ error }}</p>
      </div>
    </div>
    <section class="directory-card">
      <header><div><span class="eyebrow">CALENDAR DIRECTORY</span><h2>Meeting workspace</h2><p>Every discovery call, demo and follow-up in one schedule.</p></div><div class="directory-summary"><span><b>{{ rows.length }}</b>Total</span><span><b>{{ bookedCount }}</b>Booked</span><span><b>{{ completedCount }}</b>Completed</span></div></header>
      <div class="directory-toolbar"><label><span>⌕</span><input [(ngModel)]="query" placeholder="Search contact or meeting status" /></label><select [(ngModel)]="statusFilter"><option value="">All statuses</option><option>booked</option><option>completed</option><option>cancelled</option><option>no-show</option></select><strong>{{ visible.length }} shown</strong></div>
      <div class="data-state" *ngIf="loading">Loading meetings…</div>
      <div class="directory-empty" *ngIf="!loading && !visible.length">
        <i>◷</i>
        <strong>{{ rows.length ? "No meetings match the filters" : "No meetings booked" }}</strong
        ><span
          >Schedule a discovery call from a qualified reply or CRM
          contact.</span
        ><button class="primary" (click)="open()">
          Schedule first meeting
        </button>
      </div>
      <div class="table-wrap" *ngIf="!loading && visible.length"><table>
        <thead>
          <tr>
            <th>Starts</th>
            <th>Duration</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Calendar</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of visible">
            <td>
              <div class="directory-identity"><i>◷</i><span><b>{{ row.startsAtUtc | date: "mediumDate" }}</b><small>{{ row.startsAtUtc | date: "shortTime" }}</small></span></div>
            </td>
            <td>{{ duration(row) }} min</td>
            <td>{{ contactName(row.contactId) }}</td>
            <td>
              <span class="pill" [ngClass]="statusClass(row.status)">{{ row.status }}</span>
            </td>
            <td>{{ row.externalEventId ? "Synced" : "Internal booking" }}</td>
            <td>
              <div class="directory-actions"><button (click)="open(row)">Edit</button><button class="danger" (click)="remove(row)">Cancel</button></div>
            </td>
          </tr>
        </tbody>
      </table></div>
    </section>
    <qai-modal
      [open]="show"
      [title]="form.id ? 'Edit meeting' : 'Schedule meeting'"
      (close)="show = false"
      ><form class="form" (ngSubmit)="save()">
        <label
          >Contact<select [(ngModel)]="form.contactId" name="contact" required>
            <option value="">Select contact</option>
            <option *ngFor="let contact of contacts" [value]="contact.id">
              {{ displayContact(contact) }}
            </option>
          </select></label
        ><label
          >Meeting type<select [(ngModel)]="form.meetingTypeId" name="type">
            <option value="">Discovery call (default)</option>
            <option *ngFor="let type of types" [value]="type.id">
              {{ type.name }} · {{ type.durationMinutes }} min
            </option>
          </select></label
        >
        <div class="form2">
          <label
            >Date<input
              type="date"
              [(ngModel)]="date"
              name="date"
              required /></label
          ><label
            >Time<input type="time" [(ngModel)]="time" name="time" required
          /></label>
        </div>
        <label
          >Status<select [(ngModel)]="form.status" name="status">
            <option>booked</option>
            <option>completed</option>
            <option>cancelled</option>
            <option>no-show</option>
          </select></label
        >
        <footer>
          <button type="button" (click)="show = false">Cancel</button
          ><button
            class="primary"
            type="submit"
            [disabled]="saving || !form.contactId"
          >
            {{ saving ? "Saving…" : "Save meeting" }}
          </button>
        </footer>
      </form></qai-modal
    >`,
})
export class MeetingsPage implements OnInit {
  rows: any[] = [];
  contacts: any[] = [];
  types: any[] = [];
  show = false;
  form: any = { status: "booked", contactId: "", meetingTypeId: "" };
  date = "";
  time = "09:00";
  error = "";
  loading = false;
  saving = false;
  query = "";
  statusFilter = "";
  constructor(
    private data: MeetingsService,
    private crm: CrmService,
    private route: ActivatedRoute,
  ) {}
  ngOnInit() {
    this.load();
    this.loadOptions();
  }
  load() {
    this.loading = true;
    this.error = "";
    this.data.list().subscribe({
      next: (rows) => {
        this.rows = rows || [];
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.error = this.apiError(e);
      },
    });
  }
  loadOptions() {
    this.crm.contacts().subscribe({
      next: (rows) => {
        this.contacts = rows || [];
        const contactId = this.route.snapshot.queryParamMap.get("contactId");
        if (contactId && this.contacts.some((x) => x.id === contactId))
          this.open(undefined, contactId);
      },
      error: (e) => (this.error = this.apiError(e)),
    });
    this.data
      .types()
      .subscribe({
        next: (rows) => (this.types = rows || []),
        error: (e) => (this.error = this.apiError(e)),
      });
  }
  get visible() {
    const term = this.query.trim().toLowerCase();
    return this.rows.filter((row) =>
      (!term || `${this.contactName(row.contactId)} ${row.status}`.toLowerCase().includes(term)) &&
      (!this.statusFilter || String(row.status).toLowerCase() === this.statusFilter),
    );
  }
  get bookedCount() { return this.rows.filter((row) => String(row.status).toLowerCase() === "booked").length; }
  get completedCount() { return this.rows.filter((row) => String(row.status).toLowerCase() === "completed").length; }
  statusClass(value: unknown) { const status = String(value).toLowerCase(); return status === "booked" ? "status-pending" : status === "completed" ? "status-success" : status === "cancelled" || status === "no-show" ? "status-failed" : ""; }
  open(row?: any, contactId?: string) {
    this.form = row
      ? { ...row }
      : {
          status: "booked",
          contactId: contactId || this.contacts[0]?.id || "",
          meetingTypeId: this.types[0]?.id || "",
        };
    const starts = row?.startsAtUtc
      ? new Date(row.startsAtUtc)
      : new Date(Date.now() + 86400000);
    this.date = starts.toISOString().slice(0, 10);
    this.time = `${String(starts.getHours()).padStart(2, "0")}:${String(starts.getMinutes()).padStart(2, "0")}`;
    this.show = true;
  }
  save() {
    const start = new Date(`${this.date}T${this.time}:00`);
    const type = this.types.find((x) => x.id === this.form.meetingTypeId);
    const minutes = Number(type?.durationMinutes || 30);
    this.form.startsAtUtc = start.toISOString();
    this.form.endsAtUtc = new Date(
      start.getTime() + minutes * 60000,
    ).toISOString();
    this.form.meetingTypeId =
      this.form.meetingTypeId || "00000000-0000-0000-0000-000000000000";
    this.saving = true;
    const request = this.form.id
      ? this.data.update(this.form.id, this.form)
      : this.data.create(this.form);
    request.subscribe({
      next: (row) => {
        const index = this.rows.findIndex((x) => x.id === row.id);
        index >= 0 ? (this.rows[index] = row) : this.rows.unshift(row);
        this.saving = false;
        this.show = false;
      },
      error: (e) => {
        this.saving = false;
        this.error = this.apiError(e);
      },
    });
  }
  remove(row: any) {
    if (confirm("Cancel this meeting?"))
      this.data
        .remove(row.id)
        .subscribe({
          next: () => (this.rows = this.rows.filter((x) => x.id !== row.id)),
          error: (e) => (this.error = this.apiError(e)),
        });
  }
  duration(row: any) {
    return Math.max(
      0,
      Math.round(
        (new Date(row.endsAtUtc).getTime() -
          new Date(row.startsAtUtc).getTime()) /
          60000,
      ),
    );
  }
  contactName(id: string) {
    const contact = this.contacts.find((x) => x.id === id);
    return contact ? this.displayContact(contact) : "Contact";
  }
  displayContact(contact: any) {
    return (
      `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
      contact.email ||
      "Contact"
    );
  }
  private apiError(error: any) {
    return (
      error?.error?.detail ||
      error?.error?.error ||
      (error?.status
        ? `Meetings API returned ${error.status}.`
        : "Meetings API is unavailable.")
    );
  }
}
