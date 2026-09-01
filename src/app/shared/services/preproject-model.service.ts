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

  createCriteriaTab(id: number, request: any): Promise<IHttpResult<any>> {
    return this.http
      .post<IHttpResult<any>>(`${this.urlBase}/${id}/criteria-tabs`, request)
      .toPromise();
  }

  findCriteriaTabById(id: number, idOffice: number): Promise<IHttpResult<any>> {
    return this.http
      .get<IHttpResult<any>>(`${this.urlBase}/criteria-tabs/${id}`, {
        params: { 'id-office': idOffice.toString() }
      })
      .toPromise();
  }

  updateCriteriaTab(id: number, request: any): Promise<IHttpResult<any>> {
    return this.http
      .put<IHttpResult<any>>(`${this.urlBase}/criteria-tabs/${id}`, request)
      .toPromise();
  }

  deleteCriteriaTab(id: number): Promise<IHttpResult<void>> {
    return this.http
      .delete<IHttpResult<void>>(`${this.urlBase}/criteria-tabs/${id}`)
      .toPromise();
  }
}
