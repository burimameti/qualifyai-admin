import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
export const routes: Routes = [
 { path: '', pathMatch:'full', loadComponent:()=>import('./features/landing/landing.page').then(m=>m.LandingPage) },
 { path: 'login', loadComponent:()=>import('./features/auth/login.page').then(m=>m.LoginPage) },
 { path: '', canActivate:[authGuard], loadComponent:()=>import('./layout/shell.component').then(m=>m.ShellComponent), children:[
  {path:'dashboard',loadComponent:()=>import('./features/dashboard/dashboard.page').then(m=>m.DashboardPage)},
  {path:'discover',loadComponent:()=>import('./features/acquisition/discover.page').then(m=>m.DiscoverPage)},
  {path:'campaigns',loadComponent:()=>import('./features/acquisition/campaigns.page').then(m=>m.CampaignsPage)},
  {path:'inbox',loadComponent:()=>import('./features/inbox/inbox.page').then(m=>m.InboxPage)},
  {path:'tickets',loadComponent:()=>import('./features/tickets/tickets.page').then(m=>m.TicketsPage)},
  {path:'crm/contacts',loadComponent:()=>import('./features/crm/contacts.page').then(m=>m.ContactsPage)},
  {path:'crm/companies',loadComponent:()=>import('./features/crm/companies.page').then(m=>m.CompaniesPage)},
  {path:'crm/leads',loadComponent:()=>import('./features/crm/leads.page').then(m=>m.LeadsPage)},
  {path:'crm/opportunities',loadComponent:()=>import('./features/crm/opportunities.page').then(m=>m.OpportunitiesPage)},
  {path:'pipeline',loadComponent:()=>import('./features/pipeline/pipeline.page').then(m=>m.PipelinePage)},
  {path:'meetings',loadComponent:()=>import('./features/meetings/meetings.page').then(m=>m.MeetingsPage)},
  {path:'ai/agents',loadComponent:()=>import('./features/ai-agents/ai-agents.page').then(m=>m.AiAgentsPage)},
  {path:'knowledge',loadComponent:()=>import('./features/knowledge/knowledge.page').then(m=>m.KnowledgePage)},
  {path:'knowledge/gaps',loadComponent:()=>import('./features/knowledge-gaps/knowledge-gaps.page').then(m=>m.KnowledgeGapsPage)},
  {path:'workflows',loadComponent:()=>import('./features/workflows/workflows.page').then(m=>m.WorkflowsPage)},
  {path:'automations',loadComponent:()=>import('./features/automations/automations.page').then(m=>m.AutomationsPage)},
  {path:'evaluations',loadComponent:()=>import('./features/evaluations/evaluations.page').then(m=>m.EvaluationsPage)},
  {path:'integrations',loadComponent:()=>import('./features/integrations/integrations.page').then(m=>m.IntegrationsPage)},
  {path:'analytics',loadComponent:()=>import('./features/analytics/analytics.page').then(m=>m.AnalyticsPage)},
  {path:'billing',loadComponent:()=>import('./features/billing/billing.page').then(m=>m.BillingPage)},
  {path:'admin/modules',loadComponent:()=>import('./features/module-admin/module-admin.page').then(m=>m.ModuleAdminPage)},
  {path:'users',loadComponent:()=>import('./features/users/users.page').then(m=>m.UsersPage)},
  {path:'security',loadComponent:()=>import('./features/security/security.page').then(m=>m.SecurityPage)},
  {path:'white-label',loadComponent:()=>import('./features/white-label/white-label.page').then(m=>m.WhiteLabelPage)},
  {path:'industry-packs',loadComponent:()=>import('./features/industry-packs/industry-packs.page').then(m=>m.IndustryPacksPage)},
  {path:'audit',loadComponent:()=>import('./features/audit/audit.page').then(m=>m.AuditPage)},
  {path:'',pathMatch:'full',redirectTo:'dashboard'}
 ]},
 { path: '**', redirectTo: '' }
];
