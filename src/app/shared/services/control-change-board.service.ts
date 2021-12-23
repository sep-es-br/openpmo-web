import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IControlChangeBoard } from '../interfaces/IControlChangeBoard';
import { IHttpResult } from '../interfaces/IHttpResult';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({
  providedIn: 'root'
})
export class ControlChangeBoardService extends BaseService<IControlChangeBoard> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('ccb-members', injector);
  }

  async getAllCcbMembers(idProject: number): Promise<IHttpResult<IControlChangeBoard[]>> {
    const result = await this.http.get(`${this.urlBase}/${idProject}/workpack`).toPromise();
    return result as IHttpResult<IControlChangeBoard[]>;
  }
  async getCcbMember(options?): Promise<IHttpResult<IControlChangeBoard>> {
    const result = await this.http.get(`${this.urlBase}`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IControlChangeBoard>;
  }

  async Put(ccbMember: IControlChangeBoard) {
    const result = await this.http.put(`${this.urlBase}`, ccbMember).toPromise();
    return result;
  }

  async Delete(ccbMember: IControlChangeBoard, options?): Promise<IHttpResult<any>> {
    return new Promise(async (resolve, reject) => {
      this.confirmationSrv.confirm({
        message: `${this.translateSrv.instant('messages.deleteConfirmation')} ${ccbMember.person.name}?`,
        key: 'deleteConfirm',
        acceptLabel: this.translateSrv.instant('yes'),
        rejectLabel: this.translateSrv.instant('no'),
        accept: async () => {
          const result = await this.http.delete(`${this.urlBase}`, { params: PrepareHttpParams(options) })
            .toPromise() as IHttpResult<any>;

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
    });
  }

}
