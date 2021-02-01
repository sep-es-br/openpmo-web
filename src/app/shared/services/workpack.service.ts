import { Injectable, Inject, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IWorkpack } from '../interfaces/IWorkpack';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({ providedIn: 'root' })
export class WorkpackService extends BaseService<IWorkpack> {

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('workpack', injector);
  }

  public async GetWorkpacksByParent(options?): Promise<IHttpResult<IWorkpack[]>> {
    const result = await this.http.get(`${this.urlBase}/parent`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IWorkpack[]>;
  }

}
