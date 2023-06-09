import { Injectable, Inject, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IReusableWorkpackModel, IWorkpackModel } from '../interfaces/IWorkpackModel';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({ providedIn: 'root' })
export class WorkpackModelService extends BaseService<IWorkpackModel> {

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('workpack-model', injector);
  }

  hasParentProject(idWorkpackModel: number) {
    return this.http.get<IHttpResult<boolean>>(`${this.urlBase}/${idWorkpackModel}/parent-project`).toPromise();
  }

  canDeleteProperty(idProperty: number) {
    return this.http.get<IHttpResult<boolean>>(`${this.urlBase}/can-delete-property/${idProperty}`).toPromise();
  }

  getReusableWorkpackModel(idWorkpackModel: number, options) {
    return this.http.get<IHttpResult<IReusableWorkpackModel[]>>(`${this.urlBase}/${idWorkpackModel}/reusable`,
      { params: PrepareHttpParams(options) }).toPromise();
  }

  getNextPosition(options) {
    return this.http.get<IHttpResult<any>>(`${this.urlBase}/next-position`, { params: PrepareHttpParams(options) }).toPromise();
  }

  reuseWorkpackModel(idWorkpackModel: number, idWorkpackModelParent) {
    return this.http.get<IHttpResult<IWorkpackModel>>(`${this.urlBase}/${idWorkpackModelParent}/reuse/${idWorkpackModel}`).toPromise();
  }

  public async deleteWokpackModel(model: IWorkpackModel, options?: { message?: string; field?: string; useConfirm?: boolean; idParent?: number }): Promise<IHttpResult<IWorkpackModel>> {
    const message = options?.message;
    const field: string = options?.field;
    const useConfirm: boolean = options?.useConfirm || true;
    const idParent: number = options?.idParent;

    return new Promise(async (resolve, reject) => {
      if (useConfirm) {
        this.confirmationSrv.confirm({
          message: message || `${this.translateSrv.instant('messages.deleteConfirmation')} ${model[field ? field : 'name'] || ''}?`,
          key: 'deleteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async () => {
            const result = await this.http.delete<IHttpResult<IWorkpackModel>>(`${this.urlBase}/${model['id']}`,  { params: PrepareHttpParams({idParent}) }).toPromise();
            if (result.success) {
              setTimeout(() => {
                this.messageSrv.add({
                  severity: 'success',
                  summary: this.translateSrv.instant('success'),
                  detail: this.translateSrv.instant('messages.deleteSuccessful')
                });
              }, 300);
            }
            resolve(result);
          },
          reject: () => {
            resolve({ success: false, data: undefined });
          }
        });
      } else {
        const result = await this.http.delete<IHttpResult<IWorkpackModel>>(`${this.urlBase}/${model['id']}`,  { params: PrepareHttpParams(idParent) }).toPromise();
        resolve(result);
      }
    });
  }

}
