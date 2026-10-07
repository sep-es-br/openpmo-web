import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import {
  IEligibleProject,
  ITransversalProgram,
  ITransversalProgramModel,
  ITransversalProjectParticipation,
  ITransversalSelectionOption,
  ITransversalLinkedModel,
  ITransversalWorkpack,
  ITransversalWorkpackParticipation
} from '../interfaces/ITransversal';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({ providedIn: 'root' })
export class TransversalService extends BaseService<ITransversalProgram> {

  constructor(@Inject(Injector) injector: Injector) {
    super('transversal', injector);
  }

  getSelectionOptions(idRootTransversalViewModel: number, params: { idPlan?: number; idPlanModel?: number }) {
    return this.http.get<IHttpResult<ITransversalSelectionOption[]>>(`${this.urlBase}/selection-options`, {
      params: PrepareHttpParams({
        'id-root-transversal-view-model': idRootTransversalViewModel,
        'id-plan': params?.idPlan,
        'id-plan-model': params?.idPlanModel
      })
    }).toPromise();
  }

  getPrograms(idTransversalView: number, idPlan: number): Promise<IHttpResult<ITransversalProgram[]>> {
    return this.http.get<IHttpResult<ITransversalProgram[]>>(`${this.urlBase}/views/${idTransversalView}/programs`, {
      params: PrepareHttpParams({ 'id-plan': idPlan })
    }).toPromise();
  }

  getProgramModels(idTransversalView: number): Promise<IHttpResult<ITransversalProgramModel[]>> {
    return this.http.get<IHttpResult<ITransversalProgramModel[]>>(
      `${this.urlBase}/views/${idTransversalView}/program-models`
    ).toPromise();
  }

  getEligibleProjects(idTransversalProgram: number): Promise<IHttpResult<IEligibleProject[]>> {
    return this.http.get<IHttpResult<IEligibleProject[]>>(
      `${this.urlBase}/programs/${idTransversalProgram}/eligible-projects`
    ).toPromise();
  }

  getLinkedModels(idTransversalProgram: number): Promise<IHttpResult<ITransversalLinkedModel[]>> {
    return this.http.get<IHttpResult<ITransversalLinkedModel[]>>(
      `${this.urlBase}/programs/${idTransversalProgram}/linked-models`
    ).toPromise();
  }

  getEligibleWorkpacks(
    idTransversalProgram: number,
    idWorkpackModel: number,
    page = 0,
    pageSize = 20
  ): Promise<IHttpResult<ITransversalWorkpack[]>> {
    return this.http.get<IHttpResult<ITransversalWorkpack[]>>(
      `${this.urlBase}/programs/${idTransversalProgram}/eligible-workpacks`,
      { params: PrepareHttpParams({ 'id-workpack-model': idWorkpackModel, page, pageSize }) }
    ).toPromise();
  }

  getIncludedWorkpacks(
    idTransversalProgram: number,
    idWorkpackModel: number,
    page = 0,
    pageSize = 20,
    showCanceled = false
  ): Promise<IHttpResult<ITransversalWorkpack[]>> {
    return this.http.get<IHttpResult<ITransversalWorkpack[]>>(
      `${this.urlBase}/programs/${idTransversalProgram}/workpacks`,
      { params: PrepareHttpParams({ 'id-workpack-model': idWorkpackModel, page, pageSize, 'show-canceled': showCanceled }) }
    ).toPromise();
  }

  includeWorkpack(
    idTransversalProgram: number,
    idWorkpack: number
  ): Promise<IHttpResult<ITransversalWorkpackParticipation>> {
    return this.http.post<IHttpResult<ITransversalWorkpackParticipation>>(
      `${this.urlBase}/programs/${idTransversalProgram}/workpacks/${idWorkpack}`,
      {}
    ).toPromise();
  }

  removeWorkpack(
    idTransversalProgram: number,
    idWorkpack: number
  ): Promise<IHttpResult<ITransversalWorkpackParticipation>> {
    return this.http.delete<IHttpResult<ITransversalWorkpackParticipation>>(
      `${this.urlBase}/programs/${idTransversalProgram}/workpacks/${idWorkpack}`
    ).toPromise();
  }

  getIncludedProjects(idTransversalProgram: number): Promise<IHttpResult<IEligibleProject[]>> {
    return this.http.get<IHttpResult<IEligibleProject[]>>(
      `${this.urlBase}/programs/${idTransversalProgram}/projects`
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
