import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { IBaseline } from './../../../shared/interfaces/IBaseline';
import { takeUntil } from 'rxjs/operators';
import { IconsTypeWorkpackEnum } from './../../../shared/enums/IconsTypeWorkpackModelEnum';
import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartData } from 'chart.js';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IDashboard } from 'src/app/shared/interfaces/IDashboard';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import * as moment from 'moment';
import { Calendar } from 'primeng/calendar';
import { Subject } from 'rxjs';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnChanges, OnDestroy {

  @ViewChild(Calendar) calendarComponent: Calendar;
  @Input() idWorkpack: number;
  @Input() dashboardShowStakeholders: string[];
  @Input() dashboardShowRisks: boolean;
  @Input() dashboardShowMilestones: boolean;
  @Input() dashboardShowEva: boolean;
  @Input() workpackFullName: string;
  @Input() workpackType: string;
  @Input() collapsePanelsStatus: boolean;
  @Input() reloadDashboard: boolean;

  dashboard: IDashboard;
  cardDashboardProperties: ICard;
  dashboardMilestonesData: ChartData = {
    labels: [],
    datasets: []
  };
  dashboardRisksData: ChartData = {
    labels: [],
    datasets: []
  };
  iconsEnum = IconsTypeWorkpackEnum;
  referenceMonth: Date;
  selectedBaseline: number;
  yearRange: string;
  $destroy = new Subject();
  calendarFormat: string;
  baselines: IBaseline[];
  responsive = false;
  startDate: Date;
  endDate: Date;
  midleTextMilestones: string;
  midleTextRisks: string;
  showTabview = false;
  isLoading = false;
  mediaScreen1700: boolean;

  constructor(
    private dashboardSrv: DashboardService,
    private translateSrv: TranslateService,
    private responsiveSrv: ResponsiveService,
    private workpackShowTabviewSrv: WorkpackShowTabviewService
  ) {
    this.workpackShowTabviewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.showTabview = value;
    });
    this.responsiveSrv.resizeEvent.subscribe((value) => {
      this.mediaScreen1700 = value.width <= 1700;
    });
    this.cardDashboardProperties = {
      toggleable: false,
      initialStateToggle: false,
      collapseble: this.showTabview ? false : true,
      initialStateCollapse: this.showTabview ? false : this.collapsePanelsStatus,
      cardTitle: this.showTabview ? '' : 'dashboard',
      showFullScreen: true,
      fullScreen: false
    };
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      setTimeout(() => {
        if (this.calendarComponent) {
          this.calendarComponent?.ngOnInit();
          this.calendarComponent.dateFormat = this.translateSrv.instant('dateFormatMonthYear');
          this.calendarComponent.updateInputfield();
        }
        this.midleTextMilestones = this.translateSrv.instant('milestonesLabelChart');
        this.midleTextRisks = this.translateSrv.instant('risksLabelChart');
        this.setDashboardMilestonesData();
        this.setDashboardRisksData();
      }, 150)
    );
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      (changes.idWorkpack && changes.idWorkpack.currentValue) || (changes.reloadDashboard)
    ) {
      this.isLoading = true;
      if (this.workpackType === 'Project') {
        const result = await this.dashboardSrv.GetBaselines({ 'id-workpack': this.idWorkpack });
        if (result.success) {
          this.baselines = result.data;
          this.selectedBaseline = result.data.length > 0 ? this.baselines.find(baseline => !!baseline.default).id : null;
        }
      }
      await this.loadSheduleInterval();
      await this.getDashboardData();
      if (this.dashboard) {
        this.setDashboardMilestonesData();
        this.setDashboardRisksData();
      }
    }
    if (
      changes.collapsePanelsStatus
    ) {
      this.cardDashboardProperties = Object.assign({
        ...this.cardDashboardProperties,
        initialStateCollapse: this.collapsePanelsStatus
      });
    }
  }

  async ngOnInit(): Promise<void> {
    this.calendarFormat = this.translateSrv.instant('dateFormatMonthYear');
    this.midleTextMilestones = this.translateSrv.instant('milestonesLabelChart');
    this.midleTextRisks = this.translateSrv.instant('risksLabelChart');
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async loadSheduleInterval() {
    this.isLoading = true;
    const result = await this.dashboardSrv.GetDashboardScheduleInterval({ 'id-workpack': this.idWorkpack });
    if (result.success && result.data.startDate && result.data.startDate !== null && result.data.endDate && result.data.endDate !== null) {
      const startDate = moment(result.data.startDate, 'MM-yyyy').toDate();
      const endDate = moment(result.data.endDate, 'MM-yyyy').toDate();
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
  }

  async getDashboardData() {
    if (this.referenceMonth && this.referenceMonth !== null) {
      const referenceMonth = moment(this.referenceMonth).format('MM-yyyy');
      const { data, success } =
        await this.dashboardSrv.GetDashboardByWorkpack(
          { 'id-workpack': this.idWorkpack, 'date-reference': referenceMonth, 'id-baseline': this.selectedBaseline });
      if (success) {
        this.dashboard = data;
        this.validateDashboard();
        this.isLoading = false;
      }
    } else {
      const { data, success } = await this.dashboardSrv.GetDashboardByWorkpack(
        { 'id-workpack': this.idWorkpack, 'date-reference': this.referenceMonth, 'id-baseline': this.selectedBaseline });
      if (success) {
        this.dashboard = data;
        this.validateDashboard();
        this.isLoading = false;
      }
    }
    this.reloadDashboard = false;
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
  }

  setDashboardMilestonesData() {
    const milestone = this.dashboard && this.dashboard.milestone;
    const data = milestone && [milestone.onTime, milestone.late, milestone.concluded, milestone.lateConcluded];
    if (data && data.filter(item => item > 0).length > 0) {
      this.dashboardMilestonesData = {
        labels: [
          this.translateSrv.instant('ontime'),
          this.translateSrv.instant('late'),
          this.translateSrv.instant('concluded'),
          this.translateSrv.instant('lateConcluded'),
        ],
        datasets: [
          {
            data: [milestone.onTime, milestone.late, milestone.concluded, milestone.lateConcluded],
            backgroundColor: [
              '#00b89c',
              '#fa4c4f',
              '#0081c1',
              '#7C75B9',
            ],
          }]
      };
    } else {
      this.dashboardShowMilestones = false;
    }
  }

  setDashboardRisksData() {
    const risk = this.dashboard && this.dashboard.risk;
    const data = risk && [risk.high, risk.medium, risk.low];
    if (data && data.filter(item => item > 0).length > 0) {
      this.dashboardRisksData = {
        labels: [
          this.translateSrv.instant('high'),
          this.translateSrv.instant('medium'),
          this.translateSrv.instant('low'),
        ],
        datasets: [
          {
            data: [risk.high, risk.medium, risk.low],
            backgroundColor: [
              '#ce4543',
              '#fb7800',
              '#ffc300',
            ],
          }]
      };
    } else {
      this.dashboardShowRisks = false;
    }
  }

  async handleSelectedReferenceMonth() {
    await this.getDashboardData();
  }

  async handleSeletedBaseline() {
    await this.getDashboardData();
  }

  handleOnFullScreen(fullScreenMode: boolean) {
    this.cardDashboardProperties.fullScreen = fullScreenMode;
    this.dashboardSrv.next(fullScreenMode)
  }

}
