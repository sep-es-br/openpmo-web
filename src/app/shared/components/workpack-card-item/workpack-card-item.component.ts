import { MilestoneStatusEnum } from './../../enums/MilestoneStatusEnum';
import { takeUntil } from 'rxjs/operators';
import { IGaugeChartData } from './../../interfaces/IGaugeChartData';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from './../../services/responsive.service';
import { Router } from '@angular/router';
import { IWorkpackCardItem } from './../../interfaces/IWorkpackCardItem';
import { Component, OnInit, Input, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ChartData } from 'chart.js';
import { Subject } from 'rxjs';
import * as moment from 'moment';
import { WorkpackService } from '../../services/workpack.service';
import { MessageService } from 'primeng/api';
import { JournalService } from '../../services/journal.service';

@Component({
  selector: 'app-workpack-card-item',
  templateUrl: './workpack-card-item.component.html',
  styleUrls: ['./workpack-card-item.component.scss']
})
export class WorkpackCardItemComponent implements OnInit, OnDestroy {

  @ViewChild('newItemIcon') newItemIcon: ElementRef;

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

  milestoneDate: Date = null;
  showReasonModal: boolean;
  reasonValue: string = '';
  showReasonButtons = false;
  milestoneMidleTextBottom: string;
  enable = true;

  constructor(
    private router: Router,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private workpackSrv: WorkpackService,
    private messageSrv: MessageService,
    private journalSrv: JournalService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
    });
  }

  ngOnInit(): void {
    this.cardIdItem = this.properties.itemId || this.properties.itemId === 0 ?
      `${this.properties.itemId < 10 && this.properties.itemId !== 0 ? '0' + this.properties.itemId : this.properties.itemId}` : '';
    if (this.properties.subtitleCardItem) {
      this.setMilestoneDateProperty();
    }
    switch (this.properties.typeCardItem) {
      case 'newCardItem':
        this.cardType = 'newCardItem';
        break;
      case 'Milestone':
        this.cardType = 'milestone';
        if (this.properties.subtitleCardItem) {
          const expirationDate = moment(this.properties.subtitleCardItem, 'yyyy-MM-DD');
          const date = moment();
          if (this.properties.statusItem === 'ontime' && (expirationDate.diff(date, 'days') <= 7)) {
            this.attentionMilestone = true;
          }
        }
        break;
      default:
        this.cardType = 'standard';
        break;
    }
    if (this.properties.dashboardData !== null) {
      if (this.properties?.dashboardData?.risk && this.properties?.dashboardData?.risk?.total > 0) {
        this.riskImportance = this.properties.dashboardData?.risk?.high > 0 ?
          'high' :
          (this.properties.dashboardData?.risk?.medium > 0 ? 'medium' : 'low');
      }
      if (this.properties.dashboardData?.milestone && this.properties.dashboardData?.milestone?.quantity > 0) {
        this.setDashboardMilestonesData();
      }
      if (this.properties.dashboardData?.tripleConstraint) {
        this.loadTripleConstraintSettings();
      }
      this.loadPerformanceIndexes();
    }
    this.setLanguage();
  }

  changeMilestoneDate(event: any) {
    this.workpackSrv.nextPendingChanges(true);
    const momentEvent = moment(event).format('yyyy-MM-DD');
    const momentProp = moment(this.properties.subtitleCardItem, 'yyyy-MM-DD');
    const diffEventProp = moment(momentEvent).diff(momentProp, 'days');
    if (!isNaN(diffEventProp) && diffEventProp !== 0) {
      if (!!this.properties.hasBaseline) {
        this.showReasonModal = true;
        this.showReasonButtons = false;
        this.reasonValue = '';
      } else {
        this.showReasonButtons = true;
        this.showReasonModal = false;
      }
      this.milestoneDate = event;
    }
  }

  async saveReason() {
    this.showReasonModal = false;
    this.workpackSrv.nextPendingChanges(false);
    const dateReason = {
      date: moment(this.milestoneDate).format('yyyy-MM-DD'),
      reason: this.reasonValue
    };
    const { success } = await this.workpackSrv.patchMilestoneReason(this.properties.itemId, dateReason);
    if (success) {
      this.properties.subtitleCardItem = moment(this.milestoneDate).format('yyyy-MM-DD');
    } else {
      this.setMilestoneDateProperty();
    }
    this.messageSrv.add({
      severity: 'success',
      summary: this.translateSrv.instant('success'),
      detail: this.translateSrv.instant('messages.savedSuccessfully')
    });
  }

  async saveDate() {
    this.showReasonButtons = false;
    this.workpackSrv.nextPendingChanges(false);
    const dateReason = {
      date: moment(this.milestoneDate).format('yyyy-MM-DD'),
    };
    const { success } = await this.workpackSrv.patchMilestoneReason(this.properties.itemId, dateReason);
    if (success) {
      this.properties.subtitleCardItem = moment(this.milestoneDate).format('yyyy-MM-DD');
    } else {
      this.setMilestoneDateProperty();
    }
    this.messageSrv.add({
      severity: 'success',
      summary: this.translateSrv.instant('success'),
      detail: this.translateSrv.instant('messages.savedSuccessfully')
    });
  }

  cancelReason() {
    this.workpackSrv.nextPendingChanges(false);
    this.showReasonModal = false;
    this.setMilestoneDateProperty();
    this.reasonValue = '';
  }

  cancelDateChange() {
    this.workpackSrv.nextPendingChanges(false);
    this.showReasonButtons = false;
    this.setMilestoneDateProperty();
  }

  setMilestoneDateProperty() {
    const date = this.properties.subtitleCardItem.split('-');
    this.milestoneDate = new Date(date[0], date[1] - 1, date[2]);
  }

  ngOnDestroy() {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

  setGaugeChartData() {
    this.gaugeChartDataCPI = (this.properties.dashboardData && this.properties.dashboardData.costPerformanceIndex) && {
      value: this.properties.dashboardData?.costPerformanceIndex !== null ?
        (this.properties.dashboardData?.costPerformanceIndex?.indexValue !== null ?
          this.properties.dashboardData?.costPerformanceIndex?.indexValue : 0) :
        null,
      labelBottom: 'CPI',
      classIconLabelBottom: 'fas fa-dollar-sign',
      valueProgressBar: this.properties.dashboardData?.costPerformanceIndex !== null ?
        this.properties.dashboardData?.costPerformanceIndex?.costVariation :
        null,
      maxProgressBar: this.properties.dashboardData?.earnedValue,
      labelBottomProgressBar: 'CV',
    };

    this.gaugeChartDataSPI = (this.properties.dashboardData && this.properties.dashboardData.schedulePerformanceIndex) && {
      value: this.properties.dashboardData?.schedulePerformanceIndex !== null ?
        (this.properties.dashboardData?.schedulePerformanceIndex?.indexValue !== null ?
          this.properties.dashboardData?.schedulePerformanceIndex?.indexValue : 0) :
        null,
      labelBottom: 'SPI',
      classIconLabelBottom: 'fas fa-clock',
      valueProgressBar: this.properties.dashboardData?.schedulePerformanceIndex !== null ?
        this.properties.dashboardData?.schedulePerformanceIndex?.scheduleVariation :
        null,
      maxProgressBar: this.properties.dashboardData?.earnedValue,
      labelBottomProgressBar: 'SV',
    };

  }

  loadPerformanceIndexes() {
    if (this.properties?.dashboardData?.costPerformanceIndex) {
      if (this.properties?.dashboardData?.costPerformanceIndex?.indexValue < 1) {
        this.cpiColor = '#EA5C5C';
      } else {
        this.cpiColor = '#0081c1';
      }
    } else {
      this.cpiColor = '#646464';
    }
    if (this.properties?.dashboardData?.schedulePerformanceIndex) {
      if (this.properties?.dashboardData?.schedulePerformanceIndex?.indexValue < 1) {
        this.spiColor = '#EA5C5C';
      } else {
        this.spiColor = '#0081c1';
      }
    } else {
      this.spiColor = '#646464';
    }
    this.setGaugeChartData();
  }

  loadTripleConstraintSettings() {
    if (this.properties.dashboardData &&
      (!this.properties.dashboardData?.tripleConstraint?.cost || this.properties.dashboardData?.tripleConstraint?.cost?.foreseenValue === 0
        || this.properties.dashboardData?.tripleConstraint?.cost?.foreseenValue === null)) {
      this.iconCostColor = '#f5f5f5';
    } else {
      if (this.properties.dashboardData && this.properties.dashboardData?.tripleConstraint?.cost?.plannedValue > 0) {
        if (!!this.properties.dashboardData.tripleConstraint?.cost?.variation &&
          this.properties.dashboardData?.tripleConstraint?.cost?.variation !== 0) {
          if (this.properties.dashboardData.tripleConstraint?.cost?.variation > 0) {
            this.iconCostColor = '#44B39B';
          } else {
            this.iconCostColor = '#EA5C5C';
          }
        } else {
          this.iconCostColor = '#44B39B';
        }
      } else {
        if (this.properties.dashboardData.tripleConstraint?.cost?.foreseenValue >=
          this.properties.dashboardData?.tripleConstraint?.cost?.actualValue) {
          this.iconCostColor = '#888E96';
        } else {
          this.iconCostColor = '#EA5C5C';
        }
      }
    }

    if (this.properties.dashboardData && (!this.properties.dashboardData?.tripleConstraint?.schedule ||
      this.properties?.dashboardData?.tripleConstraint?.schedule?.foreseenStartDate === null)) {
      this.iconScheduleColor = '#f5f5f5';
    } else {
      if (this.properties.dashboardData && this.properties.dashboardData.tripleConstraint?.schedule?.plannedValue > 0) {
        if (!!this.properties.dashboardData.tripleConstraint?.schedule?.variation &&
          this.properties?.dashboardData?.tripleConstraint?.schedule?.variation !== 0) {
          if (this.properties.dashboardData.tripleConstraint?.schedule?.variation > 0) {
            this.iconScheduleColor = '#44B39B';
          } else {
            this.iconScheduleColor = '#EA5C5C';
          }
        } else {
          this.iconScheduleColor = '#44B39B';
        }
      } else {
        if (this.properties.dashboardData?.tripleConstraint?.schedule?.foreseenValue >=
          this.properties.dashboardData?.tripleConstraint?.schedule?.actualValue) {
          this.iconScheduleColor = '#888E96';
        } else {
          this.iconScheduleColor = '#EA5C5C';
        }
      }
    }

    if (this.properties.dashboardData && (!this.properties.dashboardData?.tripleConstraint?.cost ||
      this.properties?.dashboardData?.tripleConstraint?.scope?.foreseenValue === 0 ||
      this.properties?.dashboardData?.tripleConstraint?.scope?.foreseenValue === null)) {
      this.iconScopeColor = '#f5f5f5';
    } else {
      if (this.properties.dashboardData && this.properties.dashboardData?.tripleConstraint?.scope?.plannedVariationPercent > 0) {
        if (!!this.properties.dashboardData?.tripleConstraint?.scope?.variation &&
          this.properties.dashboardData?.tripleConstraint?.scope?.variation !== 0) {
          if (this.properties.dashboardData?.tripleConstraint?.scope?.variation < 0) {
            this.iconScopeColor = '#44B39B';
          } else {
            this.iconScopeColor = '#EA5C5C';
          }
        } else {
          this.iconScopeColor = '#44B39B';
        }
      } else {
        if (this.properties.dashboardData?.tripleConstraint?.scope?.foreseenWorkRefMonth !== null &&
          this.properties.dashboardData?.tripleConstraint?.scope?.foreseenWorkRefMonth >=
          this.properties.dashboardData?.tripleConstraint?.scope?.actualValue) {
          this.iconScopeColor = '#EA5C5C';
        } else {
          this.iconScopeColor = '#44B39B';
        }
      }
    }

  }

  setDashboardMilestonesData() {
    const milestone = this.properties.dashboardData?.milestone;
    const data = milestone && [milestone.onTime, milestone.late, milestone.concluded, milestone.lateConcluded];
    this.milestoneMidleTextBottom = this.translateSrv.instant('milestonesLabelChart');
    if (data.filter(item => item > 0).length > 0) {
      this.dashboardMilestonesData = {
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
        ... this.properties.paramsUrlCard.reduce((obj, item) => ((obj[item.name] = item.value), obj), {}),
      };
    }
    return params;
  }

  validateShowTripleConstraintCost() {
    if (this.properties?.dashboardData?.tripleConstraint?.cost && this.properties?.dashboardData?.tripleConstraint?.cost?.foreseenValue > 0) {
      return true;
    }
    return false;
  }

  validateShowTripleConstraintSchedule() {
    if (this.properties?.dashboardData?.tripleConstraint?.schedule &&
      this.properties?.dashboardData?.tripleConstraint?.schedule?.foreseenStartDate !== null) {
      return true;
    }
    return false;
  }

  validateShowTripleConstraintScope() {
    if (this.properties?.dashboardData?.tripleConstraint?.scope && this.properties?.dashboardData?.tripleConstraint?.scope?.foreseenValue > 0) {
      return true;
    }
    return false;
  }

  get label(): string {
    return this.properties.typeCardItem === 'Milestone' ? 'completed' : 'scopeCompleted';
  }

  showRiskIndex() {
    return (!this.properties.endManagementDate ||
      this.properties.endManagementDate === null) && !this.properties.completed && this.properties?.dashboardData?.risk?.total > 0;
  }

  showEndManagementIndex() {
    return (!!this.properties.endManagementDate && this.properties.endManagementDate !== null) || !!this.properties.completed;
  }

  async handleShowJournalInformation(journalInformation) {
    journalInformation.loading = true;
    const result = await this.journalSrv.GetById(journalInformation.id);
    if (result.success) {
      journalInformation.information = result.data.information;
      journalInformation.author = result.data.author;
      journalInformation.dateInformation = result.data.date;
      journalInformation.workpack = result.data.workpack;
      journalInformation.evidences = result.data.evidences && result.data.evidences.map( evidence => {
        const isImg = evidence.mimeType.includes('image');
        let icon: string;
        switch (evidence.mimeType) {
          case 'application/pdf':
            icon = 'far fa-file-pdf';
            break;
          case 'text/csv':
            icon = 'fas fa-file-csv';
            break;
          case 'application/msword':
            icon = 'far fa-file-word';
            break;
          case 'application/vnd.ms-excel':
          case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
            icon = 'far fa-file-excel';
            break;
          case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
          case 'application/vnd.ms-powerpoint':
            icon = 'far fa-file-powerpoint';
            break;
          default:
            icon = 'far fa-file';
            break;
        }
        return {
          ...evidence,
          isImg,
          icon
        }
      });
      journalInformation.loading = false;
    }
  }

  async handleLoadMenu() {
    this.enable = false;
    await this.properties.onNewItem();
    this.enable = true;
    this.newItemIcon.nativeElement.click();
  }
}

