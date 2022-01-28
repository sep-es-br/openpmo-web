import { HttpHeaders } from '@angular/common/http';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';

@Injectable({
  providedIn: 'root'
})
export class EvidenceService extends BaseService<any> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('evidence', injector);
  }

  async uploadEvidence(file: FormData, idJournal: number): Promise<IHttpResult<any>> {
    const headers = new HttpHeaders({
      'Form-Data': 'true'
    });
    const result = await this.http.post(`${this.urlBase}/${idJournal}`, file, { headers }).toPromise();
    return result as IHttpResult<any>;
  }

}
