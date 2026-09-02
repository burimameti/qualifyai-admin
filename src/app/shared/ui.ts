import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
  selector: "qai-page-header",
  standalone: true,
  template: `<div class="page-header">
    <div>
      <h1>{{ title }}</h1>
      <p>{{ subtitle }}</p>
    </div>
    <div class="page-actions"><ng-content /></div>
  </div>`,
})
export class PageHeader {
  @Input() title = "";
  @Input() subtitle = "";
}

@Component({
  selector: "qai-modal",
  standalone: true,
  imports: [CommonModule],
  template: `<div class="modal-backdrop" *ngIf="open" (click)="close.emit()">
    <section
      class="modal-card"
      [class.modal-card--wide]="wide"
      role="dialog"
      aria-modal="true"
      [attr.aria-label]="title"
      (click)="$event.stopPropagation()"
    >
      <header>
        <div>
          <span class="section-kicker">Workspace action</span>
          <h3>{{ title }}</h3>
        </div>
        <button
          type="button"
          class="icon-button"
          aria-label="Close"
          (click)="close.emit()"
        >
          ×
        </button>
      </header>
      <div class="modal-body"><ng-content /></div>
    </section>
  </div>`,
})
export class Modal {
  @Input() open = false;
  @Input() title = "";
  @Input() wide = false;
  @Output() close = new EventEmitter<void>();
}

@Component({
  selector: "qai-empty",
  standalone: true,
  template: `<div class="empty">
    <b>{{ title }}</b
    ><span>{{ text }}</span>
  </div>`,
})
export class Empty {
  @Input() title = "No data";
  @Input() text = "";
}

@Component({
  selector: "qai-wizard-steps",
  standalone: true,
  imports: [CommonModule],
  template: `<nav class="wizard" [attr.aria-label]="label">
    <ol>
      <li
        *ngFor="let step of steps; let index = index"
        [class.active]="index === current"
        [class.done]="index < current"
      >
        <span>{{ index < current ? "✓" : index + 1 }}</span>
        <div>
          <b>{{ step }}</b
          ><small *ngIf="descriptions[index]">{{ descriptions[index] }}</small>
        </div>
      </li>
    </ol>
  </nav>`,
})
export class WizardSteps {
  @Input() steps: string[] = [];
  @Input() descriptions: string[] = [];
  @Input() current = 0;
  @Input() label = "Setup progress";
}

@Component({
  selector: "qai-callout",
  standalone: true,
  template: `<aside [class]="'callout ' + tone">
    <span class="callout-icon">{{ icon }}</span>
    <div>
      <b>{{ title }}</b>
      <p>{{ text }}</p>
      <ng-content />
    </div>
  </aside>`,
})
export class Callout {
  @Input() icon = "i";
  @Input() title = "";
  @Input() text = "";
  @Input() tone: "info" | "success" | "warning" = "info";
}
