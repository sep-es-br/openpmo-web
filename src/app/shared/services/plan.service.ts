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

  nextIDPlan(idPlan: number) {
    this.currentIDPlan.next(idPlan);
  }

  observableNewPlan() {
    return this.newPlan.asObservable();
  }

  nextNewPlan(value) {
    this.newPlan.next(value);
  }

  async getCurrentPlan(idPlan) {
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

}
