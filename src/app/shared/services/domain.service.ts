import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Injector } from '@angular/core';
import { MessageService } from 'primeng/api';
import { BaseService } from '../base/base.service';
import { IDomain } from '../interfaces/IDomain';

@Injectable({
  providedIn: 'root'
})
export class DomainService extends BaseService<IDomain> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('domains', injector);
  }

}
