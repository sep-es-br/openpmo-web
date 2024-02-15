import { TypeWorkpackEnum, TypeWorkpackEnumWBS } from './../enums/TypeWorkpackEnum';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IWorkpackBreakdownStructure, IWorkpackBreakdownStructureWorkpackModel } from '../interfaces/IWorkpackBreakdownStructure';
import { IHttpResult } from '../interfaces/IHttpResult';
import { WorkpackService } from './workpack.service';
import { BehaviorSubject } from 'rxjs';
import { IWorkpackData } from '../interfaces/IWorkpackDataParams';
import { TreeNode } from 'primeng/api';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class BreakdownStructureService extends BaseService<IWorkpackBreakdownStructure> {

  private resetBreakdownStructure = new BehaviorSubject<boolean>(false);
  workpackData: IWorkpackData;
  wbs: IWorkpackBreakdownStructure;
  expandedAllDone = false;
  expandedAll = false;
  wbsTree: any = [];
  typeWorkpackEnum = TypeWorkpackEnumWBS;
  loading;

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService
  ) {
    super('eap', injector);
  }

  nextResetBreakdownStructure(nextValue: boolean) {
    this.resetBreakdownStructure.next(nextValue);
  }

  get observableResetBreakdownStructure() {
    return this.resetBreakdownStructure.asObservable();
  }

  resetBreakdownStructureData() {
    this.wbsTree = [];
    this.wbs = undefined;
    this.expandedAllDone = false;
    this.expandedAll = false;
    this.loading = true;
    this.nextResetBreakdownStructure(true);
  }

  getWBSTree() {
    return { 
      wbsTree: this.wbsTree,
      loading: this.loading
    };
  }

  async loadBreakdownStructure(lazyLoading, idWorkpack: number) {
    this.loading = true;
    this.workpackData = this.workpackSrv.getWorkpackData();
    if (this.workpackData && this.workpackData.workpack && this.workpackData.workpack.hasWBS !== false) {
      await this.loadBWS(idWorkpack, lazyLoading);
      this.loading = false;
      this.nextResetBreakdownStructure(true);
    }
  }

  async loadBWS(idWorkpack: number, isLazyLoading) {
    this.wbsTree = await this.getBreakdownStructureData(idWorkpack, isLazyLoading);
  }

  async getBreakdownStructureData(idWorkpack: number, isLazyLoading) {
    const { success, data } =
      await this.getByWorkpackId(idWorkpack, !isLazyLoading);
    if (success) {
      this.wbs = data;
      if (data) {
          return this.mapTreeNodes(data);
      }
    }
  }

  async loadBWSExpandedAll(idWorkpack) {
    if (this.loading) {
      return;
    }
    this.expandedAll = true;
    this.loading = true;
    if (!!this.expandedAllDone && this.wbsTree && this.wbsTree.length > 0) {
      this.wbsTree = [{
        ...this.wbsTree[0],
        children: this.nodeExpandAll(this.wbsTree[0].children)
      }];
      this.loading = false;
      this.nextResetBreakdownStructure(true);
    } else {
      this.loading = true;
      this.expandedAllDone = true;
      this.wbsTree = await this.getBreakdownStructureData(idWorkpack, false);
      this.loading = false;
      this.nextResetBreakdownStructure(true);
    }
    
  }

  nodeExpandAll(nodeList) {
    return nodeList ? nodeList.map(node => ({
      ...node,
      expanded: true,
      children: node.children ? this.nodeExpandAll(node.children) : []
    })) : [];
  }

  async nodeExpand(event) {
    this.loading = true;
    const idWorkpack = event.node?.idWorkpack;
    if (idWorkpack && event.node?.children?.length === 0) {
      const children = await this.getBreakdownStructureData(idWorkpack, true);
      event.node.children = children && children.length > 0 ? children[0].children : [];
      this.loading = false;
      this.nextResetBreakdownStructure(true);
    }
  }

  collapseAll() {
    this.loading = true;
    this.expandedAll = false;
    this.wbsTree = [{
      ...this.wbsTree[0],
      children: this.nodeCollapse(this.wbsTree[0].children, 0)
    }];
    this.loading = false;
    this.nextResetBreakdownStructure(true);
  }

  nodeCollapse(nodeList, level) {
    level++;
    return nodeList ? nodeList.map(node => ({
      ...node,
      expanded: level <= 1,
      children: node.children ? this.nodeCollapse(node.children, level) : []
    })) : [];
  }

  mapTreeNodes(data: IWorkpackBreakdownStructure) {
    const dashboardData = (data.dashboard || data.milestones || data.risks) && this.loadDashboardData(data.dashboard, data.milestones, data.risks);
    if (dashboardData) {
      data.dashboardData = dashboardData;
    }
    const tree = [{
      ...data,
      label: data.workpackName,
      properties: this.buildProperties(data),
      expanded: true,
      leaf: !data.hasChildren,
      children: this.mapTreeNodesChildren(data.workpackModels, false, 1)
    }];
    return tree;
  }

  mapTreeNodesChildren(data: IWorkpackBreakdownStructure[] | IWorkpackBreakdownStructureWorkpackModel[],
    isWorkpack: boolean, level: number): TreeNode[] {
    const tree = [];
    const expanded = !this.expandedAll ? level <= 1 : true;
    data.forEach(item => {
      const workpackOrWorkpackModels = isWorkpack ? item.workpackModels : item.workpacks;
      const dashboardData = (item.dashboard || item.risks || item.milestones) && this.loadDashboardData(item.dashboard, item.milestones, item.risks);
      if (dashboardData) {
        item.dashboardData = dashboardData;
      }

      const workpackItem = [this.typeWorkpackEnum.Milestone].includes(item.workpackType) ? this.setMilestoneStatus(item) : item;
      const node: any = {
        ...workpackItem,
        expanded,
        leaf: isWorkpack ? !item.hasChildren : false,
        label: isWorkpack ? item.workpackName : item.workpackModelName,
        properties: this.buildProperties(item),
        children: this.mapTreeNodesChildren(workpackOrWorkpackModels, !isWorkpack, level + 1)
      };
      tree.push(node);
    });
    return tree;
  }

  setMilestoneStatus(milestone) {
    milestone.expirationDate = milestone.milestoneDate;
      if (milestone.completed) {
        if (!milestone.snapshotDate) {
          milestone.milestoneStatus = 'CONCLUDED';
          return milestone;
        } else {
          const milestoneDate = moment(milestone.milestoneDate, 'yyyy-MM-DD');
          const snapshotDate = moment(milestone.snapshotDate, 'yyyy-MM-DD');
          if (milestoneDate.isSameOrBefore(snapshotDate)) {
            milestone.milestoneStatus = 'CONCLUDED';
            return milestone;
          } else {
            milestone.milestoneStatus = 'LATE_CONCLUDED';
            return milestone;
          }
        }
      } else {
        const today = moment();
        const milestoneDate = moment(milestone.milestoneDate, 'yyyy-MM-DD');
        if (milestoneDate.isBefore(today)) {
          milestone.milestoneStatus = 'LATE';
          return milestone;
        } else {
          milestone.milestoneStatus = 'ON_TIME';
          return milestone;
        }
      }
  }

  buildProperties(item: IWorkpackBreakdownStructure) {
    if (!item?.dashboardData && ![this.typeWorkpackEnum.Milestone].includes(item?.workpackType)) {
      return null;
    }
    const properties = {
      dashboardMilestonesData: null,
      riskImportance: null,
      iconCostColor: null,
      iconScheduleColor: null,
      iconScopeColor: null,
      cpiColor: null,
      spiColor: null,
      gaugeChartDataCPI: null,
      gaugeChartDataSPI: null,
      progressBars: null,
    };
    if (item?.dashboardData?.risk && item?.dashboardData?.risk?.total > 0) {
      properties.riskImportance = item.dashboardData?.risk?.high > 0 ?
        'high' :
        (item.dashboardData?.risk?.medium > 0 ? 'medium' : 'low');
    }
    if (item.dashboardData?.milestone && item.dashboardData?.milestone?.quantity > 0) {
      properties.dashboardMilestonesData = this.setDashboardMilestonesData(item);
    }
    if (item.dashboardData?.tripleConstraint) {
      const { iconCostColor, iconScheduleColor, iconScopeColor } = this.loadTripleConstraintSettings(item);
      properties.iconCostColor = iconCostColor;
      properties.iconScheduleColor = iconScheduleColor;
      properties.iconScopeColor = iconScopeColor;

    }
    const { cpiColor, spiColor, gaugeChartDataCPI, gaugeChartDataSPI } = this.loadPerformanceIndexes(item);
    properties.cpiColor = cpiColor;
    properties.spiColor = spiColor;
    properties.gaugeChartDataCPI = gaugeChartDataCPI;
    properties.gaugeChartDataSPI = gaugeChartDataSPI;
    properties.progressBars = this.buildSchedules(item);
    return properties;
  }

  loadDashboardData(dashboard?, milestones?, risks?) {
    const dashboardData =  {
      tripleConstraint: dashboard && dashboard.tripleConstraint && {
        idBaseline: dashboard.tripleConstraint?.idBaseline,
        cost: {
          actualValue: dashboard.tripleConstraint?.costActualValue,
          foreseenValue: dashboard.tripleConstraint?.costForeseenValue,
          plannedValue: dashboard.tripleConstraint?.costPlannedValue,
          variation: dashboard.tripleConstraint?.costVariation,
        },
        schedule: {
          actualEndDate: dashboard.tripleConstraint?.scheduleActualEndDate,
          actualStartDate: dashboard.tripleConstraint?.scheduleActualStartDate,
          actualValue: dashboard.tripleConstraint?.scheduleActualValue,
          foreseenEndDate: dashboard.tripleConstraint?.scheduleForeseenEndDate,
          foreseenStartDate: dashboard.tripleConstraint?.scheduleForeseenStartDate,
          foreseenValue: dashboard.tripleConstraint?.scheduleForeseenValue,
          plannedEndDate: dashboard.tripleConstraint?.schedulePlannedEndDate,
          plannedStartDate: dashboard.tripleConstraint?.schedulePlannedStartDate,
          plannedValue: dashboard.tripleConstraint?.schedulePlannedValue,
          variation: dashboard.tripleConstraint?.scheduleVariation
        },
        scope: {
          actualVariationPercent: dashboard.tripleConstraint?.scopeActualVariationPercent,
          foreseenVariationPercent: dashboard.tripleConstraint?.scopeForeseenVariationPercent,
          plannedVariationPercent: dashboard.tripleConstraint?.scopePlannedVariationPercent,
          foreseenValue: dashboard.tripleConstraint?.scopeForeseenValue,
          actualValue: dashboard.tripleConstraint?.scopeActualValue,
          plannedValue: dashboard.tripleConstraint?.scopePlannedValue,
          variation: dashboard.tripleConstraint?.scopeVariation,
          foreseenWorkRefMonth: dashboard.tripleConstraint?.scopeForeseenWorkRefMonth
        }
      },
      earnedValue: dashboard && dashboard.performanceIndex && dashboard.performanceIndex?.earnedValue,
      costPerformanceIndex: dashboard && dashboard.performanceIndex && dashboard.performanceIndex?.costPerformanceIndexValue ? {
        costVariation: dashboard.performanceIndex?.costPerformanceIndexVariation,
        indexValue: dashboard.performanceIndex?.costPerformanceIndexValue
      } : null,
      schedulePerformanceIndex: dashboard && dashboard.performanceIndex && dashboard.performanceIndex?.schedulePerformanceIndexValue ? {
        indexValue: dashboard.performanceIndex?.schedulePerformanceIndexValue,
        scheduleVariation: dashboard.performanceIndex?.schedulePerformanceIndexVariation
      } : null,
      risk: risks,
      milestone: milestones
    };
   
    return dashboardData;
  }

  buildSchedules(data: IWorkpackBreakdownStructure) {
    if (data.workpackType !== this.typeWorkpackEnum.Deliverable) {
      return null;
    }

    data.baselineCost = data?.dashboard?.tripleConstraint?.costPlannedValue;
    data.planedCost = data?.dashboard?.tripleConstraint?.costForeseenValue;
    data.actualCost = data?.dashboard?.tripleConstraint?.costActualValue;
    data.start = data?.dashboard?.tripleConstraint?.scheduleForeseenStartDate;
    data.end = data?.dashboard?.tripleConstraint?.scheduleForeseenEndDate;
    data.baselineStart = data?.dashboard?.tripleConstraint?.schedulePlannedStartDate;
    data.baselineEnd = data?.dashboard?.tripleConstraint?.schedulePlannedEndDate;
    data.baselinePlanned = data?.dashboard?.tripleConstraint?.scopePlannedValue;
    data.unitMeasure = data.unitMeasure;
    data.planed = data?.dashboard?.tripleConstraint?.scopeForeseenValue;
    data.actual = data?.dashboard?.tripleConstraint?.scopeActualValue;

    const startDate = data && new Date(data.start + 'T00:00:00');
    const endDate = data && new Date(data.end + 'T00:00:00');
    if (!startDate || !endDate) {
      return null;
    }
    const initialDatePlanned = moment(startDate);
    const finalDatePlanned = moment(endDate);
    const daysToPlanned = finalDatePlanned.diff(initialDatePlanned, 'days');
    const dateActual = moment(new Date());
    const daysToNow = finalDatePlanned.isSameOrBefore(dateActual) ?
      finalDatePlanned.diff(initialDatePlanned, 'days') : dateActual.diff(initialDatePlanned, 'days');
    const baselineStartDate = data && new Date(data?.baselineStart + 'T00:00:00');
    const baselineEndDate = data && new Date(data?.baselineEnd + 'T00:00:00');
    const baselineDaysPlanned = moment(baselineEndDate).diff(moment(baselineStartDate), 'days');
    const progressBarValues = [
      {
        total: data?.planedCost,
        progress: data?.actualCost,
        labelTotal: 'planned',
        labelProgress: 'actual',
        valueUnit: 'currency',
        color: '#6cd3bd',
        barHeight: 17,
        baselinePlanned: Number(data?.baselineCost?.toFixed(data?.unitMeasure?.precision)),
        type: 'cost'
      },
      {
        total: Number(data?.planed?.toFixed(data?.unitMeasure?.precision)),
        progress: Number(data?.actual?.toFixed(data?.unitMeasure?.precision)),
        labelTotal: 'planned',
        labelProgress: 'actual',
        valueUnit: data?.unitMeasure && data?.unitMeasure?.name,
        color: 'rgba(236, 125, 49, 1)',
        barHeight: 17,
        baselinePlanned: Number(data?.baselinePlanned?.toFixed(data?.unitMeasure?.precision)),
        type: 'scope'
      },
      {
        total: daysToPlanned,
        progress: daysToNow < 0 ? 0 : daysToNow,
        labelTotal: 'planned',
        labelProgress: 'actual',
        valueUnit: 'time',
        color: '#659ee1',
        barHeight: 17,
        baselinePlanned: baselineDaysPlanned,
        startDateBaseline: baselineStartDate,
        endDateBaseline: baselineEndDate,
        startDateTotal: startDate,
        endDateTotal: endDate,
        type: 'schedule'
      }
    ];
    return progressBarValues;
  }

  loadPerformanceIndexes(properties: IWorkpackBreakdownStructure) {
    let cpiColor = '#f5f5f5';
    let spiColor = '#f5f5f5';
    if (properties?.dashboardData && properties?.dashboardData?.costPerformanceIndex) {
      if (properties?.dashboardData?.costPerformanceIndex?.indexValue < 1) {
        cpiColor = '#EA5C5C';
      } else {
        cpiColor = '#0081c1';
      }
    } else {
      cpiColor = '#646464';
    }
    if (properties?.dashboardData && properties?.dashboardData?.schedulePerformanceIndex) {
      if (properties?.dashboardData?.schedulePerformanceIndex?.indexValue < 1) {
        spiColor = '#EA5C5C';
      } else {
        spiColor = '#0081c1';
      }
    } else {
      spiColor = '#646464';
    }

    const { gaugeChartDataCPI, gaugeChartDataSPI } = this.setGaugeChartData(properties);
    return { cpiColor, spiColor, gaugeChartDataCPI, gaugeChartDataSPI };
  }

  loadTripleConstraintSettings(properties: IWorkpackBreakdownStructure) {
    let iconCostColor = '#f5f5f5';
    let iconScheduleColor = '#f5f5f5';
    let iconScopeColor = '#f5f5f5';

    if (properties.dashboardData &&
      (!properties.dashboardData?.tripleConstraint?.cost ||
        properties.dashboardData?.tripleConstraint?.cost?.foreseenValue === 0)) {
      iconCostColor = '#f5f5f5';
    } else {
      if (properties.dashboardData && properties.dashboardData?.tripleConstraint?.cost?.plannedValue > 0) {
        if (!!properties.dashboardData.tripleConstraint?.cost?.variation &&
          properties.dashboardData?.tripleConstraint?.cost?.variation !== 0) {
          if (properties.dashboardData.tripleConstraint?.cost?.variation > 0) {
            iconCostColor = '#44B39B';
          } else {
            iconCostColor = '#EA5C5C';
          }
        } else {
          iconCostColor = '#44B39B';
        }
      } else {
        if (properties.dashboardData.tripleConstraint?.cost?.foreseenValue >=
          properties.dashboardData?.tripleConstraint?.cost?.actualValue) {
          iconCostColor = '#888E96';
        } else {
          iconCostColor = '#EA5C5C';
        }
      }
    }

    if (properties.dashboardData && (!properties.dashboardData?.tripleConstraint?.schedule ||
      properties?.dashboardData?.tripleConstraint?.schedule?.foreseenStartDate === null)) {
      iconScheduleColor = '#f5f5f5';
    } else {
      if (properties.dashboardData && properties.dashboardData.tripleConstraint?.schedule?.plannedValue > 0) {
        if (!!properties.dashboardData.tripleConstraint?.schedule?.variation &&
          properties?.dashboardData?.tripleConstraint?.schedule?.variation !== 0) {
          if (properties.dashboardData.tripleConstraint?.schedule?.variation > 0) {
            iconScheduleColor = '#44B39B';
          } else {
            iconScheduleColor = '#EA5C5C';
          }
        } else {
          iconScheduleColor = '#44B39B';
        }
      } else {
        if (properties.dashboardData?.tripleConstraint?.schedule?.foreseenValue >=
          properties.dashboardData?.tripleConstraint?.schedule?.actualValue) {
          iconScheduleColor = '#888E96';
        } else {
          iconScheduleColor = '#EA5C5C';
        }
      }
    }

    if (properties.dashboardData && (!properties.dashboardData?.tripleConstraint?.cost ||
      properties?.dashboardData?.tripleConstraint?.scope?.foreseenValue === 0)) {
      iconScopeColor = '#f5f5f5';
    } else {
      if (properties.dashboardData && properties.dashboardData?.tripleConstraint?.scope?.plannedVariationPercent > 0) {
        if (!!properties.dashboardData?.tripleConstraint?.scope?.variation &&
          properties.dashboardData?.tripleConstraint?.scope?.variation !== 0) {
          if (properties.dashboardData?.tripleConstraint?.scope?.variation < 0) {
            iconScopeColor = '#44B39B';
          } else {
            iconScopeColor = '#EA5C5C';
          }
        } else {
          iconScopeColor = '#44B39B';
        }
      } else {
        if (properties.dashboardData?.tripleConstraint?.scope?.foreseenWorkRefMonth && 
            properties.dashboardData?.tripleConstraint?.scope?.foreseenWorkRefMonth >=
          properties.dashboardData?.tripleConstraint?.scope?.actualValue) {
          iconScopeColor = '#EA5C5C';
        } else {
          iconScopeColor = '#44B39B';
        }
      }
    }

    return { iconCostColor, iconScheduleColor, iconScopeColor };
  }

  setDashboardMilestonesData(properties: IWorkpackBreakdownStructure) {
    const milestone = properties.dashboardData?.milestone;
    const data = milestone && [milestone.onTime, milestone.late, milestone.concluded, milestone.lateConcluded];
    if (data.filter(item => item > 0).length > 0) {
      return {
        labels: [
          this.translateSrv.instant('ontime'),
          this.translateSrv.instant('late'),
          this.translateSrv.instant('concluded'),
          this.translateSrv.instant('lateConcluded'),
        ],
        datasets: [
          {
            data: [milestone.onTime ? milestone.onTime : 0,
            milestone.late ? milestone.late : 0,
            milestone.concluded ? milestone.concluded : 0,
            milestone.lateConcluded ? milestone.lateConcluded : 0],
            backgroundColor: [
              '#00b89c',
              '#fa4c4f',
              '#0081c1',
              '#7C75B9',
            ],
          }]
      };
    }
  }

  setGaugeChartData(properties: IWorkpackBreakdownStructure) {
    const gaugeChartDataCPI = (properties.dashboardData && properties.dashboardData.costPerformanceIndex) && {
      value: properties.dashboardData?.costPerformanceIndex !== null ?
        (properties.dashboardData?.costPerformanceIndex?.indexValue !== null ?
          properties.dashboardData?.costPerformanceIndex?.indexValue : 0) :
        null,
      labelBottom: 'CPI',
      classIconLabelBottom: 'fas fa-dollar-sign',
      valueProgressBar: properties.dashboardData?.costPerformanceIndex !== null ?
        properties.dashboardData?.costPerformanceIndex?.costVariation :
        null,
      maxProgressBar: properties.dashboardData?.earnedValue,
      labelBottomProgressBar: 'CV',
    };

    const gaugeChartDataSPI = (properties.dashboardData && properties.dashboardData.schedulePerformanceIndex) && {
      value: properties.dashboardData?.schedulePerformanceIndex !== null ?
        (properties.dashboardData?.schedulePerformanceIndex?.indexValue !== null ?
          properties.dashboardData?.schedulePerformanceIndex?.indexValue :
          0) : null,
      labelBottom: 'SPI',
      classIconLabelBottom: 'fas fa-clock',
      valueProgressBar: properties.dashboardData?.schedulePerformanceIndex !== null ?
        properties.dashboardData?.schedulePerformanceIndex?.scheduleVariation :
        null,
      maxProgressBar: properties.dashboardData?.earnedValue,
      labelBottomProgressBar: 'SV',
    };

    return { gaugeChartDataCPI, gaugeChartDataSPI };
  }

  async getByWorkpackId(idWorkpack: number, allLevels: boolean): Promise<IHttpResult<IWorkpackBreakdownStructure>> {
    return await this.http.get<IHttpResult<IWorkpackBreakdownStructure>>
      (`${this.urlBase}/${idWorkpack}?allLevels=${allLevels}`).toPromise();
  }

}
