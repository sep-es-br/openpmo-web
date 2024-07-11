import { InputTextModule } from 'primeng/inputtext';
import { Component, Input, OnInit, EventEmitter, Output, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IScheduleStepCardItem } from 'src/app/shared/interfaces/IScheduleStepCardItem';
import * as moment from 'moment';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-schedule-step-card-item',
  templateUrl: './schedule-step-card-item.component.html',
  styleUrls: ['./schedule-step-card-item.component.scss']
})
export class ScheduleStepCardItemComponent implements OnInit, OnDestroy {

  @Input() properties: IScheduleStepCardItem;
  @Input() type: string;
  @Output() stepChanged = new EventEmitter();
  @Output() editCost = new EventEmitter();
  @Output() spreadDifference = new EventEmitter();
  @Output() onCreateNewStep = new EventEmitter();

  cardIdItem: string;
  iconEnum = IconsEnum;
  language: string;
  $destroy = new Subject();
  showReplicateButton = false;
  item;
  difference;
  multiCostsEdited = false;

  constructor(
    private messageSrv: MessageService,
    private translateSrv: TranslateService,
    private confirmationSrv: ConfirmationService
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
    if (this.properties.stepName)  {
      let dateStep = moment(this.properties.stepName);
      const monthStep = dateStep.month();
      const yearStep = dateStep.year();
      dateStep = moment(`${yearStep}-${monthStep + 1}-1`, 'yyyy-MM-DD');
      const dateActual = moment();
      if (dateStep.isSameOrBefore(dateActual)) {
        this.showReplicateButton = true;
      } else {
        this.showReplicateButton = false;
      }
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang;
  }

  handleStepChange(event, item) {
    if (!Number(event.value) && event.value !== 0) {
      return;
    }
    this.properties[item] = event.value;
    this.properties.unitProgressBar.total = this.properties.unitPlanned;
    this.properties.unitProgressBar.progress = this.properties.unitActual;
    this.stepChanged.next();
  }

  handleStepCostChange(event, item) {
    if (!Number(event.value) && event.value !== 0) {
      return;
    }
    this.properties[item] = event.value;
    this.properties.costProgressBar.total = this.properties.costPlanned;
    this.properties.costProgressBar.progress = this.properties.costActual;
    this.stepChanged.next();
  }

  handleEditCosts(event) {
    this.editCost.emit({idStep: this.properties.idStep, stepOrder: this.properties.stepOrder, clickEvent: event});
  }

  confirmReplicateValueDif(item) {
    this.item = item;
    if (item === 'unitActual') {
      this.difference = this.properties.unitPlanned - this.properties.unitActual
    } else {
      this.difference = this.properties.costPlanned - this.properties.costActual
    }
    if ( this.difference === 0 || this.properties.stepOrder === 'end') {
      this.handleReplicateValue();
      return;
    }
    this.confirmationSrv.confirm({
      message: this.translateSrv.instant('messages.confirmRedistributeSchedule') + this.difference.toLocaleString(this.language) +
        this.translateSrv.instant('messages.overTheRemainingMonths'),
      key: 'spreadDifferenceConfirm',
      acceptLabel: this.translateSrv.instant('yes'),
      rejectLabel: this.translateSrv.instant('no'),
      accept: async() => {
        this.handleReplicateValue();
        this.handleSpreadDifference();
      },
      reject: () => {
        this.handleReplicateValue();
       }
    });
  }

  handleReplicateValue() {
    let valueChanged;
    if (this.item === 'unitActual') {
      this.properties.unitPlanned = this.properties.unitActual;
      this.properties.unitProgressBar.total = this.properties.unitPlanned;
      valueChanged = document.querySelector(`.unitPlanned-${this.properties.idStep}`);
    } else {
      this.properties.costPlanned = this.properties.costActual;
      this.properties.costProgressBar.total = this.properties.costPlanned;
      valueChanged = document.querySelector(`.costPlanned-${this.properties.idStep}`);
    }
    if (valueChanged) {
      valueChanged.classList.add('changed');
      setTimeout( () => {
        valueChanged.classList.remove('changed');
      }, 1000)
    }
    this.stepChanged.next();
  }

  handleSpreadDifference() {
    this.spreadDifference.next({
      difference: this.difference,
      stepDate: this.properties.stepName,
      idStep: this.properties.idStep,
      type: this.item
    });
  }

  disable() {
    this.multiCostsEdited = !this.properties.editCosts ? true : false;
  }

}
