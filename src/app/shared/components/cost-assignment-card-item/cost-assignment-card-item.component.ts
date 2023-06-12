import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { Component, OnInit, Input, Output, OnDestroy, EventEmitter } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
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
  @Output() costChanged = new EventEmitter();

  iconsEnum = IconsEnum;
  responsive: boolean;
  cardIdItem: string;
  currentLang: string;
  $destroy = new Subject();
  actualWorkValidadeMessage: string;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private scheduleStartChangeSrv: ScheduleStartChangeService,
    private messageSrv: MessageService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.scheduleStartChangeSrv.observable.pipe(takeUntil(this.$destroy)).subscribe( scheduleStartChanged => {
      if (!!scheduleStartChanged) {
        this.handleValidateActualCost();
      }
    });
    this.currentLang = this.translateSrv.getDefaultLang();
    this.translateSrv.onDefaultLangChange.pipe(takeUntil(this.$destroy)).subscribe(({ lang }) => this.currentLang = lang);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  ngOnInit(): void {
    this.cardIdItem = this.properties.idCost ?
      `${this.properties.idCost < 10 ? '0' + this.properties.idCost : this.properties.idCost}` : '';
  }

  handleCostChange(event, field: string) {
    setTimeout(() => {
      this.properties[field] = event.value;
      this.costChanged.emit();
    }, 1);
  }

  handleActualCostChange(event, field: string) {
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

  handleReplicateValue() {
    this.properties.plannedWork = this.properties.actualWork;
    const valueChanged = document.querySelector(`.costPlanned-${this.properties.idCost}`);
    if (valueChanged) {
      valueChanged.classList.add('changed');
      setTimeout( () => {
        valueChanged.classList.remove('changed');
      }, 1000)
    }
    this.costChanged.emit();
  }

  checkCostAccountBalance(event, field: string) {
    if (this.properties.costAccountAllocation && this.properties.costAccountAllocation.limit) {
      if (this.properties.costAccountAllocation.limit -
          ( field === 'plannedWork' ? this.properties.costAccountAllocation.planed :  this.properties.costAccountAllocation.actual) - event.value < 0) {
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

}
