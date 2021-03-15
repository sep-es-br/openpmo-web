import { Injectable, Inject, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

import { IPlan } from '../interfaces/IPlan';
import { BaseService } from '../base/base.service';


@Injectable({ providedIn: 'root' })
export class PlanService extends BaseService<IPlan> {

  private currentIDPlan = new BehaviorSubject<number>(0);

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
}
