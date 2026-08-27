import { Component,Input } from '@angular/core';import{CommonModule}from'@angular/common';
@Component({selector:'qai-loading-state',standalone:true,imports:[CommonModule],template:`<div class="empty" *ngIf="loading"><b>Loading {{label}}…</b><span>Fetching tenant data from the API.</span></div>`})
export class LoadingStateComponent{@Input() loading=false;@Input() label='data'}
