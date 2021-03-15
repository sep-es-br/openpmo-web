import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import localePt from '@angular/common/locales/pt';
import { registerLocaleData } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
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

  language: string;
  $destroy = new Subject();

  constructor(
    private translateSrv: TranslateService
  ) {
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      {
        setTimeout(() => this.setLanguage(), 200);
       this.ngOnInit();
      }
    );
  }

  ngOnInit(): void {
    this.setLanguage();
    if (!this.progress) {
      this.progress = 0;
    }
    if (this.total === 0) {
      this.total = this.progress;
    } else if (!this.total) {
      this.total = 100;
    }
    if (this.progress > this.total) {
      this.progress = 100;
      this.total = 100;
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

}
