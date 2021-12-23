import { AuthService } from './../../../../shared/services/auth.service';
import { Location } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Calendar } from 'primeng/calendar';
import { MenuItem, MessageService } from 'primeng/api';
import * as moment from 'moment';

import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICost, IStepPost, IScheduleDetail, IStep } from 'src/app/shared/interfaces/ISchedule';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ScheduleService } from 'src/app/shared/services/schedule.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { CostAccountService } from 'src/app/shared/services/cost-account.service';
import { enterLeave } from 'src/app/shared/animations/enterLeave.animation';
import { ICostAccount } from 'src/app/shared/interfaces/ICostAccount';
import { PlanService } from 'src/app/shared/services/plan.service';

interface ICartItemCostAssignment {
  type: string;
  unitMeasureName?: string;
  unitMeasurePrecision?: number;
  idCost?: number;
  idCostAssignment?: number;
  costAccountName?: string;
  plannedWork?: number;
  actualWork?: number;
  menuItemsCost?: MenuItem[];
  menuItemsNewCost?: MenuItem[];
  readonly?: boolean;
}

@Component({
  selector: 'app-step',
  templateUrl: './step.component.html',
  styleUrls: ['./step.component.scss'],
  animations: [
    enterLeave({ opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'all' }, 300)
  ]
})
export class StepComponent implements OnInit, OnDestroy {

  @ViewChildren(Calendar) calendarComponents: Calendar[];
  responsive: boolean;
  idSchedule: number;
  idWorkpackModelLinked: number;
  idPlan: number;
  schedule: IScheduleDetail;
  start: Date;
  minStart: Date;
  maxStart: Date;
  end: Date;
  minEnd: Date;
  maxEnd: Date;
  stepType: string;
  idStep: number;
  unitName: string;
  unitPrecision: number;
  cardStepProperties: ICard;
  formStep: FormGroup;
  step: IStepPost;
  stepDetail: IStep;
  costs: ICost[];
  cardCostAssignmentsProperties: ICard;
  costAccounts: ICostAccount[];
  costAssignmentsCardItems: ICartItemCostAssignment[];
  showSaveButton = false;
  menuItemsCostAccounts: MenuItem[];
  costAssignmentsTotals = { plannedTotal: 0, actualTotal: 0 };
  $destroy = new Subject();
  calendarFormat: string;
  currentLang = '';
  editPermission = false;

  constructor(
    private actRouter: ActivatedRoute,
    private scheduleSrv: ScheduleService,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private workpackSrv: WorkpackService,
    private costAccountSrv: CostAccountService,
    private router: Router,
    private messageSrv: MessageService,
    private planSrv: PlanService,
    private authSrv: AuthService
  ) {
    this.actRouter.queryParams.subscribe(async ({ idSchedule, idWorkpackModelLinked, stepType, id, unitName, unitPrecision }) => {
      this.idSchedule = idSchedule;
      this.idWorkpackModelLinked = idWorkpackModelLinked
      this.stepType = stepType;
      this.idStep = id;
      this.unitName = unitName;
      this.unitPrecision = unitPrecision;
    });
    this.currentLang = this.translateSrv.currentLang;
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.currentLang = this.translateSrv.getDefaultLang();
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(({ lang }) => {
      this.currentLang = lang;
      setTimeout(() => this.calendarComponents?.map(calendar => {
        calendar.ngOnInit();
        calendar.dateFormat = this.translateSrv.instant('dateFormat');
        calendar.updateInputfield();
      }, 150));
    });
    this.formStep = this.formBuilder.group({
      start: null,
      end: null,
      plannedWork: [null, Validators.required],
      actualWork: null
    });
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    await this.loadPropertiesStep();
    this.handleChangeValuesCardItems();
  }

  async loadPropertiesStep() {
    this.cardStepProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false
    };
    if (this.idStep) {
      const result = await this.scheduleSrv.GetScheduleStepById(this.idStep);
      if (result.success) {
        this.stepDetail = result.data;
        this.idSchedule = this.stepDetail.idSchedule;
        this.step = {
          id: this.stepDetail.id,
          plannedWork: this.stepDetail.plannedWork,
          actualWork: this.stepDetail.actualWork,
          consumes: this.stepDetail.consumes && this.stepDetail.consumes.map(consume => ({
            actualCost: consume.actualCost,
            plannedCost: consume.plannedCost,
            idCostAccount: consume.costAccount.id,
            id: consume.id
          }))
        };
      }
    }
    if (this.idSchedule) {
      const result = await this.scheduleSrv.GetById(this.idSchedule);
      if (result.success) {
        this.schedule = result.data;
        await this.loadPermissions();
        
      }
    }
    if (this.schedule.idWorkpack) {
      this.setBreadcrumb();
    }
    this.setStepFormValues();
    await this.loadMenuItemsCostAccounts();
    this.loadCostAssignmentSession();
  }

  async setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      ... await this.getBreadcrumbs(),
      {
        key: 'step',
        routerLink: ['/workpack/schedule/step'],
        queryParams: { id: this.idStep },
        info: ''
      }
    ]);
  }

  async loadPermissions() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    if (isUserAdmin) {
      this.editPermission = true;
    } else {
      this.idPlan = Number(localStorage.getItem('@currentPlan'));
      const result = await this.workpackSrv.GetWorkpackById(this.schedule.idWorkpack, { 'id-plan': this.idPlan });
      if (result.success) {
        this.editPermission = result.data.permissions.filter(p => p.level === 'EDIT').length > 0;
      }
    }
  }

  async getBreadcrumbs() {
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(this.schedule.idWorkpack, { 'id-plan': this.idPlan });
    const breadcrumbPlan = data.find(d => d.type === 'plan');
    if (breadcrumbPlan) {
      this.planSrv.nextIDPlan(breadcrumbPlan.id);
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

  setStepFormValues() {
    if (this.stepType === 'start') {
      this.start = new Date(this.schedule.start + 'T00:00:00');
      if (this.stepDetail) {
        this.formStep.controls.start.setValue(this.start);
      }
      this.start.setDate(1);
      if (!this.stepDetail) {
        this.start.setMonth(this.start.getMonth() - 1);
      }
      this.minStart = new Date(this.start);
      const numDays = moment(this.start).daysInMonth();
      this.maxStart = new Date(this.start);
      this.maxStart.setDate(numDays);
    }
    if (this.stepType === 'end') {
      this.end = new Date(this.schedule.end + 'T00:00:00');
      if (this.stepDetail) {
        this.formStep.controls.end.setValue(this.end);
      }
      this.end.setDate(1);
      if (!this.stepDetail) {
        this.end.setMonth(this.end.getMonth() + 1);
      }
      this.minEnd = new Date(this.end);
      const numDays = moment(this.end).daysInMonth();
      this.maxEnd = new Date(this.end);
      this.maxEnd.setDate(numDays);
    }
    if (this.stepType === 'newStart') {
      this.start = new Date(this.schedule.start + 'T00:00:00');
      this.start.setDate(1);
      this.start.setMonth(this.start.getMonth() - 1);
      this.minStart = null;
      const numDays = moment(this.start).daysInMonth();
      this.maxStart = new Date(this.start);
      this.maxStart.setDate(numDays);
    }
    if (this.stepType === 'newEnd') {
      this.end = new Date(this.schedule.end + 'T00:00:00');
      this.end.setDate(1);
      this.end.setMonth(this.end.getMonth() + 1);
      this.minEnd = new Date(this.end);
      this.maxEnd = null;
    }
    if (this.stepDetail) {
      this.formStep.controls.plannedWork.setValue(this.stepDetail.plannedWork);
      this.formStep.controls.actualWork.setValue(this.stepDetail.actualWork);
    }
    if (!this.editPermission) {
      this.formStep.disable();
    }
  }

  loadCostAssignmentSession() {
    this.cardCostAssignmentsProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'costAssignment',
      collapseble: true,
      initialStateCollapse: false
    };
    if (this.step && this.step.consumes) {
      this.costAssignmentsCardItems = this.step.consumes.map(consume => {
        const costAccount = this.costAccounts.find(cost => cost.id === consume.idCostAccount);
        const propertyModelName = costAccount.models.find(p => p.name === 'name');
        const propertyName = costAccount.properties.find(p => p.idPropertyModel === propertyModelName.id);
        return {
          type: 'cost-card',
          unitMeasureName: '$',
          idCost: consume.idCostAccount,
          idCostAssignment: consume.id,
          costAccountName: propertyName.value as string,
          plannedWork: consume.plannedCost,
          actualWork: consume.actualCost,
          menuItemsCost: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteCost(consume.idCostAccount)
          }],
          readonly: !this.editPermission
        };
      });
      if (!!this.editPermission) {
        this.costAssignmentsCardItems.push({
          type: 'new-cost-card',
          menuItemsNewCost: this.menuItemsCostAccounts
        });
      }
      return;
    }
    if (!!this.editPermission) {
      this.costAssignmentsCardItems = [{
        type: 'new-cost-card',
        menuItemsNewCost: this.menuItemsCostAccounts
      }];
    }
  }

  async loadMenuItemsCostAccounts() {
    const costAccountsIds = this.step?.consumes ? this.step.consumes.map(consume => consume.idCostAccount) : [];
    const result = await this.costAccountSrv.GetAll({ 'id-workpack': this.schedule.idWorkpack });
    if (result.success) {
      this.costAccounts = result.data;
      const workpacksIds = this.costAccounts.map(cost => cost.idWorkpack);
      const workpacksIdsNotRepeated = workpacksIds.filter((w, i) => workpacksIds.indexOf(w) === i);

      this.menuItemsCostAccounts = await Promise.all(workpacksIdsNotRepeated.map(async (idWorkpack) => {
        const workpack = await this.workpackSrv.GetWorkpackById(idWorkpack, { 'id-plan': this.idPlan });
        if (workpack.success) {
          const workpackCostAccounts = this.costAccounts.filter(cost => cost.idWorkpack === idWorkpack);
          return {
            label: workpack.data.model.modelName,
            items: workpackCostAccounts.map(workpackCost => {
              const propertyModelName = workpackCost.models.find(p => p.name === 'name');
              const propertyName = workpackCost.properties.find(p => p.idPropertyModel === propertyModelName.id);
              return {
                label: propertyName.value as string,
                id: workpackCost.id.toString(),
                disabled: costAccountsIds.includes(workpackCost.id) || (!this.editPermission),
                command: () => this.createNewCardItemCost(workpackCost.id, propertyName.value as string)
              } as MenuItem;
            })
          };
        }
      }));
    }
  }

  createNewCardItemCost(idCost: number, costName: string) {
    if (!this.formStep.valid) {
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
    if (this.formStep.valid) {
      if (this.costAssignmentsCardItems && this.costAssignmentsCardItems.length > 1) {
        this.reloadCostAssignmentTotals();
        this.showSaveButton = true;
      }
    }
  }

  handleChangeTotalsValues() {
    if (this.formStep.valid) {
      if (this.costAssignmentsCardItems && this.costAssignmentsCardItems.length > 1) {
        this.reloadCostAssignmentTotals();
        this.showSaveButton = true;
      }
    }
  }

  reloadCostAssignmentTotals() {
    const plannedTotal = this.costAssignmentsCardItems.filter(card => card.type === 'cost-card')
      .reduce((total, cost) => total + cost.plannedWork, 0);
    const actualTotal = this.costAssignmentsCardItems.filter(card => card.type === 'cost-card')
      .reduce((total, cost) => total + cost.actualWork, 0);
    this.costAssignmentsTotals = {
      actualTotal,
      plannedTotal
    };
  }


  async saveStep() {
    this.step = {
      id: this.step && this.step.id,
      idSchedule: this.step ? this.step.idSchedule : this.idSchedule,
      plannedWork: this.formStep.controls.plannedWork.value,
      actualWork: this.formStep.controls.actualWork.value,
      endStep: (this.stepType === 'end' || this.stepType === 'newEnd') ? true : false,
      periodFromStart: (this.stepType === 'end' || this.stepType === 'newEnd') ? this.formStep.controls.end.value : this.formStep.controls.start.value,
      consumes: this.costAssignmentsCardItems.filter(card => card.type === 'cost-card').map(cost => ({
        id: cost.idCostAssignment && cost.idCostAssignment,
        idCostAccount: cost.idCost,
        plannedCost: cost.plannedWork,
        actualCost: cost.actualWork
      }))
    };
    if (this.step.id) {
      const result = await this.scheduleSrv.putScheduleStep(this.step);
      if (result.success) {
        this.router.navigate(['/workpack'],
          {
            queryParams: {
              id: this.schedule.idWorkpack,
              idWorkpackModelLinked: this.idWorkpackModelLinked
            }
          }
        );
      }
    }
    if (!this.step.id) {
      const result = await this.scheduleSrv.postScheduleStep(this.step);
      if (result.success) {
        this.router.navigate(['/workpack'],
          {
            queryParams: {
              id: this.schedule.idWorkpack,
              idWorkpackModelLinked: this.idWorkpackModelLinked
            }
          }
        );
      }
    }
  }
}
