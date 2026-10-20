import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import {
  ITransversalProgram,
  ITransversalProgramModel,
  ITransversalProjectParticipation,
  ITransversalSelectionOption,
  ITransversalLinkedModel,
  ITransversalWorkpack,
  ITransversalWorkpackParticipation,
  ITransversalStructuralLink,
  ITransversalAccessContext,
  IStructuralAccessContext
} from '../interfaces/ITransversal';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({ providedIn: 'root' })
export class TransversalService extends BaseService<ITransversalProgram> {

  private rootModelNames = new Map<number, string>();

  private rootModelNameRequests = new Map<number, Promise<string | undefined>>();

  constructor(@Inject(Injector) injector: Injector) {
    super('transversal', injector);
  }

  getSelectionOptions(idRootTransversalViewModel: number | undefined, params: { idPlan?: number; idPlanModel?: number }) {
    return this.http.get<IHttpResult<ITransversalSelectionOption[]>>(`${this.urlBase}/selection-options`, {
      params: PrepareHttpParams({
        'id-root-transversal-view-model': idRootTransversalViewModel,
        'id-plan': params?.idPlan,
        'id-plan-model': params?.idPlanModel
      })
    }).toPromise();
  }

  getAccessibleContexts(): Promise<IHttpResult<ITransversalAccessContext[]>> {
    return this.http.get<IHttpResult<ITransversalAccessContext[]>>(`${this.urlBase}/access-contexts`).toPromise();
  }

  getDirectStructuralAccessContexts(): Promise<IHttpResult<IStructuralAccessContext[]>> {
    return this.http.get<IHttpResult<IStructuralAccessContext[]>>(
      `${this.urlBase}/structural-access-contexts`
    ).toPromise();
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

  getLinkedModels(idTransversalProgram: number): Promise<IHttpResult<ITransversalLinkedModel[]>> {
    return this.http.get<IHttpResult<ITransversalLinkedModel[]>>(
      `${this.urlBase}/programs/${idTransversalProgram}/linked-models`
    ).toPromise();
  }

  getStructuralLinks(
    idTransversalProgram: number,
    includeDescendants = false,
    includeStructuralDescendants = true
  ): Promise<IHttpResult<ITransversalStructuralLink[]>> {
    return this.http.get<IHttpResult<ITransversalStructuralLink[]>>(
      `${this.urlBase}/programs/${idTransversalProgram}/structural-links`,
      { params: PrepareHttpParams({
        'include-descendants': includeDescendants,
        'include-structural-descendants': includeStructuralDescendants
      }) }
    ).toPromise().then(result => {
      this.rememberRootModelNames(result?.data || []);
      return result;
    });
  }

  getStructuralLinksForView(idTransversalView: number, idPlan: number): Promise<IHttpResult<ITransversalStructuralLink[]>> {
    return this.http.get<IHttpResult<ITransversalStructuralLink[]>>(
      `${this.urlBase}/views/${idTransversalView}/structural-links`,
      { params: PrepareHttpParams({ 'id-plan': idPlan }) }
    ).toPromise().then(result => {
      this.rememberRootModelNames(result?.data || []);
      return result;
    });
  }

  getRootModelName(idTransversalProgram: number): Promise<string | undefined> {
    const cachedName = this.rootModelNames.get(Number(idTransversalProgram));
    if (cachedName) {
      return Promise.resolve(cachedName);
    }

    const pendingRequest = this.rootModelNameRequests.get(Number(idTransversalProgram));
    if (pendingRequest) {
      return pendingRequest;
    }

    const request = this.getStructuralLinks(Number(idTransversalProgram)).then(result => {
      const rootModelName = result?.success
        ? result.data?.find(link => link.rootModelName)?.rootModelName
        : undefined;
      if (rootModelName) {
        this.rootModelNames.set(Number(idTransversalProgram), rootModelName);
      }
      return rootModelName;
    }).finally(() => this.rootModelNameRequests.delete(Number(idTransversalProgram)));
    this.rootModelNameRequests.set(Number(idTransversalProgram), request);
    return request;
  }

  private rememberRootModelNames(links: ITransversalStructuralLink[]): void {
    (links || []).forEach(link => {
      if (link.idTransversalProgram && link.rootModelName) {
        this.rootModelNames.set(Number(link.idTransversalProgram), link.rootModelName);
      }
    });
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
