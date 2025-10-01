import { ResponsiveService } from './../../../../shared/services/responsive.service';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject, Subscription } from 'rxjs';
import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-progress-bar-schedule-year',
  templateUrl: './progress-bar-schedule-year.component.html',
  styleUrls: ['./progress-bar-schedule-year.component.scss']
})
export class ProgressBarScheduleYearComponent implements OnInit {
  @Input() total: number;

  @Input() progress: number;

  @Input() planned: number;

  @Input() labelProgress: string;

  @Input() labelTotal: string;

  @Input() labelPlanned: string;

  @Input() color: string;

  @Input() valueUnit: string;

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
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 200);
      this.ngOnInit();
    });
    this.subResponsive = this.responsiveSrv.observable.subscribe(value => this.responsive = value);
  }

  ngOnInit(): void {
    this.setLanguage();
  }

  // ngOnDestroy(): void {
  //   this.subResponsive?.unsubscribe();
  //   this.$destroy.next();
  //   this.$destroy.complete();
  // }

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en' ;
  }
}
