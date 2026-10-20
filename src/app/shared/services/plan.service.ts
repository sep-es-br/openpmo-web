import { Injectable, Inject, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { IPlan } from '../interfaces/IPlan';
import { BaseService } from '../base/base.service';


@Injectable({ providedIn: 'root' })
export class PlanService extends BaseService<IPlan> {

  private currentIDPlan = new BehaviorSubject<number>(0);
  private newPlan = new BehaviorSubject<boolean>(false);

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('plans', injector);
  }

  observableIdPlan() {
    return this.currentIDPlan.pipe(distinctUntilChanged());
  }

  async nextIDPlan(idPlan: number) {
    await this.getCurrentPlan(idPlan);
    setTimeout( () => {
      this.currentIDPlan.next(idPlan);
    }, 300)
  }

  setCurrentIDPlan(idPlan: number) {
    this.currentIDPlan.next(idPlan || 0);
  }

  observableNewPlan() {
    return this.newPlan.asObservable();
  }

  nextNewPlan(value) {
    if (!!value) {
      localStorage.removeItem('@currentPlan');
      localStorage.removeItem('@pmo/propertiesCurrentPlan');
    }
    this.newPlan.next(value);
  }

  async getCurrentPlan(idPlan) {
    if (!idPlan || idPlan === 0) {
      localStorage.removeItem('@pmo/propertiesCurrentPlan');
      localStorage.removeItem('@currentPlan');
      return;
    }
    const storedPlan = localStorage.getItem('@pmo/propertiesCurrentPlan');
    let plan = storedPlan ? JSON.parse(storedPlan) : undefined;
    if (plan && plan.id === idPlan) {
     return plan;
    } else {
      const result = await this.GetById(idPlan);
      if (result.success) {
        plan = result.data;
        localStorage.setItem('@pmo/propertiesCurrentPlan', JSON.stringify(plan));
        localStorage.setItem('@currentPlan', plan.id.toString());
        return plan;
      }
    }
  }

  async hasDirectAccess(idPlan: number): Promise<boolean> {
    const result = await this.http.get<any>(`${this.urlBase}/${idPlan}/direct-access`).toPromise();
    return !!result?.success && !!result.data;
  }

  async getDirectAccessContexts(): Promise<{ success: boolean; data: { idPlan: number; idOffice: number }[] }> {
    return this.http.get<any>(`${this.urlBase}/access-contexts/direct`).toPromise();
  }

}
