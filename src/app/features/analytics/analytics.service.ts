import { Injectable } from '@angular/core';import { ApiService } from '../../core/api.service';
@Injectable({providedIn:'root'}) export class AnalyticsService{constructor(private api:ApiService){}overview(){return this.api.get<any>('analytics/overview')}revenue(){return this.api.get<any[]>('revenue/attribution')}}
