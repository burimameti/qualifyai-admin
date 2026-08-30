import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { HttpErrorResponse } from "@angular/common/http";
import { AuthService } from "../../core/auth.service";
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `<div class="login">
    <section class="login-hero">
      <div class="login-brand">
        <i class="product-logo" aria-hidden="true"
          ><span></span><span></span><span></span
        ></i>
        <div>
          <b>Qualify</b><strong>AI</strong><small>Business automation</small>
        </div>
      </div>
      <div class="login-hero-content">
        <span class="hero-eyebrow">FROM PROSPECT TO CUSTOMER</span>
        <h1>Turn market signals into <em>qualified revenue.</em></h1>
        <p>
          Discover companies, prioritize real buying intent and run
          approval-controlled outreach from one clear workspace.
        </p>

        <div
          class="product-preview"
          aria-label="QualifyAI product workflow preview"
        >
          <header>
            <div><i></i><i></i><i></i></div>
            <span>European logistics acquisition</span>
            <b>LIVE</b>
          </header>
          <div class="preview-body">
            <aside>
              <span>01</span><span class="active">02</span><span>03</span
              ><span>04</span>
            </aside>
            <main>
              <div class="preview-title">
                <div>
                  <small>ACTIVE WORKFLOW</small
                  ><b>Find accounts showing buying intent</b>
                </div>
                <strong>68%</strong>
              </div>
              <div class="preview-flow">
                <article class="done">
                  <i>✓</i>
                  <div>
                    <b>Market profile</b
                    ><small>Logistics · DACH · 20–1,000 employees</small>
                  </div>
                </article>
                <article class="active">
                  <i>⌁</i>
                  <div>
                    <b>Intent discovery</b
                    ><small>6,842 companies evaluated</small>
                  </div>
                  <em>Running</em>
                </article>
                <article>
                  <i>→</i>
                  <div>
                    <b>Approved outreach</b
                    ><small>Starts after sender review</small>
                  </div>
                </article>
              </div>
              <footer>
                <span><b>127</b> qualified</span
                ><span><b>38</b> high intent</span
                ><span><b>12</b> demo ready</span>
              </footer>
            </main>
          </div>
        </div>

        <div class="hero-benefits">
          <span><i>✓</i> Verified data sources</span
          ><span><i>✓</i> Human approval before send</span
          ><span><i>✓</i> Complete audit trail</span>
        </div>
      </div>
    </section>
    <form (ngSubmit)="submit()">
      <h2>Welcome back</h2>
      <p>Sign in to your workspace.</p>
      <label>Workspace<input [(ngModel)]="tenant" name="tenant" /></label
      ><label
        >Email<input [(ngModel)]="email" name="email" type="email" /></label
      ><label
        >Password<input
          [(ngModel)]="password"
          name="password"
          type="password" /></label
      ><label *ngIf="mfaRequired"
        >Authenticator code<input
          [(ngModel)]="mfaCode"
          name="mfaCode"
          inputmode="numeric"
          autocomplete="one-time-code" /></label
      ><button class="primary" type="submit" [disabled]="submitting">
        {{
          submitting
            ? "Signing in…"
            : mfaRequired
              ? "Verify & sign in"
              : "Sign in"
        }}
      </button>
      <div class="error" *ngIf="error">{{ error }}</div>
      <div class="demo">
        <b>Demo</b><span>demo · admin&#64;demo.local · Admin123!ChangeMe</span>
      </div>
    </form>
  </div>`,
})
export class LoginPage {
  tenant = "demo";
  email = "admin@demo.local";
  password = "Admin123!ChangeMe";
  mfaCode = "";
  mfaRequired = false;
  submitting = false;
  error = "";
  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}
  submit() {
    if (
      this.submitting ||
      !this.tenant.trim() ||
      !this.email.trim() ||
      !this.password
    )
      return;
    this.submitting = true;
    this.error = "";
    this.auth
      .login(this.tenant, this.email, this.password, this.mfaCode)
      .subscribe({
        next: () => {
          this.submitting = false;
          void this.router.navigate(["/dashboard"]);
        },
        error: (e: HttpErrorResponse) => {
          this.submitting = false;
          if (e?.error?.error === "mfa_required") {
            this.mfaRequired = true;
            this.error = "Enter the 6-digit code from your authenticator app.";
          } else if (e?.error?.error === "invalid_mfa_code") {
            this.mfaRequired = true;
            this.error = "Invalid authenticator code.";
          } else
            this.error = "Sign in failed. Confirm API, tenant and credentials.";
        },
      });
  }
}
