import { IIssue } from './../interfaces/IIssue';
import { IHttpResult } from './../interfaces/IHttpResult';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';

@Injectable({
  providedIn: 'root'
})
export class IssueService extends BaseService<IIssue> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('issues', injector);
  }

  public async CreateIssueFromRisk(idRisk: number): Promise<IHttpResult<IIssue>> {
    return this.http.post(`${this.urlBase}/create-from-risk`, { idRisk }).toPromise() as Promise<IHttpResult<IIssue>>;
  }

}