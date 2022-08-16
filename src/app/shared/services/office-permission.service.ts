import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IOfficePermission } from '../interfaces/IOfficePermission';
import { PrepareHttpParams } from '../utils/query.util';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class OfficePermissionService extends BaseService<IOfficePermission> {

  listOfficesPermissions: IOfficePermission[] = [];

  constructor(
    @Inject(Injector) injector: Injector,
    private authSrv: AuthService
  ) {
    super('office-permissions', injector);
    this.authSrv.userLogout.subscribe(() => this.listOfficesPermissions = []);
  }

  async getPermissions(idOffice: number) {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    if (isUserAdmin) {
      return isUserAdmin;
    }
    const hasSavedPermission = this.listOfficesPermissions.find(p => p.idOffice === idOffice);
    if (hasSavedPermission) {
      return hasSavedPermission.permissions?.reduce((a, p) => a ? a : p.level === 'EDIT', false);
    } else {
      const { key } = this.authSrv.getTokenPayload();
      const { success, data } = await this.GetAll({ 'id-office': idOffice, key });
      this.listOfficesPermissions.push(...data);
      return success
        ? data[0]?.permissions?.reduce((a, b) => a ? a : b.level === 'EDIT', false)
        : success;
    }
  }

  public async deletePermission(params,
    options?: { message?: string; field?: string; useConfirm?: boolean }): Promise<IHttpResult<IOfficePermission>> {
    const message = options?.message;
    const field: string = options?.field;
    const useConfirm: boolean = options?.useConfirm || true;

    return new Promise(async(resolve, reject) => {
      if (useConfirm) {
        this.confirmationSrv.confirm({
          message: message || `${this.translateSrv.instant('messages.deleteConfirmation')}?`,
          key: 'deleteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async() => {
            const result = await this.http.delete<IHttpResult<IOfficePermission>>(`${this.urlBase}`,
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
        const result = await this.http.delete<IHttpResult<IOfficePermission>>(`${this.urlBase}`,
          { params: PrepareHttpParams(params) }).toPromise();
        resolve(result);
      }
    });
  }
}
