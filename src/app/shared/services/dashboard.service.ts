import { BehaviorSubject } from 'rxjs';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IDashboard, IWorkpackByModel } from '../interfaces/IDashboard';
import { IBaseline } from '../interfaces/IBaseline';
import { IHttpResult } from '../interfaces/IHttpResult';
import { PrepareHttpParams } from '../utils/query.util';
import { IDashboardData } from '../interfaces/IDashboardData';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { WorkpackService } from './workpack.service';
import * as moment from 'moment';
import { Router } from '@angular/router';
import { WorkpackBreadcrumbStorageService } from './workpack-breadcrumb-storage.service';
import { BreadcrumbService } from './breadcrumb.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService extends BaseService<IDashboard> {
  private isExpandedMode = new BehaviorSubject<boolean>(false);
  private resetDashboard = new BehaviorSubject<boolean>(false);
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  scheduleInterval;
  referenceMonth;
  baselines;
  selectedBaseline;
  dashboard;
  yearRange;
  startDate;
  endDate;
  linked = false;
  loading;

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService,
  ) {
    super('dashboards', injector);
  }

  nextResetDashboard(nextValue: boolean) {
    this.resetDashboard.next(nextValue);
  }

  get observableResetDashboard() {
    return this.resetDashboard.asObservable();
  }

  resetDashboardData() {
    this.scheduleInterval = undefined;
    this.referenceMonth = undefined;
    this.baselines = [];
    this.selectedBaseline = undefined;
    this.dashboard = undefined;
    this.yearRange = undefined;
    this.startDate = undefined;
    this.endDate = undefined;
    this.linked = false;
    this.loading = true;
    this.nextResetDashboard(true);
  }

  getDashboardData() {
    return {
      workpackData: this.workpackData,
      workpackParams: this.workpackParams,
      scheduleInterval: this.scheduleInterval,
      referenceMonth: this.referenceMonth,
      baselines: this.baselines,
      selectedBaseline: this.selectedBaseline,
      dashboard: this.dashboard,
      yearRange: this.yearRange,
      startDate: this.startDate,
      endDate: this.endDate,
      loading: this.loading
    }
  }

  async loadDashboard(linked?: boolean) {
    this.linked = linked;
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    if (!!this.workpackData.workpack && !!this.workpackData.workpack.id &&
      !this.workpackData.workpack.canceled && !!this.workpackData.workpackModel &&
      !!this.workpackData.workpackModel.dashboardSessionActive) {
        if (this.workpackData.workpack.type === 'Project') {
          const result = await this.GetBaselines({ 'id-workpack': this.workpackData.workpack.id });
          if (result.success) {
            this.baselines = result.data;
            this.selectedBaseline = result.data.length > 0 ? this.baselines.find(baseline => !!baseline.default).id : null;
          }
        }
      await this.getScheduleInterval();
      await this.getDashboard({referenceMonth: this.referenceMonth, selectedBaseline: this.selectedBaseline});
    } else {
      this.loading = false;
      this.nextResetDashboard(true);
    }

  }

  async getScheduleInterval() {
    const result = await this.GetDashboardScheduleInterval({ 'id-workpack': this.workpackData.workpack.id });
    if (result.success && result.data.startDate && result.data.startDate !== null && result.data.endDate && result.data.endDate !== null) {
      this.scheduleInterval = result.data;
      this.calculateReferenceMonth();
    }
  }

  async getDashboard(params?) {
    if (params) {
      this.referenceMonth = params.referenceMonth;
      this.selectedBaseline = params.selectedBaseline;
    }
    if (this.referenceMonth && this.referenceMonth !== null) {
      const referenceMonth = moment(this.referenceMonth).format('MM-yyyy');
      const { data, success } =
        await this.GetDashboardByWorkpack(
          { 'id-workpack': this.workpackData.workpack.id, 'date-reference': referenceMonth,
            'id-baseline': this.selectedBaseline,
            'id-plan': this.workpackParams.idPlan,
            'id-workpack-model': this.workpackData.workpackModel.id,
            'id-workpack-model-linked': this.workpackParams.idWorkpackModelLinked,
            'linked': this.linked
          });
      if (success) {
        this.dashboard = data;
        this.validateDashboard();
      }
    } else {
      const { data, success } = await this.GetDashboardByWorkpack(
        { 'id-workpack': this.workpackData.workpack.id, 'date-reference': this.referenceMonth,
          'id-baseline': this.selectedBaseline,
          'id-plan': this.workpackParams.idPlan,
          'id-workpack-model': this.workpackData.workpackModel.id,
          'id-workpack-model-linked': this.workpackParams.idWorkpackModelLinked,
          'linked': this.linked });
      if (success) {
        this.dashboard = data;
        this.validateDashboard();
      }
    }
  }

  validateDashboard() {
    this.loadMilestoneResults();
    if (this.dashboard && (!this.dashboard.earnedValueAnalysis || this.dashboard.earnedValueAnalysis === null)
    && (!this.dashboard.milestone || this.dashboard.milestone.quantity === 0)
    && (!this.dashboard.risk || this.dashboard.risk.total === 0)
    && (!this.dashboard.stakeholders || this.dashboard.stakeholders.length === 0)
    && (!this.dashboard.tripleConstraint || this.dashboard.tripleConstraint === null)
    && (!this.dashboard.workpacksByModel || this.dashboard.workpacksByModel.length === 0)) {
      this.dashboard = undefined;
    }
    this.loading = false;
    this.nextResetDashboard(true);
  }

  loadMilestoneResults() {
    const lastDayOfMonth = moment(this.referenceMonth).daysInMonth().toString();
    const referenceMonth = moment(this.referenceMonth).format('MM-yyyy');
    const dashboardRefDate = moment(lastDayOfMonth + '-' + referenceMonth, 'DD-MM-yyyy');
    const today = moment();
    const refDate = today.isBefore(dashboardRefDate) ? today : dashboardRefDate;
    const totalMilestones = this.dashboard.milestones && this.dashboard.milestones.reduce( ( totalMilestones: {
      concluded: number;
      late: number;
      lateConcluded: number;
      onTime: number;
      quantity: number
    }, milestone) => {
    
      if (milestone.completed) {
        if (!milestone.snapshotDate) {
          totalMilestones.concluded++;
          totalMilestones.quantity++;
          return totalMilestones;
        } else {
          const milestoneDate = moment(milestone.milestoneDate, 'yyyy-MM-DD');
          const snapshotDate = moment(milestone.snapshotDate, 'yyyy-MM-DD');
          if (milestoneDate.isSameOrBefore(snapshotDate)) {
            totalMilestones.concluded++;
            totalMilestones.quantity++;
            return totalMilestones;
          } else {
            totalMilestones.lateConcluded++;
            totalMilestones.quantity++;
            return totalMilestones;
          }
        }
      } else {
        const milestoneDate = moment(milestone.milestoneDate, 'yyyy-MM-DD');
        if (milestoneDate.isBefore(refDate)) {
          totalMilestones.late++;
          totalMilestones.quantity++;
          return totalMilestones;
        } else {
          totalMilestones.onTime++;
          totalMilestones.quantity++;
          return totalMilestones;
        }
      }
    }, {concluded: 0, late: 0, lateConcluded: 0, onTime: 0, quantity: 0});
    this.dashboard.milestone = totalMilestones;
  }

  

  calculateReferenceMonth() {
    const startDate = moment(this.scheduleInterval.startDate, 'MM-yyyy').toDate();
    const endDate = moment(this.scheduleInterval.endDate, 'MM-yyyy').toDate();
    const todayMonthFormat = moment().format('MM-yyyy');
    const today = moment(todayMonthFormat, 'MM-yyyy').toDate();

    if (moment(today).subtract(1, 'month').isSameOrBefore(startDate)) {
      this.referenceMonth = moment(startDate).toDate();
    } else if (moment(today).subtract(1, 'month').isSameOrAfter(endDate)) {
      this.referenceMonth = moment(endDate).toDate();
    } else {
      this.referenceMonth = moment(today).subtract(1, 'month').toDate();
    }
    this.yearRange = moment(startDate).year().toString() + ':' + moment(endDate).year().toString();
    this.startDate = moment(startDate).toDate();
    this.endDate = moment(endDate).toDate();
  }



  public async GetBaselines(options?): Promise<IHttpResult<IBaseline[]>> {
    const result = await this.http.get(`${this.urlBase}/baselines`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IBaseline[]>;
  }

  public async GetDashboardByWorkpack(options?): Promise<IHttpResult<IDashboard>> {
    const result = await this.http.get(`${this.urlBase}`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IDashboard>;
  }

  public async GetMenuItemsByWorkpackModel(options?): Promise<IHttpResult<IWorkpackByModel[]>> {
    const result = await this.http.get(`${this.urlBase}/workpack-model/menu`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IWorkpackByModel[]>;
  }

  public async GetDashboardScheduleInterval(options?): Promise<IHttpResult<{ startDate: string; endDate: string }>> {
    const result = await this.http.get(`${this.urlBase}/schedule-interval`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<{ startDate: string; endDate: string }>;
  }


  get observable() {
    return this.isExpandedMode.asObservable();
  }

  next(nextValue: boolean) {
    setTimeout(() => this.isExpandedMode.next(nextValue), 0);
  }

}
