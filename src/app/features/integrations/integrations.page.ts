import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Callout, Modal, PageHeader, WizardSteps } from "../../shared/ui";
import { IntegrationsService } from "./integrations.service";
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader, WizardSteps, Callout],
  template: `<qai-page-header
      title="Integrations"
      subtitle="Connect CRM, calendar, messaging and operational systems."
      ><button (click)="load()">↻ Refresh</button></qai-page-header
    >
    <section class="product-journey">
      <header>
        <div>
          <span class="section-kicker">Outbound readiness</span>
          <h2>Connect and verify the channel before launch</h2>
          <p>
            The campaign cannot send until a provider is configured, the sender
            is verified and suppression rules are active.
          </p>
        </div>
      </header>
      <qai-wizard-steps
        [steps]="[
          'Choose provider',
          'Add sender',
          'Verify identity',
          'Ready to send',
        ]"
        [descriptions]="[
          'Brevo, SendGrid or SMTP',
          'Name and email',
          'Provider confirmation',
          'Approval still required',
        ]"
        [current]="senderStep"
      />
    </section>
    <div class="grid2">
      <section class="panel">
        <header>
          <div>
            <b>Verified email senders</b
            ><span>Required before any outreach can leave the platform</span>
          </div>
        </header>
        <div class="gap" *ngFor="let s of senders">
          <div>
            <b>{{ s.name }}</b
            ><span
              >{{ s.provider | uppercase }} ·
              {{ s.status === 1 ? "Verified" : "Verification required" }}</span
            >
          </div>
          <div class="actions" *ngIf="s.status !== 1">
            <button *ngIf="s.provider !== 'brevo'" (click)="sendVerification(s)">Resend code</button>
            <button (click)="verify(s)">
              {{ s.provider === "brevo" ? "Check verification" : "Enter code" }}
            </button>
          </div>
        </div>
        <form class="form" (ngSubmit)="addSender()">
          <h4 class="section-title">Add a sending identity</h4>
          <p class="section-copy">
            Recipients see this name and address. Use a real mailbox on your
            company domain.
          </p>
          <div class="form2">
            <label
              >From name<input
                [(ngModel)]="sender.name"
                name="senderName"
              /><small class="field-help"
                >Example: Burim from FusionFleet</small
              ></label
            ><label
              >From email<input
                type="email"
                [(ngModel)]="sender.email"
                name="senderEmail"
                required
              /><small class="field-help"
                >Must be verified by the selected provider.</small
              ></label
            >
          </div>
          <label
            >Provider<select
              [(ngModel)]="sender.provider"
              name="senderProvider"
            >
              <option value="brevo">Brevo (recommended)</option>
              <option>smtp</option>
              <option>sendgrid</option>
            </select></label
          ><qai-callout
            *ngIf="sender.provider === 'brevo'"
            icon="i"
            title="Brevo verification"
            text="QualifyAI checks Brevo for this sender. If Brevo API access is IP-restricted, use SMTP credentials instead."
          /><button
            class="primary"
            type="submit"
            [disabled]="!sender.name.trim() || !sender.email.trim()"
          >
            Configure sender
          </button>
        </form>
      </section>
      <section class="panel">
        <header>
          <div>
            <b>Suppression list</b
            ><span>Prevent outreach to opted-out recipients</span>
          </div>
        </header>
        <form class="form" (ngSubmit)="suppress()">
          <label
            >Email<input
              type="email"
              [(ngModel)]="suppression.email"
              name="suppressEmail"
              required /></label
          ><label
            >Reason<input
              [(ngModel)]="suppression.reason"
              name="reason" /></label
          ><button type="submit">Add suppression</button>
        </form>
      </section>
    </div>
    <div class="integration-grid">
      <article *ngFor="let p of providers">
        <i>{{ logo(p) }}</i>
        <div>
          <b>{{ p }}</b
          ><span>{{ desc(p) }}</span>
        </div>
        <span class="pill success" *ngIf="connection(p)">Configured</span
        ><button (click)="open(p)">
          {{ connection(p) ? "Configure" : "Connect" }}</button
        ><button *ngIf="connection(p)" (click)="test(connection(p))">
          Test
        </button>
      </article>
    </div>
    <qai-modal
      [open]="show"
      [title]="provider + ' integration'"
      (close)="show = false"
      ><form class="form" (ngSubmit)="save()">
        <h4 class="section-title">Connect {{ provider }}</h4>
        <p class="section-copy">
          Give the connection a clear workspace name. Credentials are stored
          separately from visible configuration.
        </p>
        <label
          >Connection name<input
            [(ngModel)]="form.name"
            name="name"
            placeholder="{{ provider }} – Production"
          /><small class="field-help"
            >Helps administrators identify the correct account later.</small
          ></label
        ><qai-callout
          icon="i"
          title="Provider authorization"
          text="A provider-specific OAuth or credential screen belongs here. Until that adapter is available, only administrators should use advanced configuration."
        /><button type="button" class="link" (click)="advanced = !advanced">
          {{ advanced ? "Hide" : "Show" }} advanced configuration</button
        ><label *ngIf="advanced"
          >Configuration JSON<textarea
            class="large"
            [(ngModel)]="form.settingsJson"
            name="settings"
          ></textarea
          ><small class="field-help"
            >Administrator-only adapter settings. Secrets must not be pasted
            here.</small
          ></label
        >
        <footer>
          <button type="button" (click)="show = false">Cancel</button
          ><button class="primary" type="submit">Save connection</button>
        </footer>
      </form></qai-modal
    >`,
})
export class IntegrationsPage implements OnInit {
  providers: string[] = [
    "HubSpot",
    "Salesforce",
    "Pipedrive",
    "Slack",
    "Microsoft Teams",
    "Google Calendar",
    "Microsoft 365",
    "Generic Webhook",
  ];
  connections: any[] = [];
  senders: any[] = [];
  sender: any = { name: "Sales team", email: "", provider: "brevo" };
  suppression: any = { email: "", reason: "manual-suppression" };
  show = false;
  advanced = false;
  provider = "";
  form: any = {};
  constructor(private data: IntegrationsService) {}
  ngOnInit() {
    this.load();
  }
  load() {
    this.data.list().subscribe((r) => (this.connections = r));
    this.data.senders().subscribe((r) => (this.senders = r));
    this.data.providers().subscribe({
      next: (r) => {
        if (r?.length)
          this.providers = r.map((x: any) =>
            typeof x === "string" ? x : x.name || x.provider,
          );
      },
      error: () => {},
    });
  }
  addSender() {
    this.data.configureSender(this.sender).subscribe({
      next: (r) => {
        this.load();
        alert(r.instruction || "Sender configured.");
      },
      error: (e) => alert(e?.error?.detail || "Sender configuration failed."),
    });
  }
  verify(s: any) {
    const token = s.provider === "brevo" ? null : prompt("Enter the code received in the sender mailbox");
    if (s.provider !== "brevo" && !token) return;
    this.data.verifySender(s.id, token).subscribe({
      next: () => this.load(),
      error: (e) => alert(e?.error?.detail || "Verification failed."),
    });
  }
  sendVerification(s: any) {
    this.data.sendVerification(s.id).subscribe({
      next: () => alert("Verification code sent to the sender mailbox."),
      error: (e) => alert(e?.error?.detail || "Could not send the verification code."),
    });
  }
  suppress() {
    this.data
      .suppress(this.suppression.email, this.suppression.reason)
      .subscribe(() => {
        alert("Recipient suppressed.");
        this.suppression.email = "";
      });
  }
  connection(p: string) {
    return this.connections.find(
      (x) => String(x.provider).toLowerCase() === p.toLowerCase(),
    );
  }
  open(p: string) {
    this.provider = p;
    const c = this.connection(p);
    this.form = c
      ? { ...c }
      : {
          provider: p,
          name: p + " connection",
          status: 1,
          settingsJson: "{}",
          secretReference: "",
        };
    this.advanced = false;
    this.show = true;
  }
  get senderStep() {
    if (!this.senders.length) return 1;
    if (!this.senders.some((s) => s.status === 1)) return 2;
    return 3;
  }
  save() {
    const op = this.form.id
      ? this.data.update(this.form.id, this.form)
      : this.data.create(this.form);
    op.subscribe((r) => {
      const i = this.connections.findIndex((x) => x.id === r.id);
      i >= 0 ? (this.connections[i] = r) : this.connections.push(r);
      this.show = false;
    });
  }
  test(c: any) {
    this.data.test(c.id).subscribe({
      next: (r) =>
        alert(`${c.provider}: ${r.success ? "connection OK" : "test failed"}`),
      error: () => alert("Integration test failed."),
    });
  }
  logo(p: string) {
    return p
      .split(" ")
      .map((x) => x[0])
      .join("")
      .slice(0, 2);
  }
  desc(p: string) {
    return p.includes("Calendar")
      ? "Book meetings automatically"
      : p === "Slack" || p.includes("Teams")
        ? "Notify sales and support teams"
        : p.includes("Webhook")
          ? "Connect any external API"
          : "Sync contacts, leads and opportunities";
  }
}
