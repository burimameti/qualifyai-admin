import { Component,Input } from '@angular/core';
@Component({selector:'qai-status-badge',standalone:true,template:`<span class="pill" [class.hot]="tone==='danger'" [class.success]="tone==='success'">{{text}}</span>`})
export class StatusBadgeComponent{@Input() text='';@Input() tone:'neutral'|'success'|'danger'='neutral'}
