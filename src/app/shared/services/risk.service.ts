import { IHttpResult } from './../interfaces/IHttpResult';
import { IRisk } from './../interfaces/IRisk';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';

@Injectable({
  providedIn: 'root'
})
export class RiskService extends BaseService<IRisk> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('risks', injector);
  }

}