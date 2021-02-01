import { Injectable, Inject, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { ICostAccount, ICostByWorkpack } from '../interfaces/ICostAccount';
import { IHttpResult } from '../interfaces/IHttpResult';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({ providedIn: 'root' })
export class CostAccountService extends BaseService<ICostAccount> {

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('cost-accounts', injector);
  }

  public async GetCostsByWorkpack(options): Promise<IHttpResult<ICostByWorkpack>> {
    const result = await this.http.get(`${this.urlBase}/workpack`, {params: PrepareHttpParams(options)}).toPromise();
    return result as IHttpResult<ICostByWorkpack>;
  }
}
