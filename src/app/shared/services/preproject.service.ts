import { Inject, Injectable, Injector } from '@angular/core';

import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import {
  ICreatedProjectFromPreproject,
  ICreatePreprojectRequest,
  ICreateProjectFromPreprojectRequest,
  IPreproject,
  IPreprojectCriteriaTabValues,
  IPreprojectEvaluation,
  IPreprojectListItem,
  ISavePreprojectCriteriaTabValuesRequest,
  IUpdatePreprojectRequest
} from '../interfaces/IPreproject';

@Injectable({ providedIn: 'root' })
export class PreprojectService extends BaseService<IPreproject> {

  private readonly requestOptions = { headers: { 'X-Skip-Request-Cache': 'true' } };

  constructor(@Inject(Injector) injector: Injector) {
    super('pre-projects', injector);
  }

  create(request: ICreatePreprojectRequest): Promise<IHttpResult<IPreproject>> {
    return this.http
      .post<IHttpResult<IPreproject>>(this.urlBase, request, this.requestOptions)
      .toPromise();
  }

  findById(id: number): Promise<IHttpResult<IPreproject>> {
    return this.http
      .get<IHttpResult<IPreproject>>(`${this.urlBase}/${id}`, this.requestOptions)
      .toPromise();
  }

  update(id: number, request: IUpdatePreprojectRequest): Promise<IHttpResult<IPreproject>> {
    return this.http
      .put<IHttpResult<IPreproject>>(`${this.urlBase}/${id}`, request, this.requestOptions)
      .toPromise();
  }

  findCriteriaTabValues(
    idPreproject: number,
    idCriteriaTabModel: number
  ): Promise<IHttpResult<IPreprojectCriteriaTabValues>> {
    return this.http
      .get<IHttpResult<IPreprojectCriteriaTabValues>>(
        `${this.urlBase}/${idPreproject}/criteria-tabs/${idCriteriaTabModel}/values`,
        this.requestOptions
      )
      .toPromise();
  }

  saveCriteriaTabValues(
    idPreproject: number,
    idCriteriaTabModel: number,
    request: ISavePreprojectCriteriaTabValuesRequest
  ): Promise<IHttpResult<IPreprojectCriteriaTabValues>> {
    return this.http
      .put<IHttpResult<IPreprojectCriteriaTabValues>>(
        `${this.urlBase}/${idPreproject}/criteria-tabs/${idCriteriaTabModel}/values`,
        request,
        this.requestOptions
      )
      .toPromise();
  }

  findAllByOfficeId(idOffice: number): Promise<IHttpResult<IPreprojectListItem[]>> {
    return this.http
      .get<IHttpResult<IPreprojectListItem[]>>(`${this.urlBase}`, {
        ...this.requestOptions,
        params: { 'id-office': idOffice.toString() }
      })
      .toPromise();
  }

  findEvaluation(idPreproject: number): Promise<IHttpResult<IPreprojectEvaluation>> {
    return this.http
      .get<IHttpResult<IPreprojectEvaluation>>(`${this.urlBase}/${idPreproject}/evaluation`, this.requestOptions)
      .toPromise();
  }

  createProject(
    idPreproject: number,
    request: ICreateProjectFromPreprojectRequest
  ): Promise<IHttpResult<ICreatedProjectFromPreproject>> {
    return this.http
      .post<IHttpResult<ICreatedProjectFromPreproject>>(
        `${this.urlBase}/${idPreproject}/projects`,
        request,
        this.requestOptions
      )
      .toPromise();
  }
}
