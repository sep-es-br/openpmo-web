import { HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IReportModel, IReportModelFile } from '../interfaces/IReportModel';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({
  providedIn: 'root'
})
export class ReportModelFileService extends BaseService<IReportModelFile> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('report-model/files', injector);
  }

  async sendSourceFile(file: FormData): Promise<IHttpResult<IReportModelFile>> {
    const headers = new HttpHeaders({
      'Form-Data': 'true'
    });
    const result = await this.http.post(`${this.urlBase}/upload`, file, { headers }).toPromise();
    return result as IHttpResult<IReportModelFile>;
  }

  async downloadFile(idFile: number, options): Promise<any> {
    return await this.http.get(`${this.urlBase}/${idFile}/download`, {
      observe: 'response',
      responseType: 'blob',
      params: PrepareHttpParams(options)  }).toPromise();
  }

  async setAsMain(idFile: number, idReportModel: number): Promise<IHttpResult<any>> {
    return await this.http.patch<IHttpResult<any>>(`${this.urlBase}/${idFile}/set-as-main`, { 'idReportModel': idReportModel }).toPromise();
  }

}
