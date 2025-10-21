import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import * as moment from 'moment';
registerLocaleData(localePt);

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss'],
})
export class ProgressBarComponent implements OnInit, OnDestroy {
  @Input() total: number;

  @Input() progress: number;

  @Input() labelProgress: string;

  @Input() labelTotal: string;

  @Input() baselineTotal;

  @Input() color: string;

  @Input() valueUnit: string;

  @Input() barHeight: number;

  @Input() startDateBaseline: Date;

  @Input() endDateBaseline: Date;

  @Input() startDateTotal: Date;

  @Input() endDateTotal: Date;

  @Input() disableLabels = false;

  @Input() displayWhenTotalIsZero: boolean = false;

  @Input() displayFilledBarsWhenTotalIsZero: boolean = true;

  language: string;

  $destroy = new Subject();

  totalProgressBar: number;

  totalBar: number;

  subResponsive: Subscription;

  responsive: boolean;

  marginRightTotal: string = '0';

  marginLeftTotal: string = '0';

  marginLeftBaseline: string = '0';

  marginRightBaseline: string = '0';

  totalDate;

  progressDate;

  baselineDate;

  daysOfPeriod;

  percProgress;

  percTotal;

  constructor(
    private translateSrv: TranslateService,
    private responsiveSrv: ResponsiveService
  ) {
    this.translateSrv.onLangChange
      .pipe(takeUntil(this.$destroy))
      .subscribe(() => {
        setTimeout(() => this.setLanguage(), 200);
        this.ngOnInit();
      });
    this.subResponsive = this.responsiveSrv.observable.subscribe(
      (value) => (this.responsive = value)
    );
  }

  ngOnInit(): void {
    this.setLanguage();
    if (!this.baselineTotal) {
      this.baselineTotal = 0;
      this.totalDate =
        this.total >= this.progress ? 100 : (this.total / this.progress) * 100;
      this.progressDate =
        this.total >= this.progress ? (this.progress / this.total) * 100 : 100;
      this.percTotal =
        this.total >= this.progress ? 100 : (this.total / this.progress) * 100;
      this.percProgress =
        this.total >= this.progress ? (this.progress / this.total) * 100 : 100;
      this.baselineDate = 0;
    } else {
      if (this.valueUnit === 'time') {
        const startGeneral = moment(this.startDateTotal).isBefore(
          moment(this.startDateBaseline)
        )
          ? moment(this.startDateTotal)
          : moment(this.startDateBaseline);
        const endGeneral = moment(this.endDateTotal).isBefore(
          moment(this.endDateBaseline)
        )
          ? moment(this.endDateBaseline)
          : moment(this.endDateTotal);
        this.daysOfPeriod = moment(endGeneral).diff(startGeneral, 'days');
        this.totalDate = (this.total / this.daysOfPeriod) * 100;
        this.progressDate = (this.progress / this.daysOfPeriod) * 100;
        this.percTotal =
          this.total >= this.progress
            ? (this.total / this.daysOfPeriod) * 100
            : (this.total / this.progress) * 100;
        this.percProgress =
          this.progress > this.total
            ? (this.progress / this.daysOfPeriod) * 100
            : (this.progress / this.total) * 100;
        this.baselineDate = (this.baselineTotal / this.daysOfPeriod) * 100;
        if (
          moment(this.startDateTotal).isBefore(moment(this.startDateBaseline))
        ) {
          const diffStartDates = moment(this.startDateBaseline).diff(
            moment(this.startDateTotal),
            'days'
          );
          this.marginLeftBaseline = (
            (diffStartDates / this.daysOfPeriod) *
            100
          ).toFixed(0);
          this.marginLeftTotal = '0';
        }
        if (
          moment(this.startDateTotal).isAfter(moment(this.startDateBaseline))
        ) {
          const diffStartDates = moment(this.startDateTotal).diff(
            moment(this.startDateBaseline),
            'days'
          );
          this.marginLeftBaseline = '0';
          this.marginLeftTotal = (
            (diffStartDates / this.daysOfPeriod) *
            100
          ).toFixed(0);
        }
        if (moment(this.endDateTotal).isBefore(moment(this.endDateBaseline))) {
          const diffStartDates = moment(this.endDateBaseline).diff(
            moment(this.endDateTotal),
            'days'
          );
          this.marginRightBaseline = (
            (diffStartDates / this.daysOfPeriod) *
            100
          ).toFixed(0);
          this.marginRightTotal = '0';
        }
        if (moment(this.endDateTotal).isAfter(moment(this.endDateBaseline))) {
          const diffStartDates = moment(this.endDateTotal).diff(
            moment(this.endDateBaseline),
            'days'
          );
          this.marginRightBaseline = (
            (diffStartDates / this.daysOfPeriod) *
            100
          ).toFixed(0);
          this.marginRightTotal = '0';
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.subResponsive?.unsubscribe();
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en';
  }
}
