import { CommonModule } from "@angular/common";
import { Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { KnowledgeDocument } from "../../core/models/platform.models";
import { Modal, PageHeader } from "../../shared/ui";
import { KnowledgeService } from "./knowledge.service";
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, Modal, PageHeader],
  template: `<qai-page-header
      title="Knowledge"
      subtitle="Ground automated answers in company documents, websites, FAQs and operational data."
      ><button (click)="testOpen = true">Test retrieval</button
      ><button class="primary" (click)="open()">
        + Add knowledge
      </button></qai-page-header
    >
    <div class="knowledge-metrics">
      <article>
        <span>Documents</span><b>{{ rows.length }}</b>
      </article>
      <article>
        <span>Published</span><b>{{ published }}</b>
      </article>
      <article>
        <span>Drafts</span><b>{{ rows.length - published }}</b>
      </article>
      <article>
        <span>Knowledge base</span><b>{{ bases.length }}</b>
      </article>
    </div>
    <div class="toolbar">
      <input [(ngModel)]="q" placeholder="Search knowledge" />
    </div>
    <section class="panel table-wrap">
      <table>
        <thead>
          <tr>
            <th>Document</th>
            <th>Version</th>
            <th>Status</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let x of visible">
            <td>
              <b>{{ x.title }}</b
              ><small>{{ x.body?.slice(0, 90) }}…</small>
            </td>
            <td>v{{ x.version }}</td>
            <td>
              <span class="pill success">{{
                x.published ? "Published" : "Draft"
              }}</span>
            </td>
            <td>{{ x.createdAtUtc | date: "mediumDate" }}</td>
            <td>
              <button class="small" (click)="open(x)">Edit</button
              ><button class="small" (click)="reindex(x)">Re-index</button
              ><button class="small danger" (click)="remove(x)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
    <qai-modal
      [open]="show"
      [title]="form.id ? 'Edit knowledge' : 'Add knowledge'"
      (close)="show = false"
      ><form class="form" (ngSubmit)="save()">
        <label
          >Knowledge base<select [(ngModel)]="form.knowledgeBaseId" name="kb">
            <option *ngFor="let b of bases" [value]="b.id">{{ b.name }}</option>
          </select></label
        ><label
          >Title<input [(ngModel)]="form.title" name="title" required /></label
        ><label
          >Content<textarea
            class="large"
            [(ngModel)]="form.body"
            name="body"
            required
          ></textarea></label
        ><label class="checkline"
          ><input type="checkbox" [(ngModel)]="form.published" name="pub" />
          Published for automated retrieval</label
        >
        <footer>
          <button type="button" (click)="show = false">Cancel</button
          ><button class="primary" type="submit">Save & index</button>
        </footer>
      </form></qai-modal
    ><qai-modal
      [open]="testOpen"
      title="Test knowledge retrieval"
      (close)="testOpen = false"
      ><div class="form">
        <label
          >Customer question<input
            [(ngModel)]="testQ"
            placeholder="What is your international freight process?" /></label
        ><button class="primary" (click)="testRetrieval()">
          Search knowledge
        </button>
        <div class="retrieval-result" *ngIf="answer">
          <b>Retrieved answer</b>
          <p>{{ answer }}</p>
        </div>
      </div></qai-modal
    >`,
})
export class KnowledgePage implements OnInit {
  rows: KnowledgeDocument[] = [];
  bases: any[] = [];
  q = "";
  show = false;
  testOpen = false;
  testQ = "";
  answer = "";
  form: any = { published: true, version: 1 };
  constructor(private data: KnowledgeService) {}
  ngOnInit() {
    this.load();
  }
  load() {
    this.data.documents().subscribe((r) => (this.rows = r));
    this.data.bases().subscribe((r) => {
      this.bases = r;
      if (!this.form.knowledgeBaseId && r.length)
        this.form.knowledgeBaseId = r[0].id;
    });
  }
  get visible() {
    return this.rows.filter((x) =>
      `${x.title} ${x.body}`.toLowerCase().includes(this.q.toLowerCase()),
    );
  }
  get published() {
    return this.rows.filter((x) => x.published).length;
  }
  open(x?: KnowledgeDocument) {
    this.form = x
      ? { ...x }
      : { published: true, version: 1, knowledgeBaseId: this.bases[0]?.id };
    this.show = true;
  }
  save() {
    if (!this.form.knowledgeBaseId || !this.form.title?.trim() || !this.form.body?.trim()) {
      alert("Knowledge base, title and content are required.");
      return;
    }
    const op = this.form.id
      ? this.data.updateDocument(this.form.id, this.form)
      : this.data.createDocument(this.form);
    op.subscribe({
      next: (r) => {
        const i = this.rows.findIndex((x) => x.id === r.id);
        i >= 0 ? (this.rows[i] = r) : this.rows.unshift(r);
        this.show = false;
        this.data.reindex(r.id).subscribe();
      },
      error: (e) => alert(e?.error?.error || "Knowledge document could not be saved."),
    });
  }
  reindex(x: KnowledgeDocument) {
    this.data
      .reindex(x.id)
      .subscribe((r) => alert(`Indexed ${r.chunks || 0} chunks.`));
  }
  remove(x: KnowledgeDocument) {
    if (confirm(`Delete ${x.title}?`))
      this.data
        .deleteDocument(x.id)
        .subscribe(() => (this.rows = this.rows.filter((v) => v.id !== x.id)));
  }
  testRetrieval() {
    if (!this.testQ.trim()) return;
    this.data
      .retrieve(this.testQ)
      .subscribe({
        next: (r) => (this.answer = r.answer || JSON.stringify(r)),
        error: () => (this.answer = "Retrieval failed."),
      });
  }
}
