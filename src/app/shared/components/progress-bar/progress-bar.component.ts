import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
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
  @Input() color: string;
  @Input() valueUnit: string;
  @Input() barHeight: number;

  language: string;
  $destroy = new Subject();
  totalProgressBar: number;
  totalBar: number;
  subResponsive: Subscription;
  responsive: boolean;

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

  ngOnDestroy(): void {
    this.subResponsive?.unsubscribe();
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en' ;
  }

}
