import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IJournal } from '../interfaces/Journal';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({
  providedIn: 'root'
})
export class JournalService extends BaseService<IJournal> {
  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('journal', injector);
  }
}
