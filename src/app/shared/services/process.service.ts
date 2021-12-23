import { PrepareHttpParams } from './../utils/query.util';
import { IProcess } from './../interfaces/IProcess';
import { IHttpResult } from './../interfaces/IHttpResult';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';

@Injectable({
  providedIn: 'root'
})
export class ProcessService extends BaseService<IProcess> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('processes', injector);
  }

  public async GetProcessByNumber(options?): Promise<IHttpResult<IProcess>> {
    return this.http.get(`${this.urlBase}/edocs`, { params: PrepareHttpParams(options) }).toPromise() as Promise<IHttpResult<IProcess>>;
  }

}