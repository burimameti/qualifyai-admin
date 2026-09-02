import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './landing.page.html',
  styleUrl: './landing.page.css'
})
export class LandingPage {
  readonly year = new Date().getFullYear();
  demoRequest = { name: '', email: '', company: '', message: '', website: '' };
  submittingDemo = false;
  demoRequestMessage = '';
  demoRequestError = '';

  constructor(readonly auth: AuthService, private readonly api: ApiService) {}

  requestDemo(): void {
    if (!this.demoRequest.name.trim() || !this.demoRequest.email.includes('@')) {
      this.demoRequestError = 'Enter your name and a valid work email.';
      return;
    }
    this.submittingDemo = true;
    this.demoRequestError = '';
    this.demoRequestMessage = '';
    this.api.post<any>('public/demo-requests', this.demoRequest).subscribe({
      next: () => {
        this.submittingDemo = false;
        this.demoRequestMessage = 'Thanks — your request is with our product team. We will reply shortly.';
        this.demoRequest = { name: '', email: '', company: '', message: '', website: '' };
      },
      error: error => {
        this.submittingDemo = false;
        this.demoRequestError = error?.error?.detail || 'Your request could not be sent right now. Please try again.';
      }
    });
  }
}
