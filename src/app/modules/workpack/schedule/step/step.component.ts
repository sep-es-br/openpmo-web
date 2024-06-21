import { AuthService } from './../../../../shared/services/auth.service';
import { Component, OnDestroy, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
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
import { ICartItemCostAssignment } from 'src/app/shared/interfaces/ICartItemCostAssignment';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

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
  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;
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
  costAssignmentsCardItems: ICartItemCostAssignment[] = [];
  menuItemsCostAccounts: MenuItem[];
  costAssignmentsTotals = { plannedTotal: 0, actualTotal: 0 };
  baselinePlannedTotals: { plannedCost: number; plannedWork: number };
  $destroy = new Subject();
  calendarFormat: string;
  currentLang = '';
  editPermission = false;
  onlyOneStep = false;
  isLoading = false;
  formIsSaving = false;

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
    private authSrv: AuthService
  ) {
    this.actRouter.queryParams.subscribe(async({ idSchedule, idWorkpackModelLinked, stepType, idStep, unitName, unitPrecision }) => {
      this.idSchedule = idSchedule;
      this.idWorkpackModelLinked = idWorkpackModelLinked;
      this.stepType = stepType;
      this.idStep = idStep;
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
      actualWork: null,
      distribution: 'SIGMOIDAL'
    });
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    this.formStep.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.handleChangeValuesCardItems());
    this.formStep.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formStep.dirty && this.formStep.valid))
      .subscribe(() => this.handleChangeValuesCardItems());
    this.formStep.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formStep.dirty))
      .subscribe(() => this.cancelButton.showButton());
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    this.isLoading = true;
    await this.loadPropertiesStep();
    this.isLoading = false;
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
            id: consume.id,
            nameCostAccount: consume.costAccount.name
          }))
        };
        this.baselinePlannedTotals = {
          plannedCost: this.stepDetail.baselinePlannedCost,
          plannedWork: this.stepDetail.baselinePlannedWork
        };
      }
    }
    if (this.idSchedule) {
      const result = await this.scheduleSrv.GetById(this.idSchedule);
      if (result.success) {
        this.schedule = result.data;
        if (this.schedule.groupStep.length === 1) {
          this.onlyOneStep = this.schedule.groupStep[0].steps.length === 1;
        }
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
    let breadcrumbItems = this.breadcrumbSrv.get;
    if (!breadcrumbItems || breadcrumbItems.length === 0) {
      breadcrumbItems = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(this.schedule.idWorkpack, this.idPlan);
    }
    this.breadcrumbSrv.setMenu([
      ...breadcrumbItems,
      {
        key: 'step',
        info: !this.idStep ? '' : moment(this.stepDetail.periodFromStart).format('MMMM')
      }
    ]);
  }

  async loadPermissions() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    const result = await this.workpackSrv.GetWorkpackPermissions(this.schedule.idWorkpack, { 'id-plan': this.idPlan });
    if (result.success) {
      if (isUserAdmin) {
        this.editPermission = !result.data.canceled;
      } else {
        this.editPermission = result.data.permissions.filter(p => p.level === 'EDIT').length > 0 && !result.data.canceled;
      }
      if (result.data.endManagementDate && result.data.endManagementDate !== null) {
        this.editPermission = false;
      }
    }
  }

  setStepFormValues() {
    switch (this.stepType) {
      case 'start':
        this.start = new Date(this.schedule.start + 'T00:00:00');
        if (this.stepDetail) {
          this.formStep.reset({
            start: this.start,
            end: null,
            plannedWork: this.stepDetail.plannedWork,
            actualWork: this.stepDetail.actualWork,
          });
        }
        this.start.setDate(1);
        if (!this.stepDetail) {
          this.start.setMonth(this.start.getMonth() - 1);
        }
        this.minStart = new Date(this.start);
        const numDaysStart = moment(this.start).daysInMonth();
        this.maxStart = new Date(this.start);
        this.maxStart.setDate(numDaysStart);
        break;
      case 'end':
        this.end = new Date(this.schedule.end + 'T00:00:00');
        if (this.stepDetail) {
          this.formStep.reset({
            start: null,
            end: this.end,
            plannedWork: this.stepDetail.plannedWork,
            actualWork: this.stepDetail.actualWork,
          });
        }
        this.end.setDate(1);
        if (!this.stepDetail) {
          this.end.setMonth(this.end.getMonth() + 1);
        }
        this.minEnd = new Date(this.end);
        const numDaysEnd = moment(this.end).daysInMonth();
        this.maxEnd = new Date(this.end);
        this.maxEnd.setDate(numDaysEnd);
        break;
      case 'newStart':
        this.start = new Date(this.schedule.start + 'T00:00:00');
        this.start.setDate(1);
        this.start.setMonth(this.start.getMonth() - 1);
        this.minStart = null;
        this.formStep.controls.start.setValidators(Validators.required);
        this.formStep.reset({
          start: this.start,
          end: null,
          plannedWork: null,
          actualWork: null,
          distribution: 'SIGMOIDAL'
        });
        const numDays = moment(this.start).daysInMonth();
        this.maxStart = new Date(this.start);
        this.maxStart.setDate(numDays);
        break;
      case 'newEnd':
        this.end = new Date(this.schedule.end + 'T00:00:00');
        this.end.setDate(1);
        this.end.setMonth(this.end.getMonth() + 1);
        this.formStep.controls.end.setValidators(Validators.required);
        this.formStep.reset({
          start: null,
          end: this.end,
          plannedWork: null,
          actualWork: null,
          distribution: 'SIGMOIDAL'
        });
        this.minEnd = new Date(this.end);
        this.maxEnd = null;
        break;
      default:
        if (this.stepDetail) {
          this.formStep.reset({
            start: null,
            end: null,
            plannedWork: this.stepDetail.plannedWork,
            actualWork: this.stepDetail.actualWork,
          });
        }
        break;
    }
    if (!this.editPermission) {
      this.formStep.disable();
    }
  }

  loadCostAssignmentSession() {
    if (!this.menuItemsCostAccounts || this.menuItemsCostAccounts.length === 0) {
      return;
    }
    this.cardCostAssignmentsProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'costAssignment',
      collapseble: true,
      initialStateCollapse: false
    };
    if (this.step && this.step.consumes) {
      const actualDate = moment();
      const stepDate = moment(this.step.periodFromStart, 'yyy-MM-DD');
      const showReplicateButton = stepDate.isSameOrBefore(actualDate) ? true : false;
      this.costAssignmentsCardItems =  this.step.consumes.map(consume => {
        const costAccount = this.costAccounts.find(cost => cost.id === consume.idCostAccount);
        const propertyModelName = costAccount && costAccount?.models.find(p => p.name === 'name');
        const propertyName = costAccount && propertyModelName ?
          costAccount?.properties.find(p => p.idPropertyModel === propertyModelName.id).value : consume.nameCostAccount;
        return {
          type: 'cost-card',
          unitMeasureName: '$',
          idCost: consume.idCostAccount,
          idCostAssignment: consume.id,
          showReplicateButton,
          costAccountName: propertyName as string,
          plannedWork: consume.plannedCost,
          actualWork: consume.actualCost,
          menuItemsCost: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteCost(consume.idCostAccount)
          }],
          readonly: !this.editPermission,
          costAccountAllocation: costAccount?.costAccountAllocation && {
            limit: costAccount?.costAccountAllocation.limit,
            planed: costAccount?.costAccountAllocation.planed - consume.plannedCost,
            actual: costAccount?.costAccountAllocation.actual - consume.actualCost,
          }
        };
      });
      this.reloadCostAssignmentTotals();
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
    if (!this.menuItemsCostAccounts || this.menuItemsCostAccounts.length === 0) {
      this.cardCostAssignmentsProperties = undefined;
    }
  }

  async loadMenuItemsCostAccounts() {
    const costAccountsIds = this.step?.consumes ? this.step.consumes.map(consume => consume.idCostAccount) : [];
    if (!this.costAccounts) {
      const result = await this.costAccountSrv.GetAll({ 'id-workpack': this.schedule.idWorkpack });
      if (result.success) {
        this.costAccounts = result.data;
      }
    }
    const workpacksIds = this.costAccounts.map(cost => cost.idWorkpack);
    const workpacksIdsNotRepeated = workpacksIds.filter((w, i) => workpacksIds.indexOf(w) === i);

    this.menuItemsCostAccounts = workpacksIdsNotRepeated.map(idWorkpack => {
      const workpackCostAccounts = this.costAccounts.filter(cost => cost.idWorkpack === idWorkpack);
      return {
        label: workpackCostAccounts[0].workpackModelName,
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
    });
  }

  createNewCardItemCost(idCost: number, costName: string) {
    this.cancelButton.showButton();
    const costAccountSelected = this.costAccounts.find(cost => cost.id === idCost);
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
        costAccountAllocation: costAccountSelected.costAccountAllocation
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
        costAccountAllocation: costAccountSelected.costAccountAllocation
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
    this.saveButton.showButton();
    this.cancelButton.showButton();
  }

  handleChangeValuesCardItems() {
    this.reloadCostAssignmentTotals();
    if (this.formStep.valid) {
      if (this.costAssignmentsCardItems && this.costAssignmentsCardItems.length > 1) {
        this.reloadCostAssignmentTotals();
      }
      this.saveButton.showButton();
    } else {
      this.saveButton.hideButton();
    }

  }

  handleChangeTotalsValues() {
    this.cancelButton.showButton();
    if (this.formStep.valid) {
      if (this.costAssignmentsCardItems && this.costAssignmentsCardItems.length > 1) {
        this.reloadCostAssignmentTotals();
      }
      this.saveButton.showButton();
    } else {
      this.saveButton.hideButton();
    }
  }

  reloadCostAssignmentTotals() {
    if (this.costAssignmentsCardItems) {
      const plannedTotal = this.costAssignmentsCardItems.filter(card => card.type === 'cost-card')
        .reduce((total, cost) => total + cost.plannedWork, 0);
      const actualTotal = this.costAssignmentsCardItems.filter(card => card.type === 'cost-card')
        .reduce((total, cost) => total + cost.actualWork, 0);
      this.costAssignmentsTotals = {
        actualTotal,
        plannedTotal
      };
    }
  }


  async saveStep() {
    this.cancelButton.hideButton();
    const end = moment(this.formStep.controls.end.value).format('yyyy-MM-DD');
    const start = moment(this.formStep.controls.start.value).format('yyyy-MM-DD');
    const hasNegativeValues = this.formStep.controls.plannedWork.value < 0 || this.formStep.controls.actualWork.value < 0 ||
      (this.costAssignmentsCardItems && this.costAssignmentsCardItems.filter(item => item.type === 'cost-card' &&
        (item.plannedWork < 0 || item.actualWork < 0)).length > 0);
    if (hasNegativeValues) {
      this.messageSrv.add({
        detail: this.translateSrv.instant('messages.scheduleCantHasNegativeValues'),
        severity: 'warn',
        summary: this.translateSrv.instant('atention')
      });
      return;
    }
    this.step = {
      id: this.step && this.step.id,
      idSchedule: this.step ? this.step.idSchedule : this.idSchedule,
      distribution: this.formStep.controls.distribution.value,
      plannedWork: this.formStep.controls.plannedWork.value,
      actualWork: this.formStep.controls.actualWork.value,
      endStep: (this.stepType === 'end' || this.stepType === 'newEnd') ? true : false,
      scheduleEnd: (this.stepType === 'end' || this.stepType === 'newEnd') ? end :
        (this.onlyOneStep && this.step && this.step?.id ? end : null),
      scheduleStart: (this.stepType === 'start' || this.stepType === 'newStart') ? start :
        (this.onlyOneStep && this.step && this.step?.id ? start : null),
      consumes: this.costAssignmentsCardItems && this.costAssignmentsCardItems.filter(card => card.type === 'cost-card').map(cost => ({
        id: cost.idCostAssignment && cost.idCostAssignment,
        idCostAccount: cost.idCost,
        plannedCost: cost.plannedWork,
        actualCost: cost.actualWork
      }))
    };
    if (this.step.id) {
      this.formIsSaving = true;
      const result = await this.scheduleSrv.putScheduleStep(this.step);
      this.formIsSaving = false;
      if (result.success) {
        this.router.navigate(['/workpack'],
          {
            queryParams: {
              id: this.schedule.idWorkpack,
              idPlan: this.idPlan,
              idWorkpackModelLinked: this.idWorkpackModelLinked
            }
          }
        );
      }
    }
    if (!this.step.id) {
      this.formIsSaving = true;
      const result = await this.scheduleSrv.postScheduleStep(this.step);
      this.formIsSaving = false;
      if (result.success) {
        this.router.navigate(['/workpack'],
          {
            queryParams: {
              id: this.schedule.idWorkpack,
              idPlan: this.idPlan,
              idWorkpackModelLinked: this.idWorkpackModelLinked
            }
          }
        );
      }
    }
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    this.setStepFormValues();
    if (!this.idStep) {
      this.costAssignmentsCardItems = [{
        type: 'new-cost-card',
        menuItemsNewCost: this.menuItemsCostAccounts
      }];
      this.reloadCostAssignmentTotals();
    } else {
      this.loadMenuItemsCostAccounts();
      this.loadCostAssignmentSession();
    }


  }
}
