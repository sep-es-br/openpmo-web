import { HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IReportModel, IReportModelFile } from '../interfaces/IReportModel';
import { PrepareHttpParams } from '../utils/query.util';
import { IReportScope } from '../interfaces/IReportScope';
import { IReportGenerate } from '../interfaces/IReportGenerate';
import { Observable } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ReportService extends BaseService<IReportModel> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('report', injector);
  }

  async checkHasActiveReports(options): Promise<IHttpResult<boolean>> {

    return await this.http.get<IHttpResult<boolean>>(`${this.urlBase}/active/has-model`, { params: PrepareHttpParams(options) }).toPromise();
    
  }

  async getScopeReport(options): Promise<IHttpResult<IReportScope>> {
    return await this.http.get<IHttpResult<IReportScope>>(`${this.urlBase}/scope`, { params: PrepareHttpParams(options) }).toPromise();
  }

  async generateReport(sender: IReportGenerate): Promise<any> {
    return await this.http.post(`${this.urlBase}/generate`, sender, {
      responseType: 'blob',
      observe: 'response'
    }).toPromise();
  }



  getKeyFrom(obj: any) {
    return Object.keys(obj).sort().map(k => obj[k].toString()).join(':');
  }

}