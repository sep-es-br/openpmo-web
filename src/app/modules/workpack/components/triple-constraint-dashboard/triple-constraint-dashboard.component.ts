import { takeUntil } from 'rxjs/operators';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ITripleConstraintDashboard } from './../../../../shared/interfaces/IDashboard';
import { Component, Input, OnInit, SimpleChanges } from '@angular/core';
import * as moment from 'moment';
import { Subject } from 'rxjs';
import { LabelService } from 'src/app/shared/services/label.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-triple-constraint-dashboard',
  templateUrl: './triple-constraint-dashboard.component.html',
  styleUrls: ['./triple-constraint-dashboard.component.scss']
})
export class TripleConstraintDashboardComponent implements OnInit {

  @Input() tripleConstraint: ITripleConstraintDashboard;
  maxCostValue: number;
  maxScopeValue: number;
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
  mediaScreen1450: boolean;
  foreseenLabel: string;

  constructor(
    private responsiveSrv: ResponsiveService,
    private labelService: LabelService,
    private route: ActivatedRoute
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.responsiveSrv.resizeEvent.subscribe((value) => {
      this.mediaScreen1450 = value.width <= 1216;
    });
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (
      changes.tripleConstraint && changes.tripleConstraint.currentValue
    ) {
      if (this.tripleConstraint && this.tripleConstraint.cost) {
        this.loadMaxCostValue();
      }
      if (this.tripleConstraint && this.tripleConstraint.scope) {
        this.loadMaxScopeValue();
      }
      if (this.tripleConstraint && this.tripleConstraint.schedule) {
        this.loadChartScheduleValues();
      }
    }
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const idWorkpack = params['id']
      if (idWorkpack) {
        this.labelService.getLabels(idWorkpack).subscribe(
          response => {
            this.foreseenLabel = response.data[0].body.data;
          },
          error => {
            console.error(error);
          }
        );
      }
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  loadMaxCostValue() {
    const values = [];
    if (this.tripleConstraint?.cost?.plannedValue) {
      values.push(this.tripleConstraint.cost.plannedValue);
    }
    if (this.tripleConstraint.cost.foreseenValue) {
      values.push(this.tripleConstraint.cost.foreseenValue);
    }
    if (this.tripleConstraint.cost.actualValue) {
      values.push(this.tripleConstraint.cost.actualValue);
    }
    this.maxCostValue = values && values.length > 0 && values.reduce((a, b) => Math.max(a, b));
  }

  loadMaxScopeValue() {
    const values = [];
    if (this.tripleConstraint.scope.plannedVariationPercent) {
      values.push(this.tripleConstraint.scope.plannedVariationPercent);
    }
    if (this.tripleConstraint.scope.foreseenVariationPercent) {
      values.push(this.tripleConstraint.scope.foreseenVariationPercent);
    }
    if (this.tripleConstraint.scope.actualVariationPercent) {
      values.push(this.tripleConstraint.scope.actualVariationPercent);
    }
    this.maxScopeValue = values && values.length > 0 && values.reduce((a, b) => Math.max(a, b));
  }

  loadChartScheduleValues() {
    if (this.tripleConstraint && this.tripleConstraint.schedule) {
      const startDates = [];
      if (this.tripleConstraint.schedule.plannedStartDate) {
        startDates.push(this.tripleConstraint.schedule.plannedStartDate);
      }
      if (this.tripleConstraint.schedule.foreseenStartDate) {
        startDates.push(this.tripleConstraint.schedule.foreseenStartDate);
      }
      if (this.tripleConstraint.schedule.actualStartDate) {
        startDates.push(this.tripleConstraint.schedule.actualStartDate);
      }
      const startDate =
      startDates.reduce((a, b) => moment(a, 'yyyy-MM-DD')
      .isBefore(moment(b, 'yyyy-MM-DD')) ? a : b, '');
      const endDates = [];
      if (this.tripleConstraint.schedule.plannedEndDate) {
        endDates.push(this.tripleConstraint.schedule.plannedEndDate);
      }
      if (this.tripleConstraint.schedule.foreseenEndDate) {
        endDates.push(this.tripleConstraint.schedule.foreseenEndDate);
      }
      if (this.tripleConstraint.schedule.actualEndDate) {
        endDates.push(this.tripleConstraint.schedule.actualEndDate);
      }
      const endDate = endDates.reduce((a, b) => {
        if (moment(a).isAfter(moment(b))) { return a; }
        else { return b; }
      });
      this.monthsInPeriod = Number((moment(endDate, 'yyyy-MM-DD').diff(moment(startDate, 'yyyy-MM-DD'), 'days') / 30).toFixed(1));
      this.difPlannedStartDateToMinStartDate = Number((moment(this.tripleConstraint.schedule.plannedStartDate, 'yyyy-MM-DD').diff(moment(startDate, 'yyyy-MM-DD'), 'days') / 30).toFixed(1));
      this.difForeseenStartDateToMinStartDate = Number((moment(this.tripleConstraint.schedule.foreseenStartDate, 'yyyy-MM-DD').diff(moment(startDate, 'yyyy-MM-DD'), 'days') / 30).toFixed(1));
      this.difActualStartDateToMinStartDate = Number((moment(this.tripleConstraint.schedule.actualStartDate, 'yyyy-MM-DD').diff(moment(startDate, 'yyyy-MM-DD'), 'days') / 30).toFixed(1));
      this.marginLeftPlanned = this.monthsInPeriod > 0 ? (100 / this.monthsInPeriod) * this.difPlannedStartDateToMinStartDate : 0;
      this.marginLeftForeseen = this.monthsInPeriod > 0 ? (100 / this.monthsInPeriod) * this.difForeseenStartDateToMinStartDate : 0;
      this.marginLeftActual = this.monthsInPeriod > 0 ? (100 / this.monthsInPeriod) * this.difActualStartDateToMinStartDate : 0;

      this.difPlannedEndDateToMaxEndDate = Number((moment(endDate, 'yyyy-MM-DD').diff(moment(this.tripleConstraint.schedule.plannedEndDate, 'yyyy-MM-DD'), 'days') / 30).toFixed(1));
      this.difForeseenEndDateToMaxEndDate = Number((moment(endDate, 'yyyy-MM-DD').diff(moment(this.tripleConstraint.schedule.foreseenEndDate, 'yyyy-MM-DD'), 'days') / 30).toFixed(1));
      this.difActualEndDateToMaxEndDate = Number((moment(endDate, 'yyyy-MM-DD').diff(moment(this.tripleConstraint.schedule.actualEndDate, 'yyyy-MM-DD'), 'days') / 30).toFixed(1));

      this.marginRightPlanned = this.monthsInPeriod > 0 ? (100 / this.monthsInPeriod) * this.difPlannedEndDateToMaxEndDate : 0;
      this.marginRightForeseen = this.monthsInPeriod > 0 ? (100 / this.monthsInPeriod) * this.difForeseenEndDateToMaxEndDate : 0;
      this.marginRightActual = this.monthsInPeriod > 0 ? (100 / this.monthsInPeriod) * this.difActualEndDateToMaxEndDate : 0;

    }
  }

}
