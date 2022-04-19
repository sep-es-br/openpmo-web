import { Component, Input, OnInit, EventEmitter, Output, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IScheduleStepCardItem } from 'src/app/shared/interfaces/IScheduleStepCardItem';

@Component({
  selector: 'app-schedule-step-card-item',
  templateUrl: './schedule-step-card-item.component.html',
  styleUrls: ['./schedule-step-card-item.component.scss']
})
export class ScheduleStepCardItemComponent implements OnInit, OnDestroy {

  @Input() properties: IScheduleStepCardItem;
  @Input() type: string;
  @Output() stepChanged = new EventEmitter();

  cardIdItem: string;
  iconEnum = IconsEnum;
  language: string;
  $destroy = new Subject();

  constructor(
    private router: Router,
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
    this.cardIdItem = this.properties.idStep ?
      `${this.properties.idStep < 10 ? '0' + this.properties.idStep : this.properties.idStep}` : '';
    this.setLanguage();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

  handleStepChange() {
    this.stepChanged.next();
  }
}
