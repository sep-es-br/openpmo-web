import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IVersion } from '../interfaces/IVersion';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({
  providedIn: 'root'
})
export class VersionService extends BaseService<IVersion>{

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('versions', injector);
  }

  public async GetVersionApi(options?): Promise<IHttpResult<IVersion>> {
    const result = await this.http.get(`${this.urlBase}`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IVersion>;
  }
}
