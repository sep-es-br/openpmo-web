import { PrepareHttpParams } from './../utils/query.util';
import { IBaseline, IBaselineUpdates } from './../interfaces/IBaseline';
import { IHttpResult } from './../interfaces/IHttpResult';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { BehaviorSubject } from 'rxjs';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { WorkpackService } from './workpack.service';
import { TypeWorkpackEnum } from '../enums/TypeWorkpackEnum';

type checkMilestonesRequirementResponse = {valid: boolean, requiredAmount: number}
@Injectable({
  providedIn: 'root'
})
export class BaselineService extends BaseService<IBaseline> {
  workpackData: IWorkpackData;

  workpackParams: IWorkpackParams;

  baselines;

  loading;

  private resetBaselines = new BehaviorSubject<boolean>(false);

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService
  ) {
    super('baselines', injector);
  }

  resetBaselinesData() {
    this.baselines = [];
    this.loading = true;
    this.nextResetBaselines(true);
  }

  nextResetBaselines(nextValue: boolean) {
    this.resetBaselines.next(nextValue);
  }

  get observableResetBaselines() {
    return this.resetBaselines.asObservable();
  }

  async loadBaselines() {
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    if (this.workpackParams.idWorkpack && this.workpackData.workpack.type === TypeWorkpackEnum.ProjectModel) {
      const resultBaselines = await this.GetAll({ 'id-workpack': this.workpackParams.idWorkpack });
      this.baselines = resultBaselines.success ? resultBaselines.data : [];
      this.loading = false;
      this.nextResetBaselines(true);
    } else {
      this.loading = false;
      this.nextResetBaselines(true);
    }
  }

  getBaselinesData() {
    return {
      workpackData: this.workpackData,
      workpackParams: this.workpackParams,
      baselines: this.baselines,
      loading: this.loading
    };
  }

  deleteBaselineFromData(id) {
    this.baselines = this.baselines.filter( baseline => baseline.id !== id );
  }

  public async getBaselinesFromCcbMember(options?): Promise<IHttpResult<IBaseline[]>> {
    return this.http.get<IHttpResult<IBaseline[]>>(`${this.urlBase}/ccb-member`, { params: PrepareHttpParams(options) }).toPromise();
  }

  public async getUpdates(options): Promise<IBaselineUpdates[]> {
    const { success, data } = await
      this.http.get<IHttpResult<IBaselineUpdates[]>>(`${this.urlBase}/updates`, { params: PrepareHttpParams(options) }).toPromise();
    return success ? data : [];
  }

  public async checkMilestonesRequirement(idWorkpack): Promise<checkMilestonesRequirementResponse> {
    const { success, data } = await
      this.http.get<IHttpResult<checkMilestonesRequirementResponse>>(`${this.urlBase}/check-milestone-requirement`, { params: {"id-workpack": idWorkpack} }).toPromise();
    return success ? data : {} as checkMilestonesRequirementResponse;
  }

  public putBaseline(idBaseline: number, model: IBaseline): Promise<IHttpResult<IBaseline>> {
    return this.http.put<IHttpResult<IBaseline>>(`${this.urlBase}/${idBaseline}`, model).toPromise();
  }

  public async submitBaseline(idBaseline: number, updates: IBaselineUpdates[]): Promise<IHttpResult<IBaseline>> {
    return this.http.put<IHttpResult<IBaseline>>(`${this.urlBase}/${idBaseline}/submit`, { updates }).toPromise();
  }

  public async submitBaselineCancelling(baseline: IBaseline): Promise<IHttpResult<IBaseline>> {
    return this.http.post<IHttpResult<IBaseline>>(`${this.urlBase}/submit-cancelling`, baseline).toPromise();
  }

  public async getBaselineView(idBaseline: number): Promise<IHttpResult<IBaseline>> {
    return this.http.get<IHttpResult<IBaseline>>(`${this.urlBase}/${idBaseline}/ccb-member-view`).toPromise();
  }

  public async evaluateBaseline(idBaseline: number, model: { decision: string; comment: string }): Promise<IHttpResult<IBaseline>> {
    return this.http.put<IHttpResult<IBaseline>>(`${this.urlBase}/${idBaseline}/evaluate`, model).toPromise();
  }
}
