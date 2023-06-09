import {Component, Input, OnChanges, SimpleChanges, OnDestroy, Output, EventEmitter} from '@angular/core';
import {
  IWorkpackBreakdownStructure, IWorkpackBreakdownStructureWorkpackModel,
} from 'src/app/shared/interfaces/IWorkpackBreakdownStructure';
import {TreeNode} from 'primeng/api';
import {TypeWorkpackEnumWBS} from 'src/app/shared/enums/TypeWorkpackEnum';
import {TypeWorkpackModelEnum} from 'src/app/shared/enums/TypeWorkpackModelEnum';
import {Subject} from 'rxjs';
import {MilestoneStatusEnum} from 'src/app/shared/enums/MilestoneStatusEnum';
import {TranslateService} from '@ngx-translate/core';
import {takeUntil} from 'rxjs/operators';
import * as moment from 'moment';
import {BreakdownStructureService} from 'src/app/shared/services/breakdown-structure.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ConfigDataViewService} from '../../../../shared/services/config-dataview.service';

@Component({
  selector: 'app-breakdown-structure',
  templateUrl: './breakdown-structure.component.html',
  styleUrls: ['./breakdown-structure.component.scss']
})
export class BreakdownStructureComponent implements OnChanges, OnDestroy {

  @Input() idWorkpack;
  @Output() onHasWBS = new EventEmitter();
  wbs: IWorkpackBreakdownStructure;
  typeWorkpackEnum = TypeWorkpackEnumWBS;
  typeWorkpackModelEnum = TypeWorkpackModelEnum;
  wbsTree: any = [];
  language: string;
  $destroy = new Subject();
  attentionMilestone = false;
  milestoneStatusEnum = MilestoneStatusEnum;
  label;
  isLoading = false;
  expanded = false;
  idPlan: number;

  constructor(
    private breakdownStructureSrv: BreakdownStructureService,
    private translateSrv: TranslateService,
    private actRouter: ActivatedRoute,
    private route: Router,
    private configDataSrv: ConfigDataViewService
  ) {
    this.actRouter.queryParams.subscribe(async({idPlan}) => {
      this.idPlan = idPlan && +idPlan;
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
    });
  }

  ngOnDestroy(): void {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

  async ngOnChanges(changes: SimpleChanges) {
    this.configDataSrv.observableCollapsePanelsStatus
      .pipe(takeUntil(this.$destroy))
      .subscribe(async panelStatus => {
        this.wbsTree = [];
          if (changes.idWorkpack && changes.idWorkpack.currentValue) {
            this.expanded = panelStatus === 'expand';
            await this.loadBreakdownStructure(this.idWorkpack, false);
          }
          if (this.wbs) {
            this.mapTreeNodes(this.wbs, false);
          }
      });
  }

  async loadBreakdownStructure(idWorkpack: number, isLazyLoading: boolean = false) {
    this.isLoading = true;
    const {success, data} =
      await this.breakdownStructureSrv.getByWorkpackId(idWorkpack, this.expanded && !isLazyLoading);
    if (success) {
      this.wbs = data;

      if (!isLazyLoading) {
        const hasWBS = data ? data : undefined;
        this.onHasWBS.next(hasWBS);
      }
      if (data) {
        if (isLazyLoading) {
          this.expanded = false;
          return this.mapTreeNodes(data, true);
        }
        this.mapTreeNodes(data, false);
      }
    }
  }

  async nodeExpand(event) {
    const idWorkpack = event.node?.idWorkpack;
    if (idWorkpack && event.node?.children?.length === 0) {
      const children = await this.loadBreakdownStructure(idWorkpack, true);
      event.node.children = children && children.length > 0 ? children[0].children : [];
      this.isLoading = false;
    }
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

  mapTreeNodes(data: IWorkpackBreakdownStructure, isLazyLoading: boolean = false) {
    const expanded = this.expanded;
    const tree = [{
      ...data,
      label: data.workpackName,
      properties: this.buildProperties(data),
      expanded,
      leaf: !data.hasChildren,
      children: this.mapTreeNodesChildren(data.workpackModels, false)
    }];
    if (isLazyLoading) {
      return tree;
    }
    this.wbsTree = tree;
    this.isLoading = false;
  }

  mapTreeNodesChildren(data: IWorkpackBreakdownStructure[] | IWorkpackBreakdownStructureWorkpackModel[],
                       isWorkpack: boolean): TreeNode[] {
    const tree = [];
    const expanded = this.expanded;
    data.forEach(item => {
      const workpackOrWorkpackModels = isWorkpack ? item.workpackModels : item.workpacks;
      const node: any = {
        ...item,
        expanded,
        leaf: isWorkpack ? !item.hasChildren : false,
        label: isWorkpack ? item.workpackName : item.workpackModelName,
        properties: this.buildProperties(item),
        children: this.mapTreeNodesChildren(workpackOrWorkpackModels, !isWorkpack)
      };
      tree.push(node);
    });
    return tree;
  }

  buildProperties(item: IWorkpackBreakdownStructure) {
    if (!item?.dashboard && ![this.typeWorkpackEnum.Deliverable, this.typeWorkpackEnum.Milestone].includes(item?.workpackType)) {
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
    if (item?.dashboard?.risk && item?.dashboard?.risk?.total > 0) {
      properties.riskImportance = item.dashboard?.risk?.high > 0 ?
        'high' :
        (item.dashboard?.risk?.medium > 0 ? 'medium' : 'low');
    }
    if (item.dashboard?.milestone && item.dashboard?.milestone?.quantity > 0) {
      properties.dashboardMilestonesData = this.setDashboardMilestonesData(item);
    }
    if (item.dashboard?.tripleConstraint) {
      const {iconCostColor, iconScheduleColor, iconScopeColor} = this.loadTripleConstraintSettings(item);
      properties.iconCostColor = iconCostColor;
      properties.iconScheduleColor = iconScheduleColor;
      properties.iconScopeColor = iconScopeColor;

    }
    const {cpiColor, spiColor, gaugeChartDataCPI, gaugeChartDataSPI} = this.loadPerformanceIndexes(item);
    properties.cpiColor = cpiColor;
    properties.spiColor = spiColor;
    properties.gaugeChartDataCPI = gaugeChartDataCPI;
    properties.gaugeChartDataSPI = gaugeChartDataSPI;
    properties.progressBars = this.buildSchedules(item);
    return properties;
  }

  buildSchedules(data: IWorkpackBreakdownStructure) {
    if (data.workpackType !== this.typeWorkpackEnum.Deliverable) {
      return null;
    }
    const startDate = data && new Date(data.start + 'T00:00:00');
    const endDate = data && new Date(data.end + 'T00:00:00');
    if (!startDate || !endDate) {
      return null;
    }
    const initialDatePlanned = moment(startDate);
    const finalDatePlanned = moment(endDate);
    const daysToPlanned = finalDatePlanned.diff(initialDatePlanned, 'days');
    const dateActual = moment(new Date());
    const daysToNow = dateActual.diff(initialDatePlanned, 'days');
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

  validateShowTripleConstraintCost(properties: IWorkpackBreakdownStructure) {
    if (properties?.dashboard?.tripleConstraint?.cost &&
      properties?.dashboard?.tripleConstraint?.cost?.foreseenValue > 0) {
      return true;
    }
    return false;
  }

  validateShowTripleConstraintSchedule(properties: IWorkpackBreakdownStructure) {
    if (properties?.dashboard?.tripleConstraint?.schedule &&
      properties?.dashboard?.tripleConstraint?.schedule?.foreseenStartDate !== null) {
      return true;
    }
    return false;
  }

  validateShowTripleConstraintScope(properties: IWorkpackBreakdownStructure) {
    if (properties?.dashboard?.tripleConstraint?.scope &&
      properties?.dashboard?.tripleConstraint?.scope?.foreseenValue > 0) {
      return true;
    }
    return false;
  }

  setGaugeChartData(properties: IWorkpackBreakdownStructure) {
    const gaugeChartDataCPI = {
      value: properties.dashboard?.costPerformanceIndex !== null ?
        (properties.dashboard?.costPerformanceIndex?.indexValue !== null ?
          properties.dashboard?.costPerformanceIndex?.indexValue : 0) :
        null,
      labelBottom: 'CPI',
      classIconLabelBottom: 'fas fa-dollar-sign',
      valueProgressBar: properties.dashboard?.costPerformanceIndex !== null ?
        properties.dashboard?.costPerformanceIndex?.costVariation :
        null,
      maxProgressBar: properties.dashboard?.earnedValue,
      labelBottomProgressBar: 'CV',
    };

    const gaugeChartDataSPI = {
      value: properties.dashboard?.schedulePerformanceIndex !== null ?
        (properties.dashboard?.schedulePerformanceIndex?.indexValue !== null ?
          properties.dashboard?.schedulePerformanceIndex?.indexValue :
          0) : null,
      labelBottom: 'SPI',
      classIconLabelBottom: 'fas fa-clock',
      valueProgressBar: properties.dashboard?.schedulePerformanceIndex !== null ?
        properties.dashboard?.schedulePerformanceIndex?.scheduleVariation :
        null,
      maxProgressBar: properties.dashboard?.earnedValue,
      labelBottomProgressBar: 'SV',
    };

    return {gaugeChartDataCPI, gaugeChartDataSPI};
  }

  loadPerformanceIndexes(properties: IWorkpackBreakdownStructure) {
    let cpiColor = '#f5f5f5';
    let spiColor = '#f5f5f5';
    if (properties?.dashboard?.costPerformanceIndex) {
      if (properties?.dashboard?.costPerformanceIndex?.indexValue < 1) {
        cpiColor = '#EA5C5C';
      } else {
        cpiColor = '#44B39B';
      }
    } else {
      cpiColor = '#646464';
    }
    if (properties?.dashboard?.schedulePerformanceIndex) {
      if (properties?.dashboard?.schedulePerformanceIndex?.indexValue < 1) {
        spiColor = '#EA5C5C';
      } else {
        spiColor = '#44B39B';
      }
    } else {
      spiColor = '#646464';
    }

    const {gaugeChartDataCPI, gaugeChartDataSPI} = this.setGaugeChartData(properties);
    return {cpiColor, spiColor, gaugeChartDataCPI, gaugeChartDataSPI};
  }

  loadTripleConstraintSettings(properties: IWorkpackBreakdownStructure) {
    let iconCostColor = '#f5f5f5';
    let iconScheduleColor = '#f5f5f5';
    let iconScopeColor = '#f5f5f5';

    if (properties.dashboard &&
      (!properties.dashboard?.tripleConstraint?.cost ||
        properties.dashboard?.tripleConstraint?.cost?.foreseenValue === 0)) {
      iconCostColor = '#f5f5f5';
    } else {
      if (properties.dashboard && properties.dashboard?.tripleConstraint?.cost?.plannedValue > 0) {
        if (!!properties.dashboard.tripleConstraint?.cost?.variation &&
          properties.dashboard?.tripleConstraint?.cost?.variation !== 0) {
          if (properties.dashboard.tripleConstraint?.cost?.variation > 0) {
            iconCostColor = '#44B39B';
          } else {
            iconCostColor = '#EA5C5C';
          }
        } else {
          iconCostColor = '#44B39B';
        }
      } else {
        if (properties.dashboard.tripleConstraint?.cost?.foreseenValue >=
          properties.dashboard?.tripleConstraint?.cost?.actualValue) {
          iconCostColor = '#888E96';
        } else {
          iconCostColor = '#EA5C5C';
        }
      }
    }

    if (properties.dashboard && (!properties.dashboard?.tripleConstraint?.schedule ||
      properties?.dashboard?.tripleConstraint?.schedule?.foreseenStartDate === null)) {
      iconScheduleColor = '#f5f5f5';
    } else {
      if (properties.dashboard && properties.dashboard.tripleConstraint?.schedule?.plannedValue > 0) {
        if (!!properties.dashboard.tripleConstraint?.schedule?.variation &&
          properties?.dashboard?.tripleConstraint?.schedule?.variation !== 0) {
          if (properties.dashboard.tripleConstraint?.schedule?.variation > 0) {
            iconScheduleColor = '#44B39B';
          } else {
            iconScheduleColor = '#EA5C5C';
          }
        } else {
          iconScheduleColor = '#44B39B';
        }
      } else {
        if (properties.dashboard?.tripleConstraint?.schedule?.foreseenValue >=
          properties.dashboard?.tripleConstraint?.schedule?.actualValue) {
          iconScheduleColor = '#888E96';
        } else {
          iconScheduleColor = '#EA5C5C';
        }
      }
    }

    if (properties.dashboard && (!properties.dashboard?.tripleConstraint?.cost ||
      properties?.dashboard?.tripleConstraint?.scope?.foreseenValue === 0)) {
      iconScopeColor = '#f5f5f5';
    } else {
      if (properties.dashboard && properties.dashboard?.tripleConstraint?.scope?.plannedVariationPercent > 0) {
        if (!!properties.dashboard?.tripleConstraint?.scope?.variation &&
          properties.dashboard?.tripleConstraint?.scope?.variation !== 0) {
          if (properties.dashboard?.tripleConstraint?.scope?.variation < 0) {
            iconScopeColor = '#44B39B';
          } else {
            iconScopeColor = '#EA5C5C';
          }
        } else {
          iconScopeColor = '#EA5C5C';
        }
      } else {
        if (properties.dashboard?.tripleConstraint?.scope?.foreseenValue >=
          properties.dashboard?.tripleConstraint?.scope?.actualValue) {
          iconScopeColor = '#EA5C5C';
        } else {
          iconScopeColor = '#44B39B';
        }
      }
    }

    return {iconCostColor, iconScheduleColor, iconScopeColor};
  }

  setDashboardMilestonesData(properties: IWorkpackBreakdownStructure) {
    const milestone = properties.dashboard?.milestone;
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

  navigateToWorkpack(idWorkpack) {
    this.route.navigate(['/workpack'], {
      queryParams: {
        id: idWorkpack,
        idPlan: this.idPlan
      }
    });
  }

}
