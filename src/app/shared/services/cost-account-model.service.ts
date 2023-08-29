import { HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { ICostAccountModel } from '../interfaces/ICostAccountModel';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({
  providedIn: 'root'
})
export class CostAccountModelService extends BaseService<any> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('cost-account-model', injector);
  }

  public async GetCostAccountModelByPlanModel(options): Promise<IHttpResult<ICostAccountModel>> {
    const result = await this.http.get(`${this.urlBase}`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<ICostAccountModel>;
  }

}