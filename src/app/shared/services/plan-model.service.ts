import { PrepareHttpParams } from './../utils/query.util';
import { IHttpResult } from './../interfaces/IHttpResult';
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

  public async getSharedPlanModels(options?): Promise<IHttpResult<IPlanModel[]>> {
    const result = await this.http.get<IHttpResult<IPlanModel[]>>(`${this.urlBase}/shareds`,
      {
        params: PrepareHttpParams(options)
      }
    ).toPromise();
    if (!result.data?.length) {
      result.data = [];
    }
    return result;
  }

  public async createPlanModelFromShared(idOffice: number, idPlanModelShared: number): Promise<IHttpResult<IPlanModel>> {
    return this.http.post<IHttpResult<IPlanModel>>(`${this.urlBase}/${idOffice}/create-from-shared/${idPlanModelShared}`, {}).toPromise();
  }
}
