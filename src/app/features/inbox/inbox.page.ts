import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { ApiService } from "../../core/api.service";
import { Modal, PageHeader } from "../../shared/ui";
import { CrmService } from "../crm/crm.service";
import { InboxService } from "./inbox.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  template: `
    <qai-page-header
      title="Inbox"
      subtitle="Customer conversations with complete CRM and automation context."
    >
      <button (click)="load()">↻ Refresh</button
      ><button class="primary" (click)="openConversation()">
        + New conversation
      </button>
    </qai-page-header>
    <div class="callout warning" *ngIf="error">
      <span class="callout-icon">!</span>
      <div>
        <b>Inbox action failed</b>
        <p>{{ error }}</p>
      </div>
    </div>
    <div class="inbox">
      <aside class="conv-list">
        <div class="tabs">
          <button [class.active]="filter === 'open'" (click)="filter = 'open'">
            Open</button
          ><button [class.active]="filter === 'all'" (click)="filter = 'all'">
            All
          </button>
        </div>
        <input [(ngModel)]="query" placeholder="Search conversations" />
        <div class="data-state" *ngIf="loading">Loading conversations…</div>
        <button
          class="conv"
          *ngFor="let c of visible"
          [class.active]="selected?.id === c.id"
          (click)="select(c)"
        >
          <i>{{ initials(c) }}</i>
          <div>
            <b>{{ name(c) }}</b
            ><span>{{ preview(c) }}</span
            ><small>{{
              c.aiEnabled ? "Automated handling" : "Human assigned"
            }}</small>
          </div>
          <em>{{ status(c.status) }}</em>
        </button>
        <div class="data-state" *ngIf="!loading && !visible.length">
          <b>No conversations</b
          ><span>Open one from an existing CRM contact.</span>
        </div>
      </aside>
      <section class="conversation" *ngIf="selected; else chooseConversation">
        <header>
          <div>
            <b>{{ name(selected) }}</b
            ><span>{{
              selected.aiEnabled
                ? "Automation is handling this conversation"
                : "Human agent has control"
            }}</span>
          </div>
          <div>
            <button (click)="toggleTakeover()">
              {{
                selected.aiEnabled ? "Take over" : "Return to automation"
              }}</button
            ><button (click)="closeConversation()">Close</button>
          </div>
        </header>
        <div class="messages">
          <article
            *ngFor="let item of messages"
            [class.agent]="item.senderType !== 'visitor'"
          >
            <span>{{ item.senderType }}</span>
            <p>{{ item.text }}</p>
            <small>{{ item.createdAtUtc | date: "shortTime" }}</small>
          </article>
          <div class="data-state" *ngIf="!messages.length">
            No messages in this conversation.
          </div>
          <div class="ai-event" *ngIf="selected.leadId">
            Lead qualification · {{ selected.leadScore || 0 }}/100 ·
            {{ selected.leadStatus || "new" }}
          </div>
        </div>
        <footer>
          <textarea
            [(ngModel)]="draft"
            placeholder="Reply to customer…"
          ></textarea>
          <div>
            <button (click)="note()">Internal note</button
            ><button
              class="primary"
              [disabled]="!draft.trim()"
              (click)="send()"
            >
              Send reply
            </button>
          </div>
        </footer>
      </section>
      <ng-template #chooseConversation
        ><section class="conversation data-state">
          <b>Select a conversation</b
          ><span>Messages and real CRM context will appear here.</span>
        </section></ng-template
      >
      <aside class="customer" *ngIf="selected">
        <h3>Customer context</h3>
        <div class="profile">
          <i>{{ initials(selected) }}</i
          ><b>{{ name(selected) }}</b
          ><span>{{ selected.email || "No email recorded" }}</span>
        </div>
        <dl>
          <dt>Lifecycle</dt>
          <dd>{{ selected.lifecycleStage || "Not set" }}</dd>
          <dt>Lead status</dt>
          <dd>{{ selected.leadStatus || "No lead" }}</dd>
          <dt>Lead score</dt>
          <dd>
            {{
              selected.leadScore == null ? "—" : selected.leadScore + " / 100"
            }}
          </dd>
          <dt>Intent</dt>
          <dd>{{ selected.intent || "No intent captured" }}</dd>
          <dt>Potential value</dt>
          <dd>
            {{
              selected.estimatedValue == null
                ? "—"
                : money(selected.estimatedValue)
            }}
          </dd>
        </dl>
        <button
          class="primary full"
          [disabled]="!selected.leadId"
          (click)="createOpportunity()"
        >
          Create opportunity</button
        ><button
          class="full"
          [disabled]="!selected.contactId"
          (click)="bookMeeting()"
        >
          Schedule meeting
        </button>
        <button
          class="full"
          [disabled]="!selected.contactId"
          (click)="openTicket()"
        >
          Create support ticket
        </button>
      </aside>
    </div>
    <qai-modal
      [open]="showCreate"
      title="Open customer conversation"
      (close)="showCreate = false"
      ><form class="form" (ngSubmit)="createConversation()">
        <label
          >CRM contact<select
            [(ngModel)]="conversationForm.contactId"
            name="contact"
            required
          >
            <option value="">Select contact</option>
            <option *ngFor="let contact of contacts" [value]="contact.id">
              {{ contactName(contact) }} · {{ contact.email }}
            </option>
          </select></label
        ><label
          >Initial message<textarea
            rows="4"
            [(ngModel)]="conversationForm.initialMessage"
            name="message"
          ></textarea></label
        ><label class="checkline"
          ><input
            type="checkbox"
            [(ngModel)]="conversationForm.aiEnabled"
            name="automation"
          />
          Enable automated handling</label
        >
        <footer>
          <button type="button" (click)="showCreate = false">Cancel</button
          ><button
            class="primary"
            type="submit"
            [disabled]="!conversationForm.contactId"
          >
            Open conversation
          </button>
        </footer>
      </form></qai-modal
    >
    <qai-modal
      [open]="showTicket"
      title="Create support ticket"
      (close)="showTicket = false"
      ><form class="form" (ngSubmit)="createTicket()">
        <label
          >Subject<input
            [(ngModel)]="ticketForm.subject"
            name="ticketSubject"
            required
        /></label>
        <label
          >Description<textarea
            rows="5"
            [(ngModel)]="ticketForm.description"
            name="ticketDescription"
            required
          ></textarea>
        </label>
        <label
          >Priority<select
            [(ngModel)]="ticketForm.priority"
            name="ticketPriority"
          >
            <option [ngValue]="0">Low</option>
            <option [ngValue]="1">Normal</option>
            <option [ngValue]="2">High</option>
            <option [ngValue]="3">Urgent</option>
          </select></label
        >
        <footer>
          <button type="button" (click)="showTicket = false">Cancel</button
          ><button
            class="primary"
            type="submit"
            [disabled]="
              !ticketForm.subject.trim() || !ticketForm.description.trim()
            "
          >
            Create ticket
          </button>
        </footer>
      </form></qai-modal
    >
  `,
  styleUrl: "./inbox.page.css",
})
export class InboxPage implements OnInit {
  items: any[] = [];
  contacts: any[] = [];
  selected: any;
  messages: any[] = [];
  draft = "";
  query = "";
  filter = "open";
  error = "";
  loading = false;
  showCreate = false;
  showTicket = false;
  conversationForm: any = {
    contactId: "",
    initialMessage: "",
    aiEnabled: true,
  };
  ticketForm: any = { subject: "", description: "", priority: 1 };
  constructor(
    private data: InboxService,
    private api: ApiService,
    private crm: CrmService,
    private router: Router,
  ) {}
  ngOnInit() {
    this.load();
  }
  load() {
    this.loading = true;
    this.error = "";
    this.data.conversations<any[]>().subscribe({
      next: (rows) => {
        this.items = rows || [];
        this.loading = false;
        if (this.items.length && !this.selected) this.select(this.items[0]);
      },
      error: (e) => {
        this.loading = false;
        this.error = this.apiError(e);
      },
    });
  }
  get visible() {
    return this.items.filter(
      (item) =>
        (this.filter === "all" || this.status(item.status) === "Open") &&
        this.name(item).toLowerCase().includes(this.query.toLowerCase()),
    );
  }
  select(conversation: any) {
    this.selected = conversation;
    this.data.messages<any[]>(conversation.id).subscribe({
      next: (rows) => (this.messages = rows || []),
      error: (e) => (this.error = this.apiError(e)),
    });
  }
  send() {
    if (!this.draft.trim() || !this.selected) return;
    this.data.send<any>(this.selected.id, this.draft).subscribe({
      next: (item) => {
        this.messages.push(item);
        this.draft = "";
      },
      error: (e) => (this.error = this.apiError(e)),
    });
  }
  toggleTakeover() {
    if (!this.selected) return;
    if (this.selected.aiEnabled)
      this.data.takeover<any>(this.selected.id).subscribe({
        next: (row) => Object.assign(this.selected, row),
        error: (e) => (this.error = this.apiError(e)),
      });
    else
      this.data
        .update<any>(this.selected.id, {
          status: this.status(this.selected.status),
          aiEnabled: true,
        })
        .subscribe({
          next: (row) => Object.assign(this.selected, row),
          error: (e) => (this.error = this.apiError(e)),
        });
  }
  closeConversation() {
    if (!this.selected) return;
    this.data
      .update<any>(this.selected.id, {
        status: "Closed",
        aiEnabled: this.selected.aiEnabled,
      })
      .subscribe({
        next: (row) => {
          Object.assign(this.selected, row);
          this.load();
        },
        error: (e) => (this.error = this.apiError(e)),
      });
  }
  note() {
    const text = prompt("Internal note");
    if (text?.trim())
      this.data
        .note<any>(this.selected.id, text)
        .subscribe({ error: (e) => (this.error = this.apiError(e)) });
  }
  openConversation() {
    this.crm.contacts().subscribe({
      next: (rows) => {
        this.contacts = rows || [];
        this.conversationForm = {
          contactId: this.contacts[0]?.id || "",
          initialMessage: "",
          aiEnabled: true,
        };
        this.showCreate = true;
      },
      error: (e) => (this.error = this.apiError(e)),
    });
  }
  createConversation() {
    this.data.create<any>(this.conversationForm).subscribe({
      next: () => {
        this.showCreate = false;
        this.selected = null;
        this.load();
      },
      error: (e) => (this.error = this.apiError(e)),
    });
  }
  createOpportunity() {
    if (!this.selected?.leadId) return;
    this.api
      .post<any>(`sales/leads/${this.selected.leadId}/convert`, {})
      .subscribe({
        next: () => this.router.navigate(["/pipeline"]),
        error: (e) => (this.error = this.apiError(e)),
      });
  }
  bookMeeting() {
    if (this.selected?.contactId)
      this.router.navigate(["/meetings"], {
        queryParams: { contactId: this.selected.contactId },
      });
  }
  openTicket() {
    this.ticketForm = {
      subject: this.selected?.intent || "Customer support request",
      description: this.preview(this.selected),
      priority: 1,
    };
    this.showTicket = true;
  }
  createTicket() {
    const input = {
      ...this.ticketForm,
      conversationId: this.selected.id,
      contactId: this.selected.contactId,
      slaPolicyId: null,
    };
    this.api.post<any>("tickets", input).subscribe({
      next: () => {
        this.showTicket = false;
        this.router.navigate(["/tickets"]);
      },
      error: (e) => (this.error = this.apiError(e)),
    });
  }
  name(item: any) {
    return item.contactName?.trim() || item.email || "Customer conversation";
  }
  preview(item: any) {
    return item.lastMessage || item.intent || "No message yet";
  }
  initials(item: any) {
    return this.name(item)
      .split(" ")
      .map((part: string) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  contactName(contact: any) {
    return (
      `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
      contact.email
    );
  }
  status(value: any) {
    return typeof value === "string"
      ? value
      : ["Open", "Pending", "Closed"][value] || String(value);
  }
  money(value: number) {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  }
  private apiError(error: any) {
    return (
      error?.error?.detail ||
      error?.error?.error ||
      (error?.status
        ? `Inbox API returned ${error.status}.`
        : "Inbox API is unavailable.")
    );
  }
}
