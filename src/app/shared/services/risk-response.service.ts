import { IRiskResponse } from './../interfaces/IRiskResponse';
import { IHttpResult } from './../interfaces/IHttpResult';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';

@Injectable({
  providedIn: 'root'
})
export class RiskResponseService extends BaseService<IRiskResponse> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('risk-responses', injector);
  }


}