import { Injectable, Inject, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IPlanModel } from '../interfaces/IPlanModel';

@Injectable({ providedIn: 'root' })
export class PlanModelService extends BaseService<IPlanModel> {

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('plan-models', injector);
  }
}
