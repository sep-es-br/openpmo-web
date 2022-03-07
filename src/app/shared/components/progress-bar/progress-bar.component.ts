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
  styleUrls: ['./progress-bar.component.scss']
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

  language: string;
  $destroy = new Subject();
  totalProgressBar: number;
  totalBar: number;
  subResponsive: Subscription;
  responsive: boolean;
  marginRightTotal: string = '0';
  marginLeftTotal: string = '0';

  constructor(
    private translateSrv: TranslateService,
    private responsiveSrv: ResponsiveService
  ) {
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      {
        setTimeout(() => this.setLanguage(), 200);
       this.ngOnInit();
      }
    );
    this.subResponsive = this.responsiveSrv.observable.subscribe(value => this.responsive = value);
  }

  ngOnInit(): void {
    this.setLanguage();
    if (!this.baselineTotal) {
      this.baselineTotal = 0;
    } else {
      if (this.valueUnit === 'time') {
        const startTotal = moment(this.startDateTotal);
        const startBaseline = moment(this.startDateBaseline);
        const daysPeriod = moment(this.endDateBaseline).diff(startTotal, 'days');
        if (startTotal.isBefore(startBaseline)) {
          this.marginRightTotal = this.total >= this.progress ? (100 - ((this.total / daysPeriod)*100)).toFixed(0) : (100 - ((this.progress / daysPeriod)*100)).toFixed(0);
        } else if (startTotal.isAfter(startBaseline)) {
          this.marginLeftTotal = this.total > this.progress ? (100 - ((this.total / daysPeriod)*100)).toFixed(0) : (100 - ((this.progress / daysPeriod)*100)).toFixed(0);
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
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en' ;
  }

}
