import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { ResponsiveService } from './../../../services/responsive.service';
import { Subject } from 'rxjs';
import { ITripleConstraintDashboard } from './../../../interfaces/IDashboard';
import { Component, OnInit, Input, SimpleChanges } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'app-schedule-constraint',
  templateUrl: './schedule-constraint.component.html',
  styleUrls: ['./schedule-constraint.component.scss']
})
export class ScheduleConstraintComponent implements OnInit {

  @Input() schedule: {
    actualEndDate: string;
    actualStartDate: string;
    actualValue: number;
    foreseenEndDate: string;
    foreseenStartDate: string;
    foreseenValue: number;
    plannedEndDate: string;
    plannedStartDate: string;
    plannedValue: number;
    variation: number;
  };
  monthsInPeriod: number;
  difPlannedStartDateToMinStartDate: number;
  difForeseenStartDateToMinStartDate: number;
  difActualStartDateToMinStartDate: number;
  marginRightPlanned: number;
  marginRightForeseen: number;
  marginRightActual: number;
  difPlannedEndDateToMaxEndDate: number;
  difForeseenEndDateToMaxEndDate: number;
  difActualEndDateToMaxEndDate: number;
  marginLeftPlanned: number;
  marginLeftForeseen: number;
  marginLeftActual: number;
  $destroy = new Subject();
  responsive = false;
  language: string;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      {
        setTimeout(() => this.setLanguage(), 200);
      }
    );
   }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes.schedule && changes.schedule.currentValue
    ) {
      if (this.schedule) {
        this.loadChartScheduleValues();
      }
    }
  }

  ngOnInit(): void {
    this.setLanguage();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en';
  }

  loadChartScheduleValues() {
    if (this.schedule) {
      const startDates = [];
      if (this.schedule.plannedStartDate) {
        startDates.push(this.schedule.plannedStartDate);
      }
      if (this.schedule.foreseenStartDate) {
        startDates.push(this.schedule.foreseenStartDate);
      }
      if (this.schedule.actualStartDate) {
        startDates.push(this.schedule.actualStartDate);
      }
      const startDate =
      startDates.reduce((a, b) => moment(a, 'yyyy-MM-DD')
      .isBefore(moment(b, 'yyyy-MM-DD')) ? a : b, '');
      const endDates = [];
      if (this.schedule.plannedEndDate) {
        endDates.push(this.schedule.plannedEndDate);
      }
      if (this.schedule.foreseenEndDate) {
        endDates.push(this.schedule.foreseenEndDate);
      }
      if (this.schedule.actualEndDate) {
        endDates.push(this.schedule.actualEndDate);
      }
      const endDate = endDates.reduce((a, b) => {
        if (moment(a).isAfter(moment(b))) {return a;}
        else {return b;}
      });
      this.monthsInPeriod = Number((moment(endDate, 'yyyy-MM-DD').diff(moment(startDate, 'yyyy-MM-DD'), 'months') + 1).toFixed(1));
      if (this.monthsInPeriod < 1) this.monthsInPeriod = 1;
      this.difPlannedStartDateToMinStartDate = Number((moment(this.schedule.plannedStartDate, 'yyyy-MM-DD').diff(moment(startDate, 'yyyy-MM-DD'), 'months') ).toFixed(1));
      this.difForeseenStartDateToMinStartDate = Number((moment(this.schedule.foreseenStartDate, 'yyyy-MM-DD').diff(moment(startDate, 'yyyy-MM-DD'), 'months') ).toFixed(1));
      this.difActualStartDateToMinStartDate = Number((moment(this.schedule.actualStartDate, 'yyyy-MM-DD').diff(moment(startDate, 'yyyy-MM-DD'), 'months') ).toFixed(1));
      this.marginLeftPlanned = this.monthsInPeriod > 0 ? (100 / this.monthsInPeriod) * this.difPlannedStartDateToMinStartDate : 0;
      this.marginLeftForeseen = this.monthsInPeriod > 0 ? (100 / this.monthsInPeriod) * this.difForeseenStartDateToMinStartDate : 0;
      this.marginLeftActual = this.monthsInPeriod > 0 ? (100 / this.monthsInPeriod) * this.difActualStartDateToMinStartDate : 0;

      this.difPlannedEndDateToMaxEndDate = Number((moment(endDate, 'yyyy-MM-DD').diff(moment(this.schedule.plannedEndDate, 'yyyy-MM-DD'), 'months') ).toFixed(1));
      this.difForeseenEndDateToMaxEndDate = Number((moment(endDate, 'yyyy-MM-DD').diff(moment(this.schedule.foreseenEndDate, 'yyyy-MM-DD'), 'months') ).toFixed(1));
      this.difActualEndDateToMaxEndDate = Number((moment(endDate, 'yyyy-MM-DD').diff(moment(this.schedule.actualEndDate, 'yyyy-MM-DD'), 'months') ).toFixed(1));

      this.marginRightPlanned = this.monthsInPeriod > 0 ? (100 / this.monthsInPeriod) * this.difPlannedEndDateToMaxEndDate : 0;
      this.marginRightForeseen = this.monthsInPeriod > 0 ? (100 / this.monthsInPeriod) * this.difForeseenEndDateToMaxEndDate : 0;
      this.marginRightActual = this.monthsInPeriod > 0 ? (100 / this.monthsInPeriod) * this.difActualEndDateToMaxEndDate : 0;

    }
  }

}
