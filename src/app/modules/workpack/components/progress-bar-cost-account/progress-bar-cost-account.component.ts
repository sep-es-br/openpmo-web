import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Component, Input, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import * as moment from 'moment';
registerLocaleData(localePt);

@Component({
  selector: 'app-progress-bar-cost-account',
  templateUrl: './progress-bar-cost-account.component.html',
  styleUrls: ['./progress-bar-cost-account.component.scss']
})
export class ProgressBarCostAccountComponent implements OnInit {

  @Input() total: number;
  @Input() progress: number;
  @Input() labelProgress: string;
  @Input() labelTotal: string;
  @Input() color: string;
  @Input() valueUnit: string;
  @Input() barHeight: number;
  @Input() limit: number;

  language: string;
  $destroy = new Subject();
  subResponsive: Subscription;
  responsive: boolean;
  indicatorLimit: number;
  difLimit: number;
  progressDifLimit: number;

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
  }

  ngOnChanges(changes: SimpleChanges) {
    if(changes.limit && changes.limit.currentValue) {
      this.loadProgressbarValues();
    }
  }

  loadProgressbarValues() {
    if (!this.limit || this.limit === 0) {
      return;
    }
    this.indicatorLimit = this.progress && this.progress > 0  && this.progress > this.total
      ?
      this.progress > this.limit ? ((this.progress - this.limit)/ this.progress) * 100 : 0
      :
      this.total > this.limit ? ((this.total - this.limit) / this.total) * 100 : 0;

    if (this.progress && this.progress > this.limit) {
      this.difLimit = this.progress - this.limit;
      this.progressDifLimit = this.progress - this.difLimit;
    } else {
      this.difLimit = 0;
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

