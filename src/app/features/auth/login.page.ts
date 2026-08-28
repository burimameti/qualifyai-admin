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
      <div class="brand">✦ QualifyAI</div>
      <div>
        <span>AI CUSTOMER OPERATIONS</span>
        <h1>Support customers. Qualify demand. Automate revenue.</h1>
        <p>
          One operating system for AI service, sales qualification, CRM,
          workflow automation and revenue intelligence.
        </p>
        <div class="proof">
          <b>73.6%<small>AI resolution</small></b
          ><b>€184k<small>Pipeline influenced</small></b
          ><b>4.7/5<small>CSAT</small></b>
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
        {{ submitting ? "Signing in…" : mfaRequired ? "Verify & sign in" : "Sign in" }}
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
    if (this.submitting || !this.tenant.trim() || !this.email.trim() || !this.password) return;
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
