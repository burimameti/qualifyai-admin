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

  installDemo(): void {
    this.installing = true;
    this.error = '';
    this.dashboard.installDemo().subscribe({
      next: () => {
        this.installing = false;
        this.refresh();
      },
      error: (response) => {
        this.installing = false;
        this.error =
          response?.error?.detail || response?.error?.title || 'Demo scenario could not be installed.';
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
