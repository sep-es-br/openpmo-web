import { PrepareHttpParams } from './../utils/query.util';
import { IBaseline, IBaselineUpdates } from './../interfaces/IBaseline';
import { IHttpResult } from './../interfaces/IHttpResult';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IWorkpackBaselines } from '../interfaces/IWorkpackBaselines';

@Injectable({
  providedIn: 'root'
})
export class BaselineService extends BaseService<IBaseline> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('baselines', injector);
  }

  public async getBaselinesFromCcbMember(): Promise<IHttpResult<IWorkpackBaselines[]>> {
    return this.http.get<IHttpResult<IWorkpackBaselines[]>>(`${this.urlBase}/ccb-member`).toPromise();
  }

  public async getUpdates(options): Promise<IBaselineUpdates[]> {
    const { success, data } = await
      this.http.get<IHttpResult<IBaselineUpdates[]>>(`${this.urlBase}/updates`, { params: PrepareHttpParams(options) }).toPromise();
    return success ? data : [];
  }

  public putBaseline(idBaseline: number, model: IBaseline): Promise<IHttpResult<IBaseline>> {
    return this.http.put<IHttpResult<IBaseline>>(`${this.urlBase}/${idBaseline}`, model).toPromise();
  }

  public async submitBaseline(idBaseline: number, updates: IBaselineUpdates[]): Promise<IHttpResult<IBaseline>> {
    return this.http.put<IHttpResult<IBaseline>>(`${this.urlBase}/${idBaseline}/submit`, {updates}).toPromise();
  }

  public async submitBaselineCancelling(baseline: IBaseline): Promise<IHttpResult<IBaseline>> {
    return this.http.post<IHttpResult<IBaseline>>(`${this.urlBase}/submit-cancelling`, baseline).toPromise();
  }

  public async getBaselineView(idBaseline: number): Promise<IHttpResult<IBaseline>> {
    return this.http.get<IHttpResult<IBaseline>>(`${this.urlBase}/${idBaseline}/ccb-member-view`).toPromise();
  }

  public async evaluateBaseline(idBaseline: number, model: {decision: string; comment: string}): Promise<IHttpResult<IBaseline>> {
    return this.http.put<IHttpResult<IBaseline>>(`${this.urlBase}/${idBaseline}/evaluate`, model).toPromise();
  }
}
