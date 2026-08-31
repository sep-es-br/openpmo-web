import { Inject, Injectable, Injector } from '@angular/core';

import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import {
  IPreprojectModelConfiguration,
  IUpdatePreprojectModelConfiguration
} from '../interfaces/IPreprojectModelConfiguration';

@Injectable({ providedIn: 'root' })
export class PreprojectModelService extends BaseService<IPreprojectModelConfiguration> {

  constructor(@Inject(Injector) injector: Injector) {
    super('pre-project-models', injector);
  }

  findOrCreateByOfficeId(idOffice: number): Promise<IHttpResult<IPreprojectModelConfiguration>> {
    return this.http
      .put<IHttpResult<IPreprojectModelConfiguration>>(`${this.urlBase}/office/${idOffice}`, {})
      .toPromise();
  }

  updateConfiguration(
    id: number,
    configuration: IUpdatePreprojectModelConfiguration
  ): Promise<IHttpResult<IPreprojectModelConfiguration>> {
    return this.http
      .put<IHttpResult<IPreprojectModelConfiguration>>(`${this.urlBase}/${id}`, configuration)
      .toPromise();
  }
}
