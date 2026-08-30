import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { Callout, Empty, PageHeader } from "../../shared/ui";
import { BillingService } from "./billing.service";

@Component({
  standalone: true,
  imports: [CommonModule, PageHeader, Callout, Empty],
  template: ` <qai-page-header
      title="Subscription & usage"
      subtitle="See exactly what your workspace includes, how much you use and when the next billing period starts."
      ><button (click)="load()">↻ Refresh</button></qai-page-header
    >
    <section class="subscription-hero">
      <div>
        <span class="section-kicker">Current subscription</span>
        <h2>{{ currentPlanName }}</h2>
        <p>{{ statusLabel }} · {{ renewalLabel }}</p>
      </div>
      <div class="subscription-price">
        <strong>{{ money(currentPlan?.monthlyPrice) }}</strong
        ><span>per workspace / month</span>
      </div>
    </section>
    <div class="grid2">
      <section class="panel">
        <header>
          <div><b>Plan usage</b><span>Current billing period</span></div>
        </header>
        <div class="usage-meter" *ngFor="let item of usage">
          <header>
            <b>{{ meterName(item.meter) }}</b
            ><span>{{ item.quantity | number }} used</span>
          </header>
          <i><span [style.--usage]="usageWidth(item.quantity)"></span></i>
        </div>
        <qai-empty
          *ngIf="!usage.length"
          title="No metered usage yet"
          text="Usage appears here when contacts, messages or automation runs are recorded."
        />
      </section>
      <section class="panel">
        <header>
          <div>
            <b>Subscription details</b><span>Workspace access and renewal</span>
          </div>
        </header>
        <div class="gap">
          <div><b>Status</b><span>Access to paid modules</span></div>
          <span class="pill success">{{ statusLabel }}</span>
        </div>
        <div class="gap">
          <div>
            <b>Billing period</b><span>Next renewal or service end</span>
          </div>
          <b>{{ subscription?.currentPeriodEndUtc | date: "mediumDate" }}</b>
        </div>
        <div class="gap">
          <div><b>Plan code</b><span>Used by license administration</span></div>
          <b>{{
            subscription?.planCode ||
              subscription?.plan ||
              currentPlan?.code ||
              "—"
          }}</b>
        </div>
        <qai-callout
          icon="i"
          title="Need to change a plan?"
          text="Plan changes are controlled by your master administrator so modules and limits always match the signed subscription."
        />
      </section>
    </div>
    <section class="panel" style="margin-bottom:16px">
      <header>
        <div>
          <b>Compare plans</b
          ><span>Clear capabilities before a tenant is upgraded</span>
        </div>
      </header>
      <div class="plan-grid">
        <article
          class="plan-card"
          *ngFor="let plan of plans"
          [class.featured]="isCurrent(plan)"
        >
          <span class="pill" [class.success]="isCurrent(plan)">{{
            isCurrent(plan) ? "Current plan" : plan.code
          }}</span>
          <h3>{{ plan.name }}</h3>
          <p class="section-copy">{{ planDescription(plan.code) }}</p>
          <div class="price">
            {{ money(plan.monthlyPrice) }} <small>/ month</small>
          </div>
          <ul>
            <li *ngFor="let feature of planFeatures(plan)">{{ feature }}</li>
          </ul>
          <button
            [class.primary]="isCurrent(plan)"
            [disabled]="isCurrent(plan)"
          >
            {{
              isCurrent(plan)
                ? "Active on this workspace"
                : "Contact administrator"
            }}
          </button>
        </article>
      </div>
      <qai-empty
        *ngIf="!plans.length"
        title="Plans are not configured"
        text="Create plan definitions in master administration before presenting subscriptions to tenants."
      />
    </section>
    <section class="panel table-wrap">
      <header>
        <div>
          <b>Invoices</b><span>Billing documents for this workspace</span>
        </div>
      </header>
      <table *ngIf="invoices.length">
        <thead>
          <tr>
            <th>Invoice</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Due date</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let invoice of invoices">
            <td>
              <b>{{ invoice.number }}</b>
            </td>
            <td>{{ money(invoice.amount) }}</td>
            <td>
              <span class="pill">{{ invoice.status }}</span>
            </td>
            <td>{{ invoice.dueAtUtc | date: "mediumDate" }}</td>
          </tr>
        </tbody>
      </table>
      <qai-empty
        *ngIf="!invoices.length"
        title="No invoices yet"
        text="Issued invoices will be available here for finance teams."
      />
    </section>`,
})
export class BillingPage implements OnInit {
  plans: any[] = [];
  usage: any[] = [];
  subscription: any;
  invoices: any[] = [];
  constructor(private data: BillingService) {}
  ngOnInit() {
    this.load();
  }
  load() {
    this.data.plans().subscribe((r) => (this.plans = r || []));
    this.data.usage().subscribe((r) => (this.usage = r || []));
    this.data.subscription().subscribe((r) => (this.subscription = r));
    this.data.invoices().subscribe((r) => (this.invoices = r || []));
  }
  get currentPlan() {
    const code = String(
      this.subscription?.planCode || this.subscription?.plan || "",
    ).toLowerCase();
    return this.plans.find((p) => String(p.code).toLowerCase() === code);
  }
  get currentPlanName() {
    return (
      this.currentPlan?.name ||
      this.subscription?.planName ||
      this.subscription?.plan ||
      "Workspace plan"
    );
  }
  get statusLabel() {
    const v = this.subscription?.status;
    return v === 1 || String(v).toLowerCase() === "active"
      ? "Active"
      : v || "Not activated";
  }
  get renewalLabel() {
    return this.subscription?.currentPeriodEndUtc
      ? `Renews ${new Date(this.subscription.currentPeriodEndUtc).toLocaleDateString()}`
      : "Renewal date not set";
  }
  isCurrent(p: any) {
    return p === this.currentPlan;
  }
  money(v: number) {
    return new Intl.NumberFormat("en-IE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(v || 0);
  }
  usageWidth(v: number) {
    return `${Math.max(4, Math.min(100, Number(v || 0)))}%`;
  }
  meterName(v: string) {
    return String(v || "Usage")
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  planDescription(code: string) {
    const v = String(code || "").toLowerCase();
    return v.includes("enterprise")
      ? "Advanced governance and the complete automation platform."
      : v.includes("pro") || v.includes("growth")
        ? "For teams running repeatable acquisition and service workflows."
        : "Start with core prospecting, contacts and controlled outreach.";
  }
  planFeatures(p: any): string[] {
    const m = Array.isArray(p.modules)
      ? p.modules.map((x: any) =>
          typeof x === "string" ? x : x.name || x.code,
        )
      : [];
    return m.length
      ? m.slice(0, 6).map((x: string) => this.meterName(x))
      : [
          "Prospect and contact management",
          "Approval-controlled campaigns",
          "Workspace usage reporting",
        ];
  }
}
