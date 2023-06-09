import { HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IReportModel, IReportModelFile } from '../interfaces/IReportModel';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({
  providedIn: 'root'
})
export class ReportModelService extends BaseService<IReportModel> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('report-model', injector);
  }

  async compileModel(idReportModel: number): Promise<IHttpResult<any>> {
    return await this.http.patch<IHttpResult<any>>(`${this.urlBase}/compile/${idReportModel}`, {}).toPromise();
  }

  async activeModel(idReportModel: number, active: boolean): Promise<IHttpResult<any>> {
    return await this.http.patch<IHttpResult<any>>(`${this.urlBase}/${idReportModel}/active`, {active}).toPromise();
  }

  async getActiveReports(options): Promise<IHttpResult<IReportModel[]>> {
    return await this.http.get<IHttpResult<IReportModel[]>>(`${this.urlBase}/active`, { params: PrepareHttpParams(options) }).toPromise();
  }

}
