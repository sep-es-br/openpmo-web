import { Component, Input, OnInit, EventEmitter, Output, OnDestroy, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EMPTY, Observable, Subject } from 'rxjs';
import { map, switchMap, takeUntil } from 'rxjs/operators';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IScheduleStepCardItem } from 'src/app/shared/interfaces/IScheduleStepCardItem';
import * as moment from 'moment';
import { ConfirmationService, MessageService } from 'primeng/api';
import { LabelService } from 'src/app/shared/services/label.service';
import { ActivatedRoute } from '@angular/router';
import { ScheduleStepCardItemService } from 'src/app/shared/services/schedule-step-card-item.service';

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
  foreseenLabel: string;
  tooltipLabel: string;
  isActualValuesDisabled: boolean = false;
  isCurrentBaseline: boolean = false;
  isPassedMonth: boolean = false;
  maxValueCosts: number;
  maxValueUnit: number;

  constructor(
    private translateSrv: TranslateService,
    private confirmationSrv: ConfirmationService,
    private labelSrv: LabelService,
    private route: ActivatedRoute,
    private scheduleCardItemSrv: ScheduleStepCardItemService,
    private cdr: ChangeDetectorRef
  ) {
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() =>
      {
        setTimeout(() => this.setLanguage(), 200);
       this.ngOnInit();
      }
    );
   }

  ngOnInit(): void {
    
    this.maxValueCosts = this.getMaxValueCosts();
    this.maxValueUnit = this.getMaxValueUnit();

    this.cardIdItem = this.properties.idStep ?
      `${this.properties.idStep < 10 ? '0' + this.properties.idStep : this.properties.idStep}` : '';
    this.setLanguage();
    this.handlePassedMonths();
    this.updateActualValues();
    this.handleCurrentBaseline();
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

    this.route.queryParams.subscribe(params => {
      const idWorkpack = params['id'];
      if (idWorkpack) {
        this.labelSrv.getLabels(idWorkpack).subscribe(
          response => {
            this.tooltipLabel = response.data[0].body.data;
            this.foreseenLabel = response.data[1].body.data;
          },
          error => {
            console.error(error);
          }
        );
      }
    });
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

    this.updateMaxValueCosts();
    this.updateMaxValueUnit();

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

  handlePassedMonths() {
    if (!this.properties.stepName) return;
    
    const stepDate = this.formatToYearMonth(this.properties.stepName);
    const currentDate = this.formatToYearMonth(new Date());

    this.isPassedMonth = stepDate < currentDate;
  }

  updateActualValues() {

    const stepDate = this.formatToYearMonth(this.properties.stepName);
    const currentDate = this.formatToYearMonth(new Date());
    
    this.isActualValuesDisabled = stepDate > currentDate;
  }

  private formatToYearMonth(date: Date): number {
    return (date.getFullYear() * 100) + (date.getMonth() + 1);
  }

  private getWorkpackId(): Observable<number | null> {
    return this.route.queryParams.pipe(
      map(params => params['id'] || null)
    );
  }

  handleCurrentBaseline() {
    this.getWorkpackId().pipe(
      switchMap(workpackId => {
        if (!workpackId) return EMPTY;
        return this.scheduleCardItemSrv.getCurrentBaseline(workpackId);
      })
    ).subscribe(response => {
      this.isCurrentBaseline = response.data;
      this.scheduleCardItemSrv.isCurrentBaseline$.next(this.isCurrentBaseline);
    });
  }
  
  updateMaxValueCosts() {
    this.maxValueCosts = this.getMaxValueCosts();
    this.cdr.detectChanges();
  }

  updateMaxValueUnit() {
    this.maxValueUnit = this.getMaxValueUnit();
    this.cdr.detectChanges();
  }

  getMaxValueCosts() {
    if (this.properties.type === "newStart" || this.properties.type === "newEnd") return;

    const inputValues = [
      this.properties.costActual,
      this.properties.costPlanned,
      this.properties.baselinePlannedCost
    ];
    
    return Math.max(...inputValues);
  }

  getMaxValueUnit() {
    if (this.properties.type === "newStart" || this.properties.type === "newEnd") return;

    const inputValues = [
      this.properties.unitActual,
      this.properties.unitBaseline,
      this.properties.unitPlanned
    ]

    return Math.max(...inputValues);
  }

}
