import { BehaviorSubject } from 'rxjs';
import { Injectable, Inject, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { ISchedule, IScheduleDetail, IStep, IStepPost } from '../interfaces/ISchedule';
import { PrepareHttpParams } from '../utils/query.util';
import { WorkpackService } from './workpack.service';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';

@Injectable({ providedIn: 'root' })
export class ScheduleService extends BaseService<any> {

  workpackParams: IWorkpackParams;
  workpackData: IWorkpackData;
  schedule;
  loading;
  private resetSchedule = new BehaviorSubject<boolean>(false);

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService
  ) {
    super('schedules', injector);
  }

  resetScheduleData() {
    this.schedule = undefined;
    this.loading = true;
    this.nextResetSchedule(true);
  }


  async loadSchedule() {
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    this.workpackData = this.workpackSrv.getWorkpackData();
    if (this.workpackData && this.workpackData?.workpack?.id && this.workpackData?.workpackModel &&
      this.workpackData.workpackModel.scheduleSessionActive) {
        const result = await this.GetSchedule({ 'id-workpack': this.workpackParams.idWorkpack });
        if (result.success) {
          this.schedule = result.data && result.data.length > 0 ? result.data[0] : undefined;
          localStorage.setItem('@pmo/backupSchedule', JSON.stringify(this.schedule));
          this.loading = false;
          this.nextResetSchedule(true);
        }
    } else {
      this.loading = false;
      this.nextResetSchedule(true);
    }
  }

  setScheduleChanged(schedule) {
    this.schedule = schedule;
  }

  getScheduleData() {
    return {
      workpackParams: this.workpackParams,
      workpackData: this.workpackData,
      schedule: this.schedule,
      loading: this.loading
    };
  }

  getBackupSchedule() {
    const backupSchedule = localStorage.getItem('@pmo/backupSchedule');
    this.schedule = JSON.parse(backupSchedule);
    return this.schedule;
  }

  refreshBackupSchedule(schedule) {
    localStorage.setItem('@pmo/backupSchedule', JSON.stringify(schedule));
  }

  nextResetSchedule(nextValue: boolean) {
    this.resetSchedule.next(nextValue);
  }

  get observableResetSchedule() {
    return this.resetSchedule.asObservable();
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

  public postSchedule(schedule: ISchedule): Promise<IHttpResult<ISchedule>> {
    return this.http.post(`${this.urlBase}`, schedule).toPromise() as Promise<IHttpResult<ISchedule>>;
  }

  public putScheduleStep(step: IStepPost): Promise<IHttpResult<IStepPost>> {
    return this.http.put(`${this.urlBase}/step`, step).toPromise() as Promise<IHttpResult<IStepPost>>;
  }

  public putScheduleStepBatch(steps: IStepPost[], idSchedule: number, idPlan: number, idWorkpack: number): Promise<IHttpResult<IStepPost[]>> {
    return this.http.put(`${this.urlBase}/step/batch/${idSchedule}?idPlan=${idPlan}&idWorkpack=${idWorkpack}`, steps).toPromise() as Promise<IHttpResult<IStepPost[]>>;
  }

  public async checkDeliverableComplete(deliverableId: number): Promise<IHttpResult<boolean>> {
    return this.http
      .get<IHttpResult<boolean>>(`${this.urlBase}/step/check-complete/${deliverableId}`)
      .toPromise();
  }

  public postScheduleStep(step: IStepPost): Promise<IHttpResult<IStepPost>> {
    return this.http.post(`${this.urlBase}/step`, step).toPromise() as Promise<IHttpResult<IStepPost>>;
  }

  public putScheduleStepConsume(idStep: number, idCostAccount: number, cost): Promise<IHttpResult<any>> {
    return this.http.patch(`${this.urlBase}/step/${idStep}/cost-account/${idCostAccount}`, cost).toPromise()  as Promise<IHttpResult<any>>;
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
