import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { IndustryPacksService } from './industry-packs.service';
import { PageHeader } from '../../shared/ui';

@Component({
  standalone: true,
  imports: [CommonModule, PageHeader],
  template: `
    <qai-page-header title="Industry Playbooks" subtitle="Choose the vocabulary, qualification guidance and workflow starting point for your market."></qai-page-header>
    <section class="product-journey">
      <header><div><span class="section-kicker">Template only</span><h2>Playbooks do not add business data</h2><p>Enabling a playbook never creates prospects, contacts, campaigns, email messages or demo records. Use <strong>Prepare real workspace</strong> to import verified companies, or <strong>Load presentation demo</strong> when you need safe sample data.</p></div></header>
    </section>
    <div class="pack-grid">
      <article *ngFor="let pack of packs">
        <i>✦</i><span class="section-kicker">INDUSTRY TEMPLATE</span><h3>{{ pack.name }}</h3>
        <p>{{ pack.description || 'A reusable starting point for qualification language, workflows and team guidance.' }}</p>
        <div class="pack-includes"><span>ICP guidance</span><span>Workflow template</span><span>Message framework</span><span>Knowledge outline</span></div>
        <button class="primary" (click)="enable(pack)">Enable playbook</button>
      </article>
    </div>
  `
})
export class IndustryPacksPage implements OnInit {
  packs: any[] = [];
  constructor(private readonly data: IndustryPacksService) {}
  ngOnInit(): void { this.data.list<any[]>().subscribe({ next: packs => this.packs = packs || [], error: () => alert('Industry playbooks could not be loaded.') }); }
  enable(pack: any): void {
    this.data.install<any>(pack.id).subscribe({
      next: () => alert(`${pack.name} is enabled. No prospects, contacts or campaigns were created.`),
      error: error => alert(error?.error?.detail || 'The playbook could not be enabled.')
    });
  }
}
