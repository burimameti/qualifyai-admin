import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Modal, PageHeader } from '../../shared/ui';
import { AcquisitionService } from './acquisition.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  templateUrl: './campaigns.page.html',
  styleUrl: './campaigns.page.css'
})
export class CampaignsPage implements OnInit {
  rows: any[] = [];
  lists: any[] = [];
  messages: any[] = [];
  show = false;
  builderStep = 1;
  busy = false;
  message = '';
  error = '';
  form: any = this.emptyForm();

  constructor(
    private readonly data: AcquisitionService,
    private readonly route: ActivatedRoute
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
  get canContinue(): boolean {
    if (this.builderStep === 1) return Boolean(this.form.targetListId && this.form.name.trim());
    if (this.builderStep === 2)
      return Boolean(this.form.senderName.trim() && this.form.senderEmail.includes('@'));
    return this.form.steps.every((x: any) => x.subjectTemplate.trim() && x.bodyTemplate.trim());
  }

  load(): void {
    this.data.campaigns().subscribe((r) => (this.rows = r));
    this.data.targetLists().subscribe((r) => {
      this.lists = r;
      const targetListId = this.route.snapshot.queryParamMap.get('targetListId');
      if (targetListId && r.some((x) => x.id === targetListId)) {
        this.form.targetListId = targetListId;
        this.show = true;
      }
    });
    this.data.messages().subscribe((r) => (this.messages = r));
  }
  openBuilder(): void {
    this.form = this.emptyForm();
    this.builderStep = 1;
    this.error = '';
    this.show = true;
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
          'Campaign created as draft. Review it, then start to queue approval-controlled messages.';
      },
      error: (error) => {
        this.busy = false;
        this.error = error?.error?.detail || 'Campaign could not be created.';
      }
    });
  }
  start(campaign: any): void {
    this.data.startCampaign(campaign.id).subscribe({
      next: (result) => {
        campaign.status = result.status;
        this.load();
        this.message = `${result.recipients} recipients enrolled; ${result.queued} first messages await approval.`;
      },
      error: (error) => (this.error = error?.error?.detail || 'Campaign could not start.')
    });
  }
  requestApproval(message: any): void {
    this.data.requestApproval(message.id).subscribe(() => (message.approvalRequested = true));
  }
  approveAndSend(message: any): void {
    this.data.approveAndSend(message.id).subscribe({
      next: (result) => {
        this.load();
        this.message = `Email accepted by provider: ${result.providerMessageId}`;
      },
      error: (error) => (this.error = error?.error?.detail || 'Email could not be sent.')
    });
  }
  status(value: number): string {
    return ['Draft', 'Scheduled', 'Running', 'Paused', 'Completed'][value] || String(value);
  }
  messageStatus(value: number): string {
    return ['Queued', 'Sent', 'Delivered', 'Replied', 'Failed', 'Suppressed'][value] || String(value);
  }
  private emptyForm(): any {
    return {
      name: 'European logistics growth',
      targetListId: '',
      goal: 'book-demo',
      senderName: 'Sales team',
      senderEmail: 'sales@company.com',
      startsAtUtc: null,
      steps: [
        {
          stepNumber: 1,
          delayHours: 0,
          channel: 'email',
          subjectTemplate: 'A question about {{company}} logistics',
          bodyTemplate:
            'Hi {{contact}}, I noticed {{company}} is growing in {{country}}. Are freight capacity or delivery reliability priorities this quarter?'
        },
        {
          stepNumber: 2,
          delayHours: 72,
          channel: 'email',
          subjectTemplate: 'Freight planning for {{company}}',
          bodyTemplate:
            'Following up with a short example of how similar {{industry}} companies reduced manual quoting and delivery exceptions.'
        },
        {
          stepNumber: 3,
          delayHours: 96,
          channel: 'email',
          subjectTemplate: 'Should I close this?',
          bodyTemplate:
            'If logistics improvement is not a priority now, I will close this. If it is, I can arrange a focused 20-minute demo.'
        }
      ]
    };
  }
}
