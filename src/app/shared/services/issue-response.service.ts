import { IIssueResponse } from './../interfaces/IIssueResponse';
import { IHttpResult } from './../interfaces/IHttpResult';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';

@Injectable({
  providedIn: 'root'
})
export class IssueResponseService extends BaseService<IIssueResponse> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('issue-response', injector);
  }

}