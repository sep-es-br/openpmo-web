import { Injectable, Inject, Injector } from '@angular/core';
import { IPlan } from '../interfaces/IPlan';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({ providedIn: 'root' })
export class PlanService extends BaseService<IPlan> {
  plansPermissionsUser: IPlan[];

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('plans', injector);
  }
}
