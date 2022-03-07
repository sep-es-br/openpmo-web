import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IDashboard } from '../interfaces/IDashboard';
import { IBaseline } from '../interfaces/IBaseline';
import { IHttpResult } from '../interfaces/IHttpResult';
import { PrepareHttpParams } from '../utils/query.util';
import { IDashboardData } from '../interfaces/IDashboardData';

@Injectable({
  providedIn: 'root'
})
export class DashboardService extends BaseService<IDashboard> {
  private dashboardData: IDashboardData = {} as IDashboardData;

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('dashboards', injector);
  }

  public async GetBaselines(options?): Promise<IHttpResult<IBaseline[]>> {
    const result = await this.http.get(`${this.urlBase}/baselines`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IBaseline[]>;
  }

  public async GetDashboardByWorkpack(options?): Promise<IHttpResult<IDashboard>> {
    const result = await this.http.get(`${this.urlBase}`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IDashboard>;
  }

  public async GetDashboardScheduleInterval(options?): Promise<IHttpResult<{ startDate: string; endDate: string }>> {
    const result = await this.http.get(`${this.urlBase}/schedule-interval`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<{ startDate: string; endDate: string }>;
  }
  public GetDashboardData(): IDashboardData {
    return this.dashboardData;
  }

  public SetDashboardData(dashboardData: IDashboardData) {
    this.dashboardData = dashboardData;
  }

  resetDashboardData() {
    this.dashboardData = {} as IDashboardData;
  }

}
