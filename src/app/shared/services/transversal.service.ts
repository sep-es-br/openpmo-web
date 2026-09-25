import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import {
  ICreateTransversalProgram,
  IEligibleProject,
  ITransversalContext,
  ITransversalProgram,
  ITransversalProjectParticipation,
  ITransversalView
} from '../interfaces/ITransversal';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({ providedIn: 'root' })
export class TransversalService extends BaseService<ITransversalProgram> {

  constructor(@Inject(Injector) injector: Injector) {
    super('transversal', injector);
  }

  getViewOptions(idPlan: number): Promise<IHttpResult<ITransversalView[]>> {
    return this.http.get<IHttpResult<ITransversalView[]>>(`${this.urlBase}/views/options`, {
      params: PrepareHttpParams({ 'id-plan': idPlan })
    }).toPromise();
  }

  getViewContext(idTransversalView: number, idPlan: number): Promise<IHttpResult<ITransversalContext>> {
    return this.http.get<IHttpResult<ITransversalContext>>(`${this.urlBase}/views/${idTransversalView}/context`, {
      params: PrepareHttpParams({ 'id-plan': idPlan })
    }).toPromise();
  }

  getPrograms(idTransversalView: number, idPlan: number): Promise<IHttpResult<ITransversalProgram[]>> {
    return this.http.get<IHttpResult<ITransversalProgram[]>>(`${this.urlBase}/views/${idTransversalView}/programs`, {
      params: PrepareHttpParams({ 'id-plan': idPlan })
    }).toPromise();
  }

  createProgram(
    idTransversalView: number,
    payload: ICreateTransversalProgram
  ): Promise<IHttpResult<ITransversalProgram>> {
    return this.http.post<IHttpResult<ITransversalProgram>>(
      `${this.urlBase}/views/${idTransversalView}/programs`,
      payload
    ).toPromise();
  }

  getEligibleProjects(idTransversalProgram: number): Promise<IHttpResult<IEligibleProject[]>> {
    return this.http.get<IHttpResult<IEligibleProject[]>>(
      `${this.urlBase}/programs/${idTransversalProgram}/eligible-projects`
    ).toPromise();
  }

  includeProject(
    idTransversalProgram: number,
    idProject: number
  ): Promise<IHttpResult<ITransversalProjectParticipation>> {
    return this.http.post<IHttpResult<ITransversalProjectParticipation>>(
      `${this.urlBase}/programs/${idTransversalProgram}/projects/${idProject}`,
      {}
    ).toPromise();
  }

  removeProject(
    idTransversalProgram: number,
    idProject: number
  ): Promise<IHttpResult<ITransversalProjectParticipation>> {
    return this.http.delete<IHttpResult<ITransversalProjectParticipation>>(
      `${this.urlBase}/programs/${idTransversalProgram}/projects/${idProject}`
    ).toPromise();
  }
}
