import { ScheduleStartChangeService } from './../../../shared/services/schedule-start-change.service';
import { Component, OnDestroy, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Calendar } from 'primeng/calendar';
import { MenuItem, MessageService } from 'primeng/api';

import { TypePropertyModelEnum } from 'src/app/shared/enums/TypePropertyModelEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ISchedule, ICost } from 'src/app/shared/interfaces/ISchedule';
import { IMeasureUnit } from 'src/app/shared/interfaces/IMeasureUnit';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { MeasureUnitService } from 'src/app/shared/services/measure-unit.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ScheduleService } from 'src/app/shared/services/schedule.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { CostAccountService } from 'src/app/shared/services/cost-account.service';
import { enterLeave } from 'src/app/shared/animations/enterLeave.animation';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { IWorkpack } from 'src/app/shared/interfaces/IWorkpack';
import { PlanService } from 'src/app/shared/services/plan.service';
import * as moment from 'moment';

interface ICartItemCostAssignment {
  type: string;
  unitMeasureName?: string;
  idCost?: number;
  costAccountName?: string;
  plannedWork?: number;
  actualWork?: number;
  menuItemsCost?: MenuItem[];
  menuItemsNewCost?: MenuItem[];
}

@Component({
  selector: 'app-schedule',
  templateUrl: './schedule.component.html',
  styleUrls: ['./schedule.component.scss'],
  animations: [
    enterLeave({ opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'all' }, 300)
  ]
})
export class ScheduleComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChildren(Calendar) calendarComponents: Calendar[];

  responsive: boolean;
  idWorkpack: number;
  idWorkpackModelLinked: number;
  idPlan: number;
  workpack: IWorkpack;
  unitMeasure: string;
  cardScheduleProperties: ICard;
  formSchedule: FormGroup;
  schedule: ISchedule;
  costs: ICost[];
  cardCostAssignmentsProperties: ICard;
  costAssignmentsCardItems: ICartItemCostAssignment[];
  menuItemsCostAccounts: MenuItem[];
  costAssignmentsTotals = { plannedTotal: 0, actualTotal: 0 };
  $destroy = new Subject();
  calendarFormat: string;
  yearRange: string;
  actualValidationMessage: string;
  scheduleStartDate: Date;

  constructor(
    private actRouter: ActivatedRoute,
    private scheduleSrv: ScheduleService,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private unitMeasureSrv: MeasureUnitService,
    private workpackSrv: WorkpackService,
    private costAccountSrv: CostAccountService,
    private messageSrv: MessageService,
    private router: Router,
    private planSrv: PlanService,
    private scheduleStartChangeSrv: ScheduleStartChangeService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idWorkpack = queryParams.idWorkpack;
      this.idWorkpackModelLinked = queryParams.idWorkpackModelLinked;
      this.unitMeasure = queryParams.unitMeansureName;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.calendarComponents?.map(calendar => {
        calendar.ngOnInit();
        calendar.dateFormat = this.translateSrv.instant('dateFormat');
        calendar.updateInputfield();
      }, 150));
    }
    );
    const newDate = moment();
    this.formSchedule = this.formBuilder.group({
      start: [newDate.toDate(), Validators.required],
      end: [newDate.add(1, 'days').toDate(), Validators.required],
      plannedWork: [null, Validators.required],
      actualWork: null
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    const today = moment();
    const yearStart = today.year();
    this.yearRange = (yearStart - 1).toString() + ':' + (yearStart + 15).toString();
    await this.loadPropertiesSchedule();
  }

  async setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      ... await this.getBreadcrumbs(),
      {
        key: 'schedule',
        routerLink: ['/workpack/schedule'],
        queryParams: { id: this.idWorkpack },
        info: ''
      }
    ]);
  }

  async getBreadcrumbs() {
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(this.idWorkpack, { 'id-plan': this.idPlan });
    const breadcrumbPlan = data.find(d => d.type === 'plan');
    if (breadcrumbPlan) {
    }
    return success
      ? data.map(p => ({
        key: p.type.toLowerCase(),
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: { id: p.id, idWorkpackModelLinked: p.idWorkpackModelLinked }
      }))
      : [];
  }

  getRouterLinkFromType(type: string): string[] {
    switch (type) {
      case 'office':
        return ['/offices', 'office'];
      case 'plan':
        return ['plan'];
      default:
        return ['/workpack'];
    }
  }

  async loadPropertiesSchedule() {
    this.cardScheduleProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false
    };
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    await this.setBreadcrumb();
    await this.loadMenuItemsCostAccounts();
    this.loadCostAssignmentSession();
  }

  loadCostAssignmentSession() {
    this.cardCostAssignmentsProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'costAssignment',
      collapseble: false,
      initialStateCollapse: false
    };
    this.costAssignmentsCardItems = [{
      type: 'new-cost-card',
      menuItemsNewCost: this.menuItemsCostAccounts
    }];
  }

  async loadMenuItemsCostAccounts() {
    const result = await this.costAccountSrv.GetAll({ 'id-workpack': this.idWorkpack });
    if (result.success) {
      const costAccounts = result.data;
      const workpacksIds = costAccounts.map(cost => cost.idWorkpack);
      const workpacksIdsNotRepeated = workpacksIds.filter((w, i) => workpacksIds.indexOf(w) === i);

      this.menuItemsCostAccounts = await Promise.all(workpacksIdsNotRepeated.map(async (idWorkpack) => {
        const workpack = await this.workpackSrv.GetWorkpackById(idWorkpack, { 'id-plan': this.idPlan });
        if (workpack.success) {
          const workpackCostAccounts = costAccounts.filter(cost => cost.idWorkpack === idWorkpack);
          return {
            label: workpack.data.model.modelName,
            items: workpackCostAccounts.map(workpackCost => {
              const propertyModelName = workpackCost.models.find(p => p.name === 'name');
              const propertyName = workpackCost.properties.find(p => p.idPropertyModel === propertyModelName.id);
              return {
                label: propertyName.value as string,
                id: workpackCost.id.toString(),
                command: () => this.createNewCardItemCost(workpackCost.id, propertyName.value as string)
              };
            })
          };
        }
      }));
    }
  }

  createNewCardItemCost(idCost: number, costName: string) {
    if (!this.formSchedule.valid) {
      setTimeout(() => {
        this.messageSrv.add({ severity: 'warn', summary: 'Erro', detail: this.translateSrv.instant('messages.scheduleNotValid') });
      }, 500);
      return;
    }
    const costAssignmentsCardItemsList = this.costAssignmentsCardItems.filter(card => card.type === 'cost-card');
    const costAccountsIds = costAssignmentsCardItemsList.map(cardItem => (cardItem.idCost));
    this.menuItemsCostAccounts = Array.from(this.menuItemsCostAccounts.map(group => {
      const items = group.items.map(item => ({
        ...item,
        disabled: costAccountsIds.includes(Number(item.id)) || Number(item.id) === idCost
      }));
      return {
        ...group,
        items
      };
    }));
    if (costAssignmentsCardItemsList.length > 0) {
      this.costAssignmentsCardItems = costAssignmentsCardItemsList;
      this.costAssignmentsCardItems.push({
        type: 'cost-card',
        unitMeasureName: '$',
        idCost,
        costAccountName: costName,
        plannedWork: null,
        actualWork: null,
        menuItemsCost: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteCost(idCost)
        }],
      });
      this.costAssignmentsCardItems.push({
        type: 'new-cost-card',
        menuItemsNewCost: this.menuItemsCostAccounts
      });
      return;
    }
    this.costAssignmentsCardItems = [
      {
        type: 'cost-card',
        unitMeasureName: '$',
        idCost,
        costAccountName: costName,
        plannedWork: null,
        actualWork: null,
        menuItemsCost: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteCost(idCost)
        }],
      }
    ];
    this.costAssignmentsCardItems.push({
      type: 'new-cost-card',
      menuItemsNewCost: this.menuItemsCostAccounts
    });
  }

  deleteCost(idCost: number) {
    const menuItems = this.menuItemsCostAccounts.map(group => {
      const items = group.items.map(item => {
        if (Number(item.id) === idCost) {
          return {
            ...item,
            disabled: false
          };
        } else {
          return {
            ...item
          };
        }
      });
      return {
        ...group,
        items
      };
    });
    this.costAssignmentsCardItems[this.costAssignmentsCardItems.length - 1] = {
      type: 'new-cost-card',
      menuItemsNewCost: Array.from(menuItems)
    };
    this.menuItemsCostAccounts = Array.from(menuItems);
    this.costAssignmentsCardItems = Array.from(this.costAssignmentsCardItems.filter(cost => cost.idCost !== idCost));
    this.reloadCostAssignmentTotals();
  }

  handleChangeValuesCardItems() {
    this.reloadCostAssignmentTotals();
    if (!this.actualValidationMessage && this.formSchedule.valid) {
      if (this.costAssignmentsCardItems && this.costAssignmentsCardItems.length > 0
        && this.costAssignmentsCardItems.filter(item => item.type !== 'new-cost-card').length === this.costAssignmentsCardItems.length - 1) {
        const startDate = moment(this.formSchedule.controls.start.value);
        const today = moment();
        if (today.isBefore(startDate, 'months') && this.costAssignmentsCardItems.filter(item => item.actualWork && item.actualWork > 0).length > 0) {
          this.saveButton?.hideButton();
        } else {
          this.saveButton?.showButton();
        }
      } else {
        
      }
    } else {
      this.saveButton?.hideButton();
    }
  }

  handleChangeValues() {
    this.scheduleStartDate = this.formSchedule.controls.start.value;
    if (this.formSchedule.controls.actualWork.value > 0 && this.formSchedule.controls.start.value) {
      const startDate = moment(this.formSchedule.controls.start.value);
      const today = moment();
      if (today.isBefore(startDate, 'months')) {
        this.actualValidationMessage = this.translateSrv.instant('messages.scheduleActualValueValidation');
        this.saveButton.hideButton();
      } else {
        this.actualValidationMessage = null;
      }
    } else {
      this.actualValidationMessage = null;
    }
    if (!this.actualValidationMessage && this.formSchedule.valid) {
      if (this.costAssignmentsCardItems && this.costAssignmentsCardItems.length > 0
        && this.costAssignmentsCardItems.filter(item => item.plannedWork && item.plannedWork > 0).length > 0) {
        const startDate = moment(this.formSchedule.controls.start.value);
        const today = moment();
        if (today.isBefore(startDate, 'months') && this.costAssignmentsCardItems.filter(item => item.actualWork && item.actualWork > 0).length > 0) {
          this.saveButton.hideButton();
        } else {
          this.saveButton?.showButton();
        }
      } else {
        this.saveButton?.hideButton();
      }
    } else {
      this.saveButton?.hideButton();
    }
  }

  handleChangeScheduleStartDate() {
    this.scheduleStartChangeSrv.next(true);
  }

  handleActualWorkChangeValues(event, eventType) {
    if (this.formSchedule.controls.start.value && ((event && event.value && event.value !== null && event.value !== 0)
      || (eventType === 'blur' && this.formSchedule.controls.actualWork.value > 0))) {
      const startDate = moment(this.formSchedule.controls.start.value);
      const today = moment();
      if (today.isBefore(startDate, 'months')) {
        this.actualValidationMessage = this.translateSrv.instant('messages.scheduleActualValueValidation');
        this.saveButton.hideButton();
      } else {
        this.actualValidationMessage = null;
      }
    } else {
      this.actualValidationMessage = null;
    }

    if (!this.actualValidationMessage && this.formSchedule.valid) {
      if (this.costAssignmentsCardItems && this.costAssignmentsCardItems.length > 0 &&
        this.costAssignmentsCardItems.filter(item => item.plannedWork && item.plannedWork > 0).length > 0) {
          const startDate = moment(this.formSchedule.controls.start.value);
          const today = moment();
          if (today.isBefore(startDate, 'months') && this.costAssignmentsCardItems.filter(item => item.actualWork && item.actualWork > 0).length > 0) {
            this.saveButton.hideButton();
          } else {
            this.saveButton?.showButton();
          }
      } else {
        this.saveButton?.hideButton();
      }
    } else {
      this.saveButton?.hideButton();
    }
  }

  reloadCostAssignmentTotals() {
    const items = this.costAssignmentsCardItems.filter(card => card.type === 'cost-card');
    const plannedTotal = items.reduce((total, cost) => total + cost.plannedWork, 0);
    const actualTotal = items.reduce((total, cost) => total + cost.actualWork, 0);
    this.costAssignmentsTotals = { actualTotal, plannedTotal };
  }

  async saveSchedule() {
    const startDate = moment(this.formSchedule.controls.start.value);
    const endDate = moment(this.formSchedule.controls.end.value);
    if (startDate.isSame(endDate, 'days')) {
      this.messageSrv.add({ severity: 'warn', summary: 'Erro', detail: this.translateSrv.instant('messages.startDateIsSameEndDate') });
      return;
    }
    if (startDate.isAfter(endDate, 'days')) {
      this.messageSrv.add({ severity: 'warn', summary: 'Erro', detail: this.translateSrv.instant('messages.startDateIsAfterEndDate') });
      return;
    }
    this.schedule = {
      idWorkpack: this.idWorkpack,
      start: this.formSchedule.controls.start.value,
      end: this.formSchedule.controls.end.value,
      plannedWork: this.formSchedule.controls.plannedWork.value,
      actualWork: this.formSchedule.controls.actualWork.value,
      costs: this.costAssignmentsCardItems.filter(card => card.type === 'cost-card').map(cost => ({
        id: cost.idCost,
        plannedCost: cost.plannedWork,
        actualCost: cost.actualWork
      }))
    };

    const result = await this.scheduleSrv.postSchedule(this.schedule);
    if (result.success) {
      this.router.navigate(
        ['/workpack'],
        {
          queryParams: {
            id: this.idWorkpack,
            idWorkpackModelLinked: this.idWorkpackModelLinked
          }
        }
      );
    }
  }
}
