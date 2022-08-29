import { Injectable, Inject, Injector } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { BaseService } from '../base/base.service';
import { StoreKeys } from '../constants';
import { ICheckPasteWorkpack } from '../interfaces/ICheckPasteWorkpack';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IWorkpack } from '../interfaces/IWorkpack';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({ providedIn: 'root' })
export class WorkpackService extends BaseService<IWorkpack> {
  private workpackCuted: IWorkpack;

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('workpack', injector);
  }

  public async GetWorkpackPermissions(idWorkpack: number, options?): Promise<IHttpResult<any>> {
    const result = await this.http.get(`${this.urlBase}/${idWorkpack}/permissions`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<any>;
  }

  public async GetWorkpackName(idWorkpack: number, options?): Promise<IHttpResult<any>> {
    const result = await this.http.get(`${this.urlBase}/${idWorkpack}/name`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<any>;
  }

  public async GetWorkpacksByParent(options?): Promise<IHttpResult<IWorkpack[]>> {
    const result = await this.http.get(`${this.urlBase}/parent`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IWorkpack[]>;
  }

  public async GetWorkpackById(idWorkpack: number, options?): Promise<IHttpResult<IWorkpack>> {
    const result = await this.http.get(`${this.urlBase}/${idWorkpack}`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IWorkpack>;
  }

  public async GetWorkpackLinked(idWorkpack, options?): Promise<IHttpResult<IWorkpack>> {
    const result = await this.http.get(`${this.urlBase}/linked/${idWorkpack}`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IWorkpack>;
  }

  public async GetSharedWorkpacks(options?): Promise<IHttpResult<{ id: number; name: string; icon: string }[]>> {
    const result = await this.http.get(`${this.urlBase}/can-be-linked`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<{ id: number; name: string; icon: string }[]>;
  }

  public linkWorkpack(idWorkpack, idWorkpackModel, options): Promise<IHttpResult<IWorkpack>> {
    return this.http.post<IHttpResult<IWorkpack>>(`${this.urlBase}/${idWorkpack}/link/to/workpackModel/${idWorkpackModel}`, {},
      {
        params: PrepareHttpParams(options)
      }).toPromise();
  }

  public unlinkWorkpack(idWorkpack, idWorkpackModel, options): Promise<IHttpResult<IWorkpack>> {
    return this.http.post<IHttpResult<IWorkpack>>(`${this.urlBase}/${idWorkpack}/unlink/to/workpackModel/${idWorkpackModel}`, {},
      {
        params: PrepareHttpParams(options)
      }).toPromise();
  }

  public async cancelWorkpack(idWorkpack: number) {
    const result = await this.http.patch(`${this.urlBase}/${idWorkpack}/cancel`, {}).toPromise();
    return result as IHttpResult<any>;
  }

  public async restoreWorkpack(idWorkpack: number) {
    const result = await this.http.patch(`${this.urlBase}/${idWorkpack}/restore`, {}).toPromise();
    return result as IHttpResult<any>;
  }

  public async pasteWorkpack(idWorkpack: number, idWorkpackModelTo: number, options?): Promise<IHttpResult<any>> {
    const result = await this.http.post(`${this.urlBase}/${idWorkpack}/paste-to/${idWorkpackModelTo}`,
      {},
      { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<any>;
  }

  public async checkPasteWorkpack(idWorkpack: number, idWorkpackModelTo: number, options?): Promise<IHttpResult<ICheckPasteWorkpack>> {
    const result = await this.http.get(`${this.urlBase}/${idWorkpack}/check-paste/${idWorkpackModelTo}`,
      { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<ICheckPasteWorkpack>;
  }



  setWorkpackCuted(workpack: IWorkpack) {
    this.workpackCuted = workpack;
    localStorage.setItem(StoreKeys.WORKPACK_CUTED, JSON.stringify(workpack));
  }

  getWorkpackCuted(): IWorkpack {
    return this.workpackCuted || JSON.parse(localStorage.getItem(StoreKeys.WORKPACK_CUTED));
  }

  removeWorkpackCuted() {
    localStorage.removeItem(StoreKeys.WORKPACK_CUTED);
  }

  public async endManagementDeliverable(endManagementWorkpack: { idWorkpack: number; reason: string; endManagementDate: string }): Promise<IHttpResult<any>> {
    const result = await this.http.patch(`${this.urlBase}/end-deliverable-management/${endManagementWorkpack.idWorkpack}`, 
      { endManagementDate: endManagementWorkpack.endManagementDate, reason: endManagementWorkpack.reason }).toPromise();
    return result as IHttpResult<any>;
  }

  public async completeDeliverable(idWorkpack: number, completed): Promise<IHttpResult<any>> {
    const result = await this.http.patch(`${this.urlBase}/complete-deliverable/${idWorkpack}`, 
      { completed }).toPromise();
    return result as IHttpResult<any>;
  }
}
