import { CommonModule } from "@angular/common";
import { Component, ElementRef, HostListener, ViewChild } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from "@angular/router";
import { AuthService } from "../core/auth.service";

interface NavigationItem {
  group: string;
  label: string;
  url: string;
  icon: string;
  module: string;
  permission: string;
}

@Component({
  selector: "qai-shell",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  styles: [
    `
      .operating-path {
        margin: -4px 0 14px;
        padding: 10px;
        border: 1px solid #263957;
        border-radius: 10px;
        background: linear-gradient(135deg, #101d31, #142743);
      }
      .operating-path span,
      .operating-path small { display: block; color: #8da0bd; font-size: 8px; }
      .operating-path span { font-weight: 800; letter-spacing: .9px; }
      .operating-path b { display: block; color: #fff; font-size: 10px; margin: 5px 0 3px; }
      .operating-path b i { color: #6d94e8; font-style: normal; padding: 0 2px; }
    `,
  ],
  template: `
    <div class="shell">
      <aside>
        <div class="brand">
          <i class="brand-mark">Q</i><span>Qualify</span><strong>AI</strong
          ><small>ENTERPRISE</small>
        </div>
        <div class="workspace">
          <i>{{ initials(workspaceName) }}</i>
          <div>
            <b>{{ workspaceName }}</b
            ><span>{{ session?.licensePlan || "Licensed" }} workspace</span>
          </div>
        </div>
        <div class="operating-path">
          <span>REVENUE OPERATING PATH</span>
          <b>Find <i>→</i> Reach <i>→</i> Convert</b>
          <small>Then automate, learn and improve.</small>
        </div>
        <nav>
          <ng-container *ngFor="let group of visibleGroups"
            ><label>{{ group }}</label
            ><a
              *ngFor="let item of navBy(group)"
              [routerLink]="item.url"
              routerLinkActive="active"
              ><span>{{ item.icon }}</span
              >{{ item.label }}</a
            ></ng-container
          >
        </nav>
        <div class="side-bottom">
          <div class="usage">
            <span>License plan</span><b>{{ session?.licensePlan || "—" }}</b
            ><i><u></u></i>
          </div>
          <button type="button" (click)="toggleAccount()">
            {{ initials(session?.name || session?.email || "User") }}
            <span
              >{{ session?.name || session?.email || "User"
              }}<small>{{ primaryRole }}</small></span
            ><b>•••</b>
          </button>
        </div>
      </aside>

      <main>
        <header class="app-header">
          <div class="header-search-wrap" (click)="$event.stopPropagation()">
            <label class="global-search" [class.active]="headerSearchOpen">
              <span>⌕</span>
              <input
                [(ngModel)]="query"
                (focus)="openSearchFromHeader()"
                (input)="openSearchFromHeader()"
                (keydown.enter)="openFirstSearchResult($event)"
                placeholder="Search pages and modules"
                aria-label="Search pages and modules"
              />
              <kbd>Ctrl K</kbd>
            </label>
            <section class="header-search-results" *ngIf="headerSearchOpen && query.trim()">
              <p>{{ searchResults.length }} matching destinations</p>
              <button type="button" *ngFor="let item of searchResults | slice: 0:6" (click)="go(item.url)">
                <i>{{ item.icon }}</i><span><b>{{ item.label }}</b><small>{{ item.group }}</small></span><em>→</em>
              </button>
              <div *ngIf="!searchResults.length"><b>No matching page</b><span>Try a module or page name.</span></div>
            </section>
          </div>
          <div class="head-actions">
            <button
              type="button"
              class="header-action"
              aria-label="Open customer inbox"
              title="Customer inbox"
              (click)="go('/inbox')"
            >
              <span>▱</span><small>Inbox</small>
            </button>
            <button
              type="button"
              class="header-action"
              aria-label="Open help"
              title="Quick start help"
              [class.active]="helpOpen"
              (click)="toggleHelp()"
            >
              <span>?</span><small>Help</small>
            </button>
            <button
              type="button"
              class="avatar-button"
              aria-label="Open account menu"
              [class.active]="accountOpen"
              (click)="toggleAccount()"
            >
              <span class="avatar">{{
                initials(session?.name || session?.email || "User")
              }}</span
              ><i>⌄</i>
            </button>
          </div>

          <section class="header-popover help-popover" *ngIf="helpOpen">
            <span class="section-kicker">Quick start</span>
            <h3>Move one target account to a qualified opportunity</h3>
            <button type="button" (click)="go('/integrations')">
              <i>1</i
              ><span
                ><b>Connect data and a sender</b
                ><small
                  >Set the source, provider and verified sending identity.</small
                ></span
              ><em>→</em>
            </button>
            <button type="button" (click)="go('/discover')">
              <i>2</i
              ><span
                ><b>Find and qualify prospects</b
                ><small
                  >Define the ICP, import accounts and review evidence.</small
                ></span
              ><em>→</em>
            </button>
            <button type="button" (click)="go('/campaigns')">
              <i>3</i
              ><span
                ><b>Reach with human approval</b
                ><small
                  >Build the campaign, approve messages, then send.</small
                ></span
              ><em>→</em>
            </button>
            <button type="button" (click)="go('/pipeline')">
              <i>4</i
              ><span
                ><b>Convert the reply</b
                ><small
                  >Qualify interest, assign a pipeline stage and book a demo.</small
                ></span
              ><em>→</em>
            </button>
            <footer>
              <button type="button" (click)="go('/workflows')">
                Explore workflow templates
              </button>
            </footer>
          </section>

          <section class="header-popover account-popover" *ngIf="accountOpen">
            <header>
              <span class="avatar large">{{
                initials(session?.name || session?.email || "User")
              }}</span>
              <div>
                <b>{{ session?.name || "Workspace user" }}</b
                ><small>{{ session?.email }}</small>
              </div>
            </header>
            <dl>
              <div>
                <dt>Workspace</dt>
                <dd>{{ workspaceName }}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{{ primaryRole }}</dd>
              </div>
              <div>
                <dt>Plan</dt>
                <dd>{{ session?.licensePlan || "—" }}</dd>
              </div>
            </dl>
            <button type="button" (click)="go('/users')">
              Users & access <span>→</span>
            </button>
            <button type="button" (click)="go('/security')">
              Security settings <span>→</span>
            </button>
            <button type="button" class="logout-action" (click)="logout()">
              Sign out <span>↗</span>
            </button>
          </section>
        </header>
        <section class="page"><router-outlet /></section>
      </main>
    </div>

    <div class="command-backdrop" *ngIf="searchOpen" (click)="closeOverlays()">
      <section class="command-palette" (click)="$event.stopPropagation()">
        <header>
          <span>⌕</span
          ><input
            #searchInput
            [(ngModel)]="query"
            placeholder="Type a page, task or module…"
            aria-label="Search navigation"
          /><kbd>ESC</kbd>
        </header>
        <div class="command-results">
          <p>{{ searchResults.length }} available destinations</p>
          <button
            type="button"
            *ngFor="let item of searchResults"
            (click)="go(item.url)"
          >
            <i>{{ item.icon }}</i
            ><span
              ><b>{{ item.label }}</b
              ><small>{{ item.group }}</small></span
            ><em>↵</em>
          </button>
          <div class="command-empty" *ngIf="!searchResults.length">
            <b>No matching page</b
            ><span>Try “prospect”, “campaign”, “billing” or “workflow”.</span>
          </div>
        </div>
        <footer>
          <span>↑↓ Navigate</span><span>Enter Open</span><span>Esc Close</span>
        </footer>
      </section>
    </div>
  `,
})
export class ShellComponent {
  @ViewChild("searchInput") searchInput?: ElementRef<HTMLInputElement>;
  searchOpen = false;
  headerSearchOpen = false;
  helpOpen = false;
  accountOpen = false;
  query = "";

  readonly groups = [
    "COMMAND CENTER",
    "01 — PREPARE",
    "02 — FIND & REACH",
    "03 — CONVERT",
    "04 — CUSTOMER OPERATIONS",
    "05 — AUTOMATE & IMPROVE",
    "ADMINISTRATION",
  ];
  readonly nav: NavigationItem[] = [
    {
      group: "COMMAND CENTER",
      label: "Dashboard",
      url: "/dashboard",
      icon: "⌂",
      module: "analytics",
      permission: "analytics.read",
    },
    {
      group: "01 — PREPARE",
      label: "Connections & Senders",
      url: "/integrations",
      icon: "↗",
      module: "integrations",
      permission: "integrations.read",
    },
    {
      group: "02 — FIND & REACH",
      label: "Prospect Discovery",
      url: "/discover",
      icon: "⌕",
      module: "crm",
      permission: "crm.read",
    },
    {
      group: "02 — FIND & REACH",
      label: "Campaigns",
      url: "/campaigns",
      icon: "↗",
      module: "crm",
      permission: "crm.read",
    },
    {
      group: "03 — CONVERT",
      label: "Qualified Leads",
      url: "/crm/leads",
      icon: "◆",
      module: "crm",
      permission: "crm.read",
    },
    {
      group: "03 — CONVERT",
      label: "Opportunities",
      url: "/crm/opportunities",
      icon: "◈",
      module: "crm",
      permission: "crm.read",
    },
    {
      group: "03 — CONVERT",
      label: "Sales Pipelines",
      url: "/pipeline",
      icon: "▤",
      module: "crm",
      permission: "crm.read",
    },
    {
      group: "03 — CONVERT",
      label: "Demos & Meetings",
      url: "/meetings",
      icon: "◷",
      module: "crm",
      permission: "crm.read",
    },
    {
      group: "02 — FIND & REACH",
      label: "Replies & Inbox",
      url: "/inbox",
      icon: "▱",
      module: "inbox",
      permission: "conversations.read",
    },
    {
      group: "04 — CUSTOMER OPERATIONS",
      label: "Companies",
      url: "/crm/companies",
      icon: "▦",
      module: "crm",
      permission: "crm.read",
    },
    {
      group: "04 — CUSTOMER OPERATIONS",
      label: "Contacts",
      url: "/crm/contacts",
      icon: "◎",
      module: "crm",
      permission: "crm.read",
    },
    {
      group: "04 — CUSTOMER OPERATIONS",
      label: "Issues & Tickets",
      url: "/tickets",
      icon: "▣",
      module: "ticketing",
      permission: "tickets.read",
    },
    {
      group: "05 — AUTOMATE & IMPROVE",
      label: "Business Assistants",
      url: "/ai/agents",
      icon: "✦",
      module: "ai",
      permission: "agents.read",
    },
    {
      group: "05 — AUTOMATE & IMPROVE",
      label: "Knowledge",
      url: "/knowledge",
      icon: "▥",
      module: "knowledge",
      permission: "knowledge.read",
    },
    {
      group: "05 — AUTOMATE & IMPROVE",
      label: "Knowledge Improvements",
      url: "/knowledge/gaps",
      icon: "△",
      module: "knowledge",
      permission: "knowledge.read",
    },
    {
      group: "05 — AUTOMATE & IMPROVE",
      label: "Workflows",
      url: "/workflows",
      icon: "⌁",
      module: "automation",
      permission: "automation.read",
    },
    {
      group: "05 — AUTOMATE & IMPROVE",
      label: "Automations",
      url: "/automations",
      icon: "⚡",
      module: "automation",
      permission: "automation.read",
    },
    {
      group: "05 — AUTOMATE & IMPROVE",
      label: "Evaluations",
      url: "/evaluations",
      icon: "✓",
      module: "ai",
      permission: "agents.read",
    },
    {
      group: "05 — AUTOMATE & IMPROVE",
      label: "Analytics & ROI",
      url: "/analytics",
      icon: "▥",
      module: "analytics",
      permission: "analytics.read",
    },
    {
      group: "ADMINISTRATION",
      label: "Billing & Usage",
      url: "/billing",
      icon: "€",
      module: "billing",
      permission: "billing.read",
    },
    {
      group: "ADMINISTRATION",
      label: "Modules & Features",
      url: "/admin/modules",
      icon: "◫",
      module: "settings",
      permission: "billing.manage",
    },
    {
      group: "ADMINISTRATION",
      label: "Users & Access",
      url: "/users",
      icon: "♙",
      module: "settings",
      permission: "users.read",
    },
    {
      group: "ADMINISTRATION",
      label: "Security",
      url: "/security",
      icon: "◇",
      module: "settings",
      permission: "settings.manage",
    },
    {
      group: "ADMINISTRATION",
      label: "White Label",
      url: "/white-label",
      icon: "◐",
      module: "settings",
      permission: "settings.manage",
    },
    {
      group: "ADMINISTRATION",
      label: "Industry Packs",
      url: "/industry-packs",
      icon: "▦",
      module: "settings",
      permission: "settings.manage",
    },
    {
      group: "ADMINISTRATION",
      label: "Audit Log",
      url: "/audit",
      icon: "≡",
      module: "settings",
      permission: "audit.read",
    },
  ];

  constructor(
    public readonly auth: AuthService,
    private readonly router: Router,
  ) {}

  @HostListener("document:keydown", ["$event"])
  keyboard(event: KeyboardEvent) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      this.openSearch();
    } else if (event.key === "Escape") this.closeOverlays();
  }

  @HostListener("document:click")
  closeHeaderSearch() {
    this.headerSearchOpen = false;
  }

  get session() {
    return this.auth.session();
  }
  get workspaceName() {
    return this.session?.tenantSlug || "Workspace";
  }
  get primaryRole() {
    return this.session?.roles[0] || "Member";
  }
  get visibleGroups() {
    return this.groups.filter((group) => this.navBy(group).length > 0);
  }
  get searchResults() {
    const term = this.query.trim().toLowerCase();
    return this.nav
      .filter(
        (item) =>
          this.auth.hasModule(item.module) &&
          this.auth.hasPermission(item.permission) &&
          (!term || `${item.label} ${item.group}`.toLowerCase().includes(term)),
      )
      .slice(0, 9);
  }

  navBy(group: string) {
    return this.nav.filter(
      (item) =>
        item.group === group &&
        this.auth.hasModule(item.module) &&
        this.auth.hasPermission(item.permission),
    );
  }
  initials(value: string) {
    return (
      value
        .split(/\s+|@/)
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase() || "U"
    );
  }
  openSearch() {
    this.closeOverlays();
    this.searchOpen = true;
    this.query = "";
    setTimeout(() => this.searchInput?.nativeElement.focus());
  }
  openSearchFromHeader() {
    this.helpOpen = false;
    this.accountOpen = false;
    this.headerSearchOpen = true;
  }
  openFirstSearchResult(event: Event) {
    event.preventDefault();
    const first = this.searchResults[0];
    if (first) this.go(first.url);
  }
  toggleHelp() {
    const open = !this.helpOpen;
    this.closeOverlays();
    this.helpOpen = open;
  }
  toggleAccount() {
    const open = !this.accountOpen;
    this.closeOverlays();
    this.accountOpen = open;
  }
  closeOverlays() {
    this.searchOpen = false;
    this.headerSearchOpen = false;
    this.helpOpen = false;
    this.accountOpen = false;
  }
  go(url: string) {
    this.closeOverlays();
    void this.router.navigate([url]);
  }
  logout() {
    this.auth.logout();
    void this.router.navigate(["/login"]);
  }
}
