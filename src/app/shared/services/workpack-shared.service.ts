import { PrepareHttpParams } from './../utils/query.util';
import { IHttpResult } from './../interfaces/IHttpResult';
import { IWorkpackShared } from './../interfaces/IWorkpackShared';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';


@Injectable({ providedIn: 'root' })
export class WorkpackSharedService extends BaseService<IWorkpackShared> {

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('workpack/:idWorkpack/shared', injector);
  }

  public shareWorkpack(model: IWorkpackShared[]): Promise<IHttpResult<IWorkpackShared[]>> {
    return this.http.post<IHttpResult<IWorkpackShared[]>>(`${this.urlBase}`, model).toPromise();
  }

  public async deleteShareWorkpack(params,
    options?: { message?: string; field?: string; useConfirm?: boolean }): Promise<IHttpResult<IWorkpackShared>> {
    const message = this.translateSrv.instant('all') === options.field ? `${this.translateSrv.instant('messages.deleteSharedWithAllConfirmation')}?` :
      `${this.translateSrv.instant('messages.deleteSharedWithConfirmation')} ${options.field}?`
    const useConfirm: boolean = options?.useConfirm || true;

    return new Promise(async (resolve, reject) => {
      if (useConfirm) {
        this.confirmationSrv.confirm({
          message: message || `${this.translateSrv.instant('messages.deleteConfirmation')}?`,
          key: 'deleteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async () => {
            const result = await this.http.delete<IHttpResult<IWorkpackShared>>(`${this.urlBase}`,
              { params: PrepareHttpParams(params) }).toPromise();
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
        const result = await this.http.delete<IHttpResult<IWorkpackShared>>(`${this.urlBase}`,
          { params: PrepareHttpParams(params) }).toPromise();
        resolve(result);
      }
    });
  }

}
