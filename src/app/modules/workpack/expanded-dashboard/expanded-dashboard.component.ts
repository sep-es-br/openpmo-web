import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { IBaseline } from './../../../shared/interfaces/IBaseline';
import { takeUntil } from 'rxjs/operators';
import { IconsTypeWorkpackEnum } from './../../../shared/enums/IconsTypeWorkpackModelEnum';
import { Component, Input, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ChartData } from 'chart.js';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IDashboard } from 'src/app/shared/interfaces/IDashboard';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import * as moment from 'moment';
import { Calendar } from 'primeng/calendar';
import { Subject } from 'rxjs';
import { Location } from '@angular/common';

@Component({
  selector: 'app-expanded-dashboard',
  templateUrl: './expanded-dashboard.component.html',
  styleUrls: ['./expanded-dashboard.component.scss']
})
export class ExpandedDashboardComponent implements OnInit {

  @ViewChild(Calendar) calendarComponent: Calendar;
  idWorkpack: number;
  dashboardShowStakeholders: string[];
  dashboardShowRisks: boolean;
  dashboardShowMilestones: boolean;
  dashboardShowEVA: boolean;
  workpackFullName: string;
  workpackType: string;

  dashboard: IDashboard;
  cardDashboardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    collapseble: true,
    initialStateCollapse: false,
    cardTitle: 'dashboard',
    fullScreen: true,
    showFullScreen: true,
  };
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

  constructor(
    private dashboardSrv: DashboardService,
    private translateSrv: TranslateService,
    private responsiveSrv: ResponsiveService,
    private location: Location,
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      setTimeout(() => {
        this.calendarComponent?.ngOnInit();
        this.calendarComponent.dateFormat = this.translateSrv.instant('dateFormatMonthYear');
        this.calendarComponent.updateInputfield();
      }, 150)
    );
  }

  async ngOnInit(): Promise<void> {
    this.calendarFormat = this.translateSrv.instant('dateFormatMonthYear');
    this.loadData();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  loadData() {
    const result = this.dashboardSrv.GetDashboardData();
    this.baselines =  result.baselines;
    this.idWorkpack = result.idWorkpack;
    this.workpackFullName = result.workpackFullName;
    this.workpackType = result.workpackType;
    this.dashboardShowStakeholders = result.dashboardShowStakeholders;
    this.dashboardShowRisks = result.dashboardShowRisks;
    this.dashboardShowMilestones = result.dashboardShowMilestones;
    this.dashboardShowEVA = result.dashboardShowEVA;
    this.endDate = result.endDate;
    this.startDate = result.startDate;
    this.yearRange = result.yearRange;
    this.referenceMonth = result.referenceMonth;
    this.dashboard = result.dashboard;
  }

  async loadSheduleInterval() {
    const result = await this.dashboardSrv.GetDashboardScheduleInterval({'id-workpack': this.idWorkpack});
    if (result.success) {
      const startDate = moment(result.data.startDate, 'MM-yyyy');
      const endDate = moment(result.data.endDate, 'MM-yyyy');
      const today = moment();
      if (today.subtract(1, 'month').isBefore(startDate)) {
        this.referenceMonth = startDate.subtract(1, 'month').toDate();
      } else if (today.subtract(1, 'month').isAfter(endDate)) {
        this.referenceMonth = endDate.toDate();
      } else {
        this.referenceMonth = today.subtract(1, 'month').toDate();
      }
      this.yearRange = startDate.year().toString() + ':' + endDate.year().toString()
      this.startDate = startDate.toDate();
      this.endDate = endDate.toDate();
    }
  }

  async getDashboardData() {
    const referenceMonth = moment(this.referenceMonth).format('MM-yyyy');
    const { data, success } = await this.dashboardSrv.GetDashboardByWorkpack({ 'id-workpack': this.idWorkpack, 'date-reference': referenceMonth, 'id-baseline': this.selectedBaseline });
    if (success) {
      this.dashboard = data;
    }
  }

  setDashboardMilestonesData() {
    const milestone = this.dashboard.milestone;
    const data = milestone && [milestone.onTime, milestone.late, milestone.concluded, milestone.lateConcluded];
    if (data.filter(item => item > 0).length > 0) {
      this.dashboardMilestonesData = {
        labels: [
          this.translateSrv.instant('onTime'),
          this.translateSrv.instant('late'),
          this.translateSrv.instant('concluded'),
          this.translateSrv.instant('concludedLate'),
        ],
        datasets: [
          {
            data: [milestone.onTime, milestone.late, milestone.concluded, milestone.lateConcluded],
            backgroundColor: [
              "#00b89c",
              "#fa4c4f",
              "#0081c1",
              "#00aef7",
            ],
          }]
      }
    } else {
      this.dashboardShowMilestones = false;
    }
  }

  setDashboardRisksData() {
    const risk = this.dashboard.risk;
    const data = risk && [risk.high, risk.medium, risk.low];
    if (data.filter(item => item > 0).length > 0) {
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
              "#ce4543",
              "#fb7800",
              "#ffc300",
            ],
          }]
      }
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

  handleOnFullScreen() {
    this.dashboardSrv.resetDashboardData();
    this.location.back();
  }

}
