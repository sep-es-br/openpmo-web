import { MilestoneStatusEnum } from './../../enums/MilestoneStatusEnum';
import { takeUntil } from 'rxjs/operators';
import { IGaugeChartData } from './../../interfaces/IGaugeChartData';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from './../../services/responsive.service';
import { Router } from '@angular/router';
import { IWorkpackCardItem } from './../../interfaces/IWorkpackCardItem';
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ChartData } from 'chart.js';
import { Subject } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-workpack-card-item',
  templateUrl: './workpack-card-item.component.html',
  styleUrls: ['./workpack-card-item.component.scss']
})
export class WorkpackCardItemComponent implements OnInit, OnDestroy {

  @Input() properties: IWorkpackCardItem;
  @Input() displayModeCard: string;

  cardIdItem: string;
  language: string;
  iconImg;
  responsive: boolean;
  cardType = 'standard';
  riskImportance = 'high';
  dashboardMilestonesData: ChartData = {
    labels: [],
    datasets: []
  };
  iconCostColor = '#888E96';
  iconScheduleColor = '#888E96';
  iconScopeColor = '#888E96';
  cpiColor: string;
  spiColor: string;
  gaugeChartDataCPI: IGaugeChartData;
  gaugeChartDataSPI: IGaugeChartData;
  $destroy = new Subject();
  attentionMilestone = false;
  milestoneStatusEnum = MilestoneStatusEnum;

  constructor(
    private router: Router,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
    });
  }

  ngOnInit(): void {
    this.cardIdItem = this.properties.itemId || this.properties.itemId === 0 ?
      `${this.properties.itemId < 10 && this.properties.itemId !== 0 ? '0' + this.properties.itemId : this.properties.itemId}` : '';
    switch (this.properties.typeCardItem) {
      case 'newCardItem':
        this.cardType = 'newCardItem';
        break;
      case 'Milestone':
        this.cardType = 'milestone';
        if (this.properties.subtitleCardItem) {
          const expirationDate = moment(this.properties.subtitleCardItem, 'yyyy-MM-DD');
          const date = moment();
          if (this.milestoneStatusEnum[this.properties.statusItem] === 'ontime' && expirationDate.isSameOrAfter(date) && expirationDate.diff(date, 'days') <= 7) {
            this.attentionMilestone = true;
          }
        }
        break;
      default:
        this.cardType = 'standard';
        break;
    }
    if (this.properties.dashboard !== null) {
      if (this.properties?.dashboard?.risk && this.properties?.dashboard?.risk?.total > 0) {
        this.riskImportance = this.properties.dashboard?.risk?.high > 0 ? 'high' : (this.properties.dashboard?.risk?.medium > 0 ? 'medium' : 'low');
      }
      if (this.properties.dashboard?.milestone && this.properties.dashboard?.milestone?.quantity > 0) {
        this.setDashboardMilestonesData();
      }
      if (this.properties.dashboard?.tripleConstraint) {
        this.loadTripleConstraintSettings();
      }
      this.loadPerformanceIndexes();
    }
    this.setLanguage();
  }

  ngOnDestroy() {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

  setGaugeChartData() {
    this.gaugeChartDataCPI = {
      value: this.properties.dashboard?.costPerformanceIndex !== null ?
        (this.properties.dashboard?.costPerformanceIndex?.indexValue !== null ? this.properties.dashboard?.costPerformanceIndex?.indexValue : 0) : null,
      labelBottom: 'CPI',
      classIconLabelBottom: 'fas fa-dollar-sign',
      valueProgressBar: this.properties.dashboard?.costPerformanceIndex !== null ? this.properties.dashboard?.costPerformanceIndex?.costVariation : null,
      maxProgressBar: this.properties.dashboard?.earnedValue,
      labelBottomProgressBar: 'CV',
    };

    this.gaugeChartDataSPI = {
      value: this.properties.dashboard?.schedulePerformanceIndex !== null ?
        (this.properties.dashboard?.schedulePerformanceIndex?.indexValue !== null ? this.properties.dashboard?.schedulePerformanceIndex?.indexValue : 0) : null,
      labelBottom: 'SPI',
      classIconLabelBottom: 'fas fa-clock',
      valueProgressBar: this.properties.dashboard?.schedulePerformanceIndex !== null ? this.properties.dashboard?.schedulePerformanceIndex?.scheduleVariation : null,
      maxProgressBar: this.properties.dashboard?.earnedValue,
      labelBottomProgressBar: 'SV',
    };

  }

  loadPerformanceIndexes() {
    if (this.properties?.dashboard?.costPerformanceIndex) {
      if (this.properties?.dashboard?.costPerformanceIndex?.indexValue < 1) {
        this.cpiColor = '#EA5C5C';
      } else {
        this.cpiColor = '#44B39B';
      }
    } else {
      this.cpiColor = '#646464';
    }
    if (this.properties?.dashboard?.schedulePerformanceIndex) {
      if (this.properties?.dashboard?.schedulePerformanceIndex?.indexValue < 1) {
        this.spiColor = '#EA5C5C';
      } else {
        this.spiColor = '#44B39B';
      }
    } else {
      this.spiColor = '#646464';
    }
    this.setGaugeChartData();
  }

  loadTripleConstraintSettings() {
    if (this.properties.dashboard && this.properties.dashboard?.tripleConstraint?.cost?.plannedValue > 0) {
      if (!!this.properties.dashboard.tripleConstraint?.cost?.variation && this.properties.dashboard?.tripleConstraint?.cost?.variation !== 0) {
        if (this.properties.dashboard.tripleConstraint?.cost?.variation > 0) {
          this.iconCostColor = '#44B39B';
        } else {
          this.iconCostColor = '#EA5C5C';
        }
      } else {
        this.iconCostColor = '#44B39B';
      }
    } else {
      if (this.properties.dashboard.tripleConstraint?.cost?.foreseenValue >= this.properties.dashboard?.tripleConstraint?.cost?.actualValue) {
        this.iconCostColor = '#888E96';
      } else {
        this.iconCostColor = '#EA5C5C';
      }
    }
    if (this.properties.dashboard && this.properties.dashboard.tripleConstraint?.schedule?.plannedValue > 0) {
      if (!!this.properties.dashboard.tripleConstraint?.schedule?.variation && this.properties?.dashboard?.tripleConstraint?.schedule?.variation !== 0) {
        if (this.properties.dashboard.tripleConstraint?.schedule?.variation > 0) {
          this.iconScheduleColor = '#44B39B';
        } else {
          this.iconScheduleColor = '#EA5C5C';
        }
      } else {
        this.iconScheduleColor = '#44B39B';
      }
    } else {
      if (this.properties.dashboard?.tripleConstraint?.schedule?.foreseenValue >= this.properties.dashboard?.tripleConstraint?.schedule?.actualValue) {
        this.iconScheduleColor = '#888E96';
      } else {
        this.iconScheduleColor = '#EA5C5C';
      }
    }

    if (this.properties.dashboard && this.properties.dashboard?.tripleConstraint?.scope?.plannedVariationPercent > 0) {
      if (!!this.properties.dashboard?.tripleConstraint?.scope?.variation && this.properties.dashboard?.tripleConstraint?.scope?.variation !== 0) {
        if (this.properties.dashboard?.tripleConstraint?.scope?.variation < 0) {
          this.iconScopeColor = '#44B39B';
        } else {
          this.iconScopeColor = '#EA5C5C';
        }
      } else {
        this.iconScopeColor = '#EA5C5C';
      }
    } else {
      if (this.properties.dashboard?.tripleConstraint?.scope?.foreseenValue >= this.properties.dashboard?.tripleConstraint?.scope?.actualValue) {
        this.iconScopeColor = '#EA5C5C';
      } else {
        this.iconScopeColor = '#44B39B';
      }
    }

  }

  setDashboardMilestonesData() {
    const milestone = this.properties.dashboard?.milestone;
    const data = milestone && [milestone.onTime, milestone.late, milestone.concluded, milestone.lateConcluded];
    if (data.filter(item => item > 0).length > 0) {
      this.dashboardMilestonesData = {
        labels: [
          this.translateSrv.instant('ontime'),
          this.translateSrv.instant('late'),
          this.translateSrv.instant('concluded'),
          this.translateSrv.instant('concludedLate'),
        ],
        datasets: [
          {
            data: [milestone.onTime ? milestone.onTime : 0 ,
                  milestone.late ? milestone.late : 0,
                  milestone.concluded ? milestone.concluded : 0,
                  milestone.lateConcluded ?  milestone.lateConcluded : 0],
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

  navigateToPage(url: string, params?: { name: string; value: string | number }[]) {
    const queryParams = params && params.reduce((obj, item) => ((obj[item.name] = item.value), obj), {});
    this.router.navigate(
      [url],
      {
        queryParams
      }
    );
  }

  getQueryParams() {
    let params = this.properties?.itemId ? { id: this.properties.itemId } : {};
    if (this.properties.paramsUrlCard) {
      params = {
        ...params,
        ... this.properties.paramsUrlCard.reduce((obj, item) => ((obj[item.name] = item.value), obj), {})
      };
    }
    return params;
  }

  validateShowTripleConstraintCost() {
    if (this.properties?.dashboard?.tripleConstraint?.cost) {
      return true;
    }
    return false;
  }

  validateShowTripleConstraintSchedule() {
    if (this.properties?.dashboard?.tripleConstraint?.schedule) {
      return true;
    }
    return false;
  }

  validateShowTripleConstraintScope() {
    if (this.properties?.dashboard?.tripleConstraint?.scope) {
      return true;
    }
    return false;
  }

  get label(): string {
    return this.properties.typeCardItem === 'Milestone' ? 'completed' : 'scopeCompleted';
  }
}

