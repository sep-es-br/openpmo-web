import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
registerLocaleData(localePt);

@Component({
  selector: 'app-progress-bar-card-step',
  templateUrl: './progress-bar-card-step.component.html',
  styleUrls: ['./progress-bar-card-step.component.scss']
})
export class ProgressBarCardStepComponent implements OnInit {

  @Input() total: number;
  @Input() progress: number;
  @Input() baseline: number;
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
    if (!this.baseline) {
      this.baseline = 0;
    }
  }

  ngOnDestroy(): void {
    this.subResponsive?.unsubscribe();
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

}
