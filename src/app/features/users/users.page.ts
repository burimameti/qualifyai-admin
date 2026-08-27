import { CommonModule } from '@angular/common';
import { Component,OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '../../shared/ui';
import { UsersService } from './users.service';
@Component({standalone:true,imports:[CommonModule,FormsModule,PageHeader],template:`
<qai-page-header title="Users & Access" subtitle="Manage tenant users, roles, permissions and account status through QualifyAI Identity."><button class="primary" (click)="creating=!creating">+ User</button></qai-page-header>
<section class="panel form" *ngIf="creating"><h3>Create user</h3><div class="form2"><label>Email<input [(ngModel)]="form.email"></label><label>Password<input type="password" [(ngModel)]="form.password"></label><label>First name<input [(ngModel)]="form.firstName"></label><label>Last name<input [(ngModel)]="form.lastName"></label></div><label>Roles (comma separated)<input [(ngModel)]="rolesText"></label><button class="primary" (click)="create()">Create account</button></section>
<section class="panel table-wrap"><table><thead><tr><th>User</th><th>Roles</th><th>Permissions</th><th>MFA</th><th>Status</th><th></th></tr></thead><tbody><tr *ngFor="let u of rows"><td><b>{{u.firstName}} {{u.lastName}}</b><small>{{u.email}}</small></td><td>{{u.roles?.join(', ')||'—'}}</td><td>{{u.permissions?.length||0}}</td><td>{{u.twoFactorEnabled?'Enabled':'Off'}}</td><td>{{u.isActive?'Active':'Disabled'}}</td><td><button class="small" *ngIf="u.isActive" (click)="disable(u)">Disable</button><button class="small" *ngIf="!u.isActive" (click)="enable(u)">Enable</button></td></tr></tbody></table></section>`})
export class UsersPage implements OnInit{
 rows:any[]=[];creating=false;rolesText='Admin';form:any={email:'',password:'',firstName:'',lastName:''};
 constructor(private users:UsersService){}
 ngOnInit(){this.load()} load(){this.users.list().subscribe(r=>this.rows=r)}
 create(){this.users.create({...this.form,roles:this.rolesText.split(',').map(x=>x.trim()).filter(Boolean)}).subscribe(()=>{this.creating=false;this.form={email:'',password:'',firstName:'',lastName:''};this.load()})}
 disable(u:any){this.users.disable(u.id).subscribe(()=>this.load())} enable(u:any){this.users.enable(u.id).subscribe(()=>this.load())}
}
