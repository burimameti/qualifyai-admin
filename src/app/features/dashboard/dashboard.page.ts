import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { PageHeader } from '../../shared/ui';
import { DashboardService } from './dashboard.service';

interface DashboardOpportunity {
  company: string;
  country: string;
  intent: string;
  score: number;
  value: number;
}
interface DashboardGap {
  topic: string;
  count: number;
  impact: string;
}
interface DashboardSummary {
  contacts: number;
  leads: number;
  hotLeads: number;
  pipeline: number;
  openConversations: number;
  openTickets: number;
  influencedRevenue: number;
  wonRevenue: number;
  automationActions: number;
  meetingsBooked: number;
  completedRuns: number;
  estimatedHoursSaved: number;
  opportunities: DashboardOpportunity[];
  knowledgeGaps: DashboardGap[];
}

@Component({
  standalone: true,
  imports: [CommonModule, PageHeader],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css'
})
export class DashboardPage implements OnInit {
  summary: Partial<DashboardSummary> = {};
  loaded = false;
  installing = false;
  resetting = false;
  error = '';
  readonly tenantLabel = localStorage.getItem('qai-tenant') || 'current tenant';

  constructor(
    private readonly dashboard: DashboardService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  get hasData(): boolean {
    const d = this.summary;
    return (
      Number(d.contacts || 0) +
        Number(d.leads || 0) +
        Number(d.openConversations || 0) +
        Number(d.openTickets || 0) +
        Number(d.pipeline || 0) >
      0
    );
  }

  get revenueConversion(): number {
    const influenced = Number(this.summary.influencedRevenue || 0);
    const won = Number(this.summary.wonRevenue || 0);

    if (influenced <= 0 || won <= 0) {
      return 0;
    }

    return Math.min(100, Math.round((won / influenced) * 100));
  }

  refresh(): void {
    this.error = '';
    this.dashboard.summary<DashboardSummary>().subscribe({
      next: (response) => {
        this.summary = response;
        this.loaded = true;
      },
      error: (response) => {
        this.loaded = true;
        this.error =
          response?.error?.detail ||
          response?.error?.title ||
          `Dashboard request failed (${response.status || 'network error'}).`;
      }
    });
  }

  loadPresentationDemo(): void {
    if (!confirm('Load the presentation demo for this tenant? This clears current business data, then adds only [PRESENTATION] .example prospects, a sample campaign, demo meeting, workflows and support records. It never sends real email.')) return;
    this.installing = true;
    this.error = '';
    this.dashboard.resetAndInstallDemo().subscribe({
      next: () => {
        this.installing = false;
        this.refresh();
      },
      error: (response) => {
        this.installing = false;
        this.error =
          response?.error?.detail || response?.error?.title || 'Presentation demo could not be loaded.';
      }
    });
  }

  prepareRealWorkspace(): void {
    if (!confirm('Prepare this tenant for real imported data? This removes existing business and presentation records: prospects, lists, CRM, pipelines, meetings, agents, automations and support scenario records. Identity users, licenses and settings remain.')) return;
    this.resetting = true;
    this.error = '';
    this.dashboard.resetDemo().subscribe({
      next: () => {
        this.resetting = false;
        void this.router.navigateByUrl('/acquisition/discover');
      },
      error: (response) => {
        this.resetting = false;
        this.error = response?.error?.detail || response?.error?.title || 'Workspace reset could not be completed.';
      }
    });
  }

  go(path: string): void {
    void this.router.navigateByUrl(path);
  }
  money(value: number | undefined): string {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0
    }).format(value || 0);
  }
}
