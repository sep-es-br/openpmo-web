import { BehaviorSubject } from 'rxjs';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IDashboard, IDashboardData, IWorkpackByModel } from '../interfaces/IDashboard';
import { IBaseline } from '../interfaces/IBaseline';
import { IHttpResult } from '../interfaces/IHttpResult';
import { PrepareHttpParams } from '../utils/query.util';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { WorkpackService } from './workpack.service';
import * as moment from 'moment';
import * as assert from 'assert';
import { assertNotNull } from '@angular/compiler/src/output/output_ast';

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
  dashboard: IDashboardData;
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
      await this.getDashboard({referenceMonth: this.referenceMonth, selectedBaseline: this.selectedBaseline});
    } else {
      this.loading = false;
      this.nextResetDashboard(true);
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
        this.dashboard = this.setDashboardData(data);
        if (!params || !params.referenceMonth) {
          this.setScheduleInterval(data);
          this.calculateReferenceMonth();
        }
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
        this.dashboard = this.setDashboardData(data);
        this.setScheduleInterval(data);
        this.calculateReferenceMonth();
        this.validateDashboard();
      }
    }
  }

  setScheduleInterval(data: IDashboard) {
    let endDate;
    let initialDate;
    const plannedStartDate = data && data.tripleConstraint && data.tripleConstraint?.schedulePlannedStartDate;
    const foreseenStartDate = data && data.tripleConstraint && data.tripleConstraint?.scheduleForeseenStartDate;
    if (plannedStartDate && foreseenStartDate && moment(plannedStartDate, 'yyyy-MM-DD').isBefore(moment(foreseenStartDate, 'yyyy-MM-DD'))) {
      initialDate = plannedStartDate;
    } else if (foreseenStartDate) {
      initialDate = foreseenStartDate;
    }
    const plannedEndDate = data && data.tripleConstraint && data.tripleConstraint?.schedulePlannedEndDate;
    const foreseenEndDate = data && data.tripleConstraint && data.tripleConstraint?.scheduleForeseenEndDate;
    if (plannedEndDate && foreseenEndDate && moment(plannedEndDate, 'yyyy-MM-DD').isAfter(moment(foreseenEndDate, 'yyyy-MM-DD'))) {
      endDate = plannedEndDate;
    } else if (foreseenEndDate) {
      endDate = foreseenEndDate;
    }
    this.scheduleInterval = {initialDate, endDate};
  }

  setDashboardData(data: IDashboard) {
    if (!data) {
      return undefined;
    }
    const dashboard = {
      ...data,
      tripleConstraint: {
        cost: {
          actualValue:data?.tripleConstraint?.costActualValue,
          foreseenValue: data?.tripleConstraint?.costForeseenValue,
          plannedValue: data?.tripleConstraint?.costPlannedValue,
          variation: data?.tripleConstraint?.costVariation
        },
        schedule: {
          actualEndDate: data?.tripleConstraint?.scheduleActualEndDate,
          actualStartDate: data?.tripleConstraint?.scheduleActualStartDate,
          actualValue: data?.tripleConstraint?.scheduleActualValue,
          foreseenEndDate: data?.tripleConstraint?.scheduleForeseenEndDate,
          foreseenStartDate: data?.tripleConstraint?.scheduleForeseenStartDate,
          foreseenValue: data?.tripleConstraint?.scheduleForeseenValue,
          plannedEndDate: data?.tripleConstraint?.schedulePlannedEndDate,
          plannedStartDate: data?.tripleConstraint?.schedulePlannedStartDate,
          plannedValue: data?.tripleConstraint?.schedulePlannedValue,
          variation: data?.tripleConstraint?.scheduleVariation
        },
        scope: {
          actualVariationPercent: data?.tripleConstraint?.scopeActualVariationPercent,
          foreseenVariationPercent: data?.tripleConstraint?.scopeForeseenVariationPercent,
          plannedVariationPercent: data?.tripleConstraint?.scopePlannedVariationPercent,
          foreseenValue: data?.tripleConstraint?.scopeForeseenValue,
          plannedValue: data?.tripleConstraint?.scopePlannedValue,
          actualValue:data?.tripleConstraint?.scopeActualValue,
          variation: data?.tripleConstraint?.scopeVariation
        }
      },
      earnedValueAnalysis: {
        performanceIndexes: {
          actualCost: data?.performanceIndex?.actualCost,
          costPerformanceIndex: {
            costVariation: data?.performanceIndex?.costPerformanceIndexVariation,
            indexValue: data?.performanceIndex?.costPerformanceIndexValue
          },
          earnedValue: data?.performanceIndex?.earnedValue,
          estimateToComplete: data?.performanceIndex?.estimateToComplete,
          estimatesAtCompletion: data?.performanceIndex?.estimatesAtCompletion,
          plannedValue: data?.performanceIndex?.plannedValueRefMonth,
          schedulePerformanceIndex: {
            indexValue: data?.performanceIndex?.schedulePerformanceIndexValue,
            scheduleVariation: data?.performanceIndex?.schedulePerformanceIndexVariation
          },
        },
        earnedValueByStep: data?.earnedValueByStep
      }
    }
    
    return dashboard;
  }

  validateDashboard() {
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


  calculateReferenceMonth() {
    const startDateMonthFormat = this.scheduleInterval && moment(this.scheduleInterval?.initialDate, 'yyyy-MM-DD').format('MM-yyyy');
    const startDate = moment(startDateMonthFormat, 'MM-yyyy').toDate();
    
    const endDate = this.scheduleInterval && moment(this.scheduleInterval?.endDate, 'yyyy-MM-DD').toDate();
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

  public async isItemBeingBuild(wpId : number): Promise<IHttpResult<{value: boolean}>> {
    const result = await this.http.get(`${this.urlBase}/${wpId!}/isBeingBuild`).toPromise();
    return result as IHttpResult<{value: boolean}>;
  }

  get observable() {
    return this.isExpandedMode.asObservable();
  }

  next(nextValue: boolean) {
    setTimeout(() => this.isExpandedMode.next(nextValue), 0);
  }

}
