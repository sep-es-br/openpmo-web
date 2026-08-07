import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IDashboard, IDashboardData } from '../interfaces/IDashboard';
import { IHttpResult } from '../interfaces/IHttpResult';
import { PrepareHttpParams } from '../utils/query.util';
import { DashboardService } from './dashboard.service';

@Injectable({ providedIn: 'root' })
export class PlanDashboardService extends BaseService<IDashboard> {
  constructor(
    @Inject(Injector) injector: Injector,
    private dashboardSrv: DashboardService
  ) {
    super('dashboards', injector);
  }

  async getPlanDashboard(
    idPlan: number,
    dateReference?: string
  ): Promise<IHttpResult<IDashboard>> {
    return this.http.get<IHttpResult<IDashboard>>(
      `${this.urlBase}/plan`,
      {
        params: PrepareHttpParams({
          'id-plan': idPlan,
          'date-reference': dateReference,
        }),
      }
    ).toPromise();
  }

  mapDashboard(data: IDashboard): IDashboardData {
    return this.dashboardSrv.setDashboardData(data);
  }
}
