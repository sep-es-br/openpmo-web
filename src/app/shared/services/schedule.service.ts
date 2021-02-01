import { Injectable, Inject, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { ISchedule, IScheduleDetail, IStep, IStepPost } from '../interfaces/ISchedule';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({ providedIn: 'root' })
export class ScheduleService extends BaseService<any> {

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('schedules', injector);
  }

  public async GetSchedule(options?): Promise<IHttpResult<IScheduleDetail[]>> {
    const result = await this.http.get(`${this.urlBase}`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IScheduleDetail[]>;
  }

  public async GetScheduleById(id: number): Promise<IHttpResult<IScheduleDetail>> {
    return this.http.get<IHttpResult<IScheduleDetail>>(`${this.urlBase}/${id}`).toPromise();
  }

  public async GetScheduleStepById(id: number): Promise<IHttpResult<IStep>> {
    return this.http.get<IHttpResult<IStep>>(`${this.urlBase}/step/${id}`).toPromise();
  }

  public postSchedule(stakeholder: ISchedule): Promise<IHttpResult<ISchedule>> {
    return this.http.post(`${this.urlBase}`, stakeholder).toPromise() as Promise<IHttpResult<ISchedule>>;
  }

  public putScheduleStep(step: IStepPost): Promise<IHttpResult<IStepPost>> {
    return this.http.put(`${this.urlBase}/step`, step).toPromise() as Promise<IHttpResult<IStepPost>>;
  }

  public postScheduleStep(step: IStepPost): Promise<IHttpResult<IStepPost>> {
    return this.http.post(`${this.urlBase}/step`, step).toPromise() as Promise<IHttpResult<IStepPost>>;
  }

  public async DeleteScheduleStep(id: number, options?: { message?: string; useConfirm?: boolean }): Promise<IHttpResult<IStep>> {
    const message = options?.message;
    const useConfirm: boolean = options?.useConfirm || true;

    return new Promise(async(resolve, reject) => {
      if (useConfirm) {
        this.confirmationSrv.confirm({
          message: message || `${this.translateSrv.instant('messages.deleteConfirmation')} ?`,
          key: 'deleteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async() => {
            const result = await this.http.delete<IHttpResult<IStep>>(`${this.urlBase}/step/${id}`).toPromise();
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
        const result = await this.http.delete<IHttpResult<IStep>>(`${this.urlBase}/step/${id}`).toPromise();
        resolve(result);
      }
    });
  }

  public async DeleteSchedule(id: number, options?: { message?: string; useConfirm?: boolean }): Promise<IHttpResult<IStep>> {
    const message = options?.message;
    const useConfirm: boolean = options?.useConfirm || true;

    return new Promise(async(resolve, reject) => {
      if (useConfirm) {
        this.confirmationSrv.confirm({
          message: message || `${this.translateSrv.instant('messages.deleteConfirmation')} ?`,
          key: 'deleteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async() => {
            const result = await this.http.delete<IHttpResult<IStep>>(`${this.urlBase}/${id}`).toPromise();
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
        const result = await this.http.delete<IHttpResult<IStep>>(`${this.urlBase}/${id}`).toPromise();
        resolve(result);
      }
    });
  }
}
