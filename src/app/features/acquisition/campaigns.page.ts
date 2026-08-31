import { CommonModule } from "@angular/common";
import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { Modal, PageHeader } from "../../shared/ui";
import { AcquisitionService } from "./acquisition.service";

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  templateUrl: "./campaigns.page.html",
  styleUrl: "./campaigns.page.css",
})
export class CampaignsPage implements OnInit {
  @ViewChild("approvalQueue") approvalQueue?: ElementRef<HTMLElement>;
  rows: any[] = [];
  lists: any[] = [];
  messages: any[] = [];
  selectedCampaign: any = null;
  activity: any[] = [];
  loading = false;
  show = false;
  builderStep = 1;
  busy = false;
  message = "";
  error = "";
  guardrailOpen = false;
  selectedGuardrail: any;
  readonly guardrails = [
    { number: 1, title: "Verified sender", summary: "Mailbox/domain ownership required", detail: "Only a verified mailbox and domain can be used as the sender for a live campaign.", result: "Prevents spoofed or incorrectly configured sender identities.", action: "Manage senders", route: "/integrations" },
    { number: 2, title: "Suppression check", summary: "Opt-outs never receive outreach", detail: "Every recipient is checked against the tenant suppression list before a message is queued.", result: "Protects unsubscribed contacts and preserves sender reputation.", action: "View suppression list", route: "/integrations" },
    { number: 3, title: "Human approval", summary: "Review before each real send", detail: "A campaign can prepare a message, but it cannot leave the platform until a person approves it.", result: "Keeps message quality and launch decisions under human control.", action: "Open approval queue", target: "approval" },
    { number: 4, title: "Stop on reply", summary: "Sequence pauses automatically", detail: "As soon as a recipient replies, the remaining scheduled follow-ups are stopped automatically.", result: "Prevents awkward follow-ups after a real conversation has started.", action: "Open inbox", route: "/inbox" },
  ];
  form: any = this.emptyForm();

  constructor(
    private readonly data: AcquisitionService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    this.load();
  }
  get running(): number {
    return this.rows.filter((x) => x.status === 2).length;
  }
  get selectedList(): any {
    return this.lists.find((x) => x.id === this.form.targetListId);
  }
  get pendingMessages(): number {
    return this.messages.filter((x) => x.status === 0).length;
  }
  get canContinue(): boolean {
    if (this.builderStep === 1)
      return Boolean(this.form.targetListId && this.form.name.trim());
    if (this.builderStep === 2)
      return Boolean(
        this.form.senderName.trim() && this.form.senderEmail.includes("@"),
      );
    return this.form.steps.every(
      (x: any) => x.subjectTemplate.trim() && x.bodyTemplate.trim(),
    );
  }

  load(): void {
    this.loading = true;
    this.error = "";
    this.data.campaigns().subscribe({
      next: (r) => {
        this.rows = r || [];
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.error = this.apiError(e, "Campaigns could not be loaded.");
      },
    });
    this.data.targetLists().subscribe({
      next: (r) => {
        this.lists = r;
        const targetListId =
          this.route.snapshot.queryParamMap.get("targetListId");
        if (targetListId && r.some((x) => x.id === targetListId)) {
          this.form.targetListId = targetListId;
          this.show = true;
        }
      },
      error: (e) =>
        (this.error = this.apiError(e, "Target lists could not be loaded.")),
    });
    this.data.messages().subscribe({
      next: (r) => (this.messages = r || []),
      error: (e) =>
        (this.error = this.apiError(e, "Approval queue could not be loaded.")),
    });
  }
  openBuilder(): void {
    this.form = this.emptyForm();
    this.builderStep = 1;
    this.error = "";
    this.show = true;
  }
  openPipelineStep(step: number): void {
    this.form = this.emptyForm();
    this.builderStep = step;
    this.error = "";
    this.show = true;
  }
  showApprovalQueue(): void {
    this.approvalQueue?.nativeElement.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  openDemos(): void {
    void this.router.navigate(["/meetings"]);
  }
  openGuardrail(guardrail: any): void {
    this.selectedGuardrail = guardrail;
    this.guardrailOpen = true;
  }
  openGuardrailAction(): void {
    const guardrail = this.selectedGuardrail;
    this.guardrailOpen = false;
    if (guardrail?.target === "approval") {
      setTimeout(() => this.showApprovalQueue());
      return;
    }
    if (guardrail?.route) void this.router.navigate([guardrail.route]);
  }
  next(): void {
    if (this.canContinue && this.builderStep < 4) this.builderStep++;
  }
  back(): void {
    if (this.builderStep > 1) this.builderStep--;
  }
  save(): void {
    if (!this.canContinue) return;
    this.busy = true;
    this.data.createCampaign(this.form).subscribe({
      next: (campaign) => {
        this.busy = false;
        this.rows.unshift(campaign);
        this.show = false;
        this.message =
          "Campaign created as draft. Review it, then start to queue approval-controlled messages.";
      },
      error: (error) => {
        this.busy = false;
        this.error = error?.error?.detail || "Campaign could not be created.";
      },
    });
  }
  start(campaign: any): void {
    this.data.startCampaign(campaign.id).subscribe({
      next: (result) => {
        campaign.status = result.status;
        this.load();
        this.message = `${result.recipients} recipients enrolled; ${result.queued} first messages await approval.`;
      },
      error: (error) =>
        (this.error = error?.error?.detail || "Campaign could not start."),
    });
  }
  requestApproval(message: any): void {
    this.data.requestApproval(message.id).subscribe({
      next: () => {
        message.approvalRequested = true;
        this.message = "Approval task created.";
      },
      error: (e) =>
        (this.error = this.apiError(e, "Approval could not be requested.")),
    });
  }
  approveAndSend(message: any): void {
    this.data.approveAndSend(message.id).subscribe({
      next: (result) => {
        this.load();
        this.message = `Email accepted by provider: ${result.providerMessageId}`;
      },
      error: (error) =>
        (this.error = error?.error?.detail || "Email could not be sent."),
    });
  }
  retryMessage(message: any): void {
    this.data.retryMessage(message.id).subscribe({
      next: (result) => {
        this.load();
        this.message = `Retry accepted by provider: ${result.providerMessageId}`;
      },
      error: (error) =>
        (this.error = this.apiError(error, "Email retry failed.")),
    });
  }
  status(value: number): string {
    return (
      ["Draft", "Scheduled", "Running", "Paused", "Completed"][value] ||
      String(value)
    );
  }
  messageStatus(value: number): string {
    return (
      ["Queued", "Sent", "Delivered", "Replied", "Failed", "Suppressed"][
        value
      ] || String(value)
    );
  }
  inspect(campaign: any): void {
    this.selectedCampaign = campaign;
    this.activity = [];
    this.data.campaignActivity(campaign.id).subscribe({
      next: (rows) => (this.activity = rows || []),
      error: (e) =>
        (this.error = this.apiError(
          e,
          "Campaign activity could not be loaded.",
        )),
    });
  }
  private apiError(error: any, fallback: string): string {
    return (
      error?.error?.detail ||
      error?.error?.error ||
      (error?.status ? `${fallback} API returned ${error.status}.` : fallback)
    );
  }
  private emptyForm(): any {
    return {
      name: "European logistics growth",
      targetListId: "",
      goal: "book-demo",
      senderName: "Sales team",
      senderEmail: "sales@company.com",
      startsAtUtc: null,
      steps: [
        {
          stepNumber: 1,
          delayHours: 0,
          channel: "email",
          subjectTemplate: "A question about {{company}} logistics",
          bodyTemplate:
            "Hi {{contact}}, I noticed {{company}} is growing in {{country}}. Are freight capacity or delivery reliability priorities this quarter?",
        },
        {
          stepNumber: 2,
          delayHours: 72,
          channel: "email",
          subjectTemplate: "Freight planning for {{company}}",
          bodyTemplate:
            "Following up with a short example of how similar {{industry}} companies reduced manual quoting and delivery exceptions.",
        },
        {
          stepNumber: 3,
          delayHours: 96,
          channel: "email",
          subjectTemplate: "Should I close this?",
          bodyTemplate:
            "If logistics improvement is not a priority now, I will close this. If it is, I can arrange a focused 20-minute demo.",
        },
      ],
    };
  }
}
