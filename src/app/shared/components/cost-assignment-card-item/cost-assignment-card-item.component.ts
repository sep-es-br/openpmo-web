import { takeUntil, debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Component, OnInit, Input, Output, OnDestroy, EventEmitter } from '@angular/core';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { TranslateService } from '@ngx-translate/core';
import { ScheduleStartChangeService } from 'src/app/shared/services/schedule-start-change.service';
import * as moment from 'moment';
import { ICartItemCostAssignment } from '../../interfaces/ICartItemCostAssignment';

@Component({
  selector: 'app-cost-assignment-card-item',
  templateUrl: './cost-assignment-card-item.component.html',
  styleUrls: ['./cost-assignment-card-item.component.scss']
})
export class CostAssignmentCardItemComponent implements OnInit, OnDestroy {

  @Input() properties: ICartItemCostAssignment;
  @Input() scheduleStartDate: Date;
  @Input() isPassedMonth: boolean;
  @Input() hasActiveBaseline: boolean;
  @Input() periodFromStart: Date;
  @Output() costChanged = new EventEmitter();
  @Output() spreadDifference = new EventEmitter();

  iconsEnum = IconsEnum;
  responsive: boolean;
  cardIdItem: string;
  currentLang: string;
  $destroy = new Subject();
  actualWorkValidadeMessage: string;
  difference: number;
  debounceValidate = new Subject();

  isActualValuesDisabled: boolean;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private scheduleStartChangeSrv: ScheduleStartChangeService,
    private messageSrv: MessageService,
    private confirmationSrv: ConfirmationService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.scheduleStartChangeSrv.observable.pipe(takeUntil(this.$destroy)).subscribe( scheduleStartChanged => {
      if (!!scheduleStartChanged) {
        this.handleValidateActualCost();
      }
    });
    this.currentLang = this.translateSrv.getDefaultLang();
    this.translateSrv.onDefaultLangChange.pipe(takeUntil(this.$destroy)).subscribe(({ lang }) => this.currentLang = lang);
    this.debounceValidate.pipe(debounceTime(1000), takeUntil(this.$destroy)).subscribe((data) => {
      this.checkCostAccountBalance(data);
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  ngOnInit(): void {
    this.cardIdItem = this.properties.idCost ?
      `${this.properties.idCost < 10 ? '0' + this.properties.idCost : this.properties.idCost}` : '';

    this.updateActualValues();
  }

  handleCostChange(event, field: string) {
    if (!Number(event.value) && event.value !== 0) {
      return;
    }
    setTimeout(() => {
      this.properties[field] = event.value;
      this.costChanged.emit();
    }, 1);
  }

  handleActualCostChange(event, field: string) {
    if (!Number(event.value) && event.value !== 0) {
      return;
    }
    const startDate = moment(this.scheduleStartDate);
    const today = moment();
    if (today.isBefore(startDate, 'months') && event && event.value > 0) {
      this.actualWorkValidadeMessage = this.translateSrv.instant('messages.scheduleActualValueValidation');
    } else {
      this.actualWorkValidadeMessage = null;
    }
    setTimeout(() => {
      this.properties[field] = event.value;
      this.costChanged.emit();
    }, 1);
  }

  confirmReplicateValueDif() {
    this.difference = this.properties.plannedWork - this.properties.actualWork
    if ( this.difference === 0 || this.properties.endStep) {
      this.handleReplicateValue();
      return;
    }
    this.confirmationSrv.confirm({
      message: this.translateSrv.instant('messages.confirmRedistributeSchedule') + this.difference.toLocaleString(this.currentLang) + 
        this.translateSrv.instant('messages.overTheRemainingMonths'),
      key: 'spreadDifferenceConfirm',
      acceptLabel: this.translateSrv.instant('yes'),
      rejectLabel: this.translateSrv.instant('no'),
      accept: async() => {
        this.handleReplicateValue(true);
        this.handleSpreadDifference();
      },
      reject: () => {
        this.handleReplicateValue();
       }
    });
  }

  handleSpreadDifference() {
    this.spreadDifference.next({
      difference: this.difference
    });
  }

  handleReplicateValue(spread?) {
    this.properties.plannedWork = this.properties.actualWork;
    const valueChanged = document.querySelector(`.costPlanned-${this.properties.idCost}`);
    if (valueChanged) {
      valueChanged.classList.add('changed');
      setTimeout( () => {
        valueChanged.classList.remove('changed');
      }, 1000)
    }
    if (!spread) {
      this.costChanged.emit();
    }
    
  }

  checkCostAccountBalance(data) {
    if (!Number(data.value.value)) {
      return;
    }
    if (this.properties.costAccountAllocation && this.properties.costAccountAllocation.limit) {
      if (this.properties.costAccountAllocation.limit -
          ( data.type === 'plannedWork' ? this.properties.costAccountAllocation.planed :  this.properties.costAccountAllocation.actual) - data.value.value < 0) {
        this.messageSrv.add({
          detail: this.translateSrv.instant('messages.costAccountBalanceValidation'),
          severity: 'warn',
          summary: 'Erro',
        })
      }
    }
  }

  handleValidateActualCost() {
    const startDate = moment(this.scheduleStartDate);
    const today = moment();
    if (today.isBefore(startDate, 'months') && this.properties.actualWork && this.properties.actualWork > 0) {
      this.actualWorkValidadeMessage = this.translateSrv.instant('messages.scheduleActualValueValidation');
    } else {
      this.actualWorkValidadeMessage = null;
    }
  }

  updateActualValues() {
    debugger
    if (!this.periodFromStart) return;

    const dateStep = moment(this.periodFromStart, 'YYYY-MM');
    const startOfCurrentMonth = moment().startOf('month');

    this.isActualValuesDisabled = dateStep.isAfter(startOfCurrentMonth);
  }

}

