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
  workpack: IWorkpack;
  unitMeasure: IMeasureUnit;
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
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idWorkpack = queryParams.idWorkpack;
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
    this.formSchedule = this.formBuilder.group({
      start: [new Date(), Validators.required],
      end: [new Date(), Validators.required],
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
    await this.loadPropertiesSchedule();
  }

  setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: this.workpack.type,
        info: this.getValueFromWorkpackProperty('name'),
        tooltip: this.getValueFromWorkpackProperty('fullName'),
        routerLink: [ '/workpack' ],
        queryParams: { id: this.idWorkpack }
      },
      {
        key: 'schedule',
        routerLink: ['/workpack/schedule'],
        queryParams: { id: this.idWorkpack },
        info: ''
      }
    ]);
  }

  async loadPropertiesSchedule() {
    this.cardScheduleProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false
    };
    const workpack = await this.workpackSrv.GetById(this.idWorkpack);
    if (workpack.success) {
      this.workpack = workpack.data;
      this.setBreadcrumb();
      const propertyUnit = workpack.data.properties.find(p => p.type === TypePropertyModelEnum.UnitSelectionModel);
      if (propertyUnit) {
        const idUnit = propertyUnit.selectedValue;
        const result = await this.unitMeasureSrv.GetById(idUnit);
        if (result.success) {
          this.unitMeasure = result.data;
        }
      }
    }
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

      this.menuItemsCostAccounts = await Promise.all(workpacksIdsNotRepeated.map(async(idWorkpack) => {
        const workpack = await this.workpackSrv.GetById(idWorkpack);
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
    const costAccountsIds = costAssignmentsCardItemsList.map( cardItem => (cardItem.idCost));
    this.menuItemsCostAccounts = Array.from(this.menuItemsCostAccounts.map(group => {
      const items = group.items.map(item => ({
        ...item,
        disabled: costAccountsIds.includes( Number(item.id)) || Number(item.id) === idCost
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
    const menuItems = this.menuItemsCostAccounts.map( group => {
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
    if (this.formSchedule.valid) {
      if (this.costAssignmentsCardItems && this.costAssignmentsCardItems.length > 0) {
        this.saveButton?.showButton();
      }
    }
  }

  reloadCostAssignmentTotals() {
    const items = this.costAssignmentsCardItems.filter(card => card.type === 'cost-card');
    const plannedTotal = items.reduce((total, cost) => total + cost.plannedWork, 0);
    const actualTotal = items.reduce((total, cost) => total + cost.actualWork, 0);
    this.costAssignmentsTotals = { actualTotal, plannedTotal };
  }

  async saveSchedule() {
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
            id: this.idWorkpack
          }
        }
      );
    }
  }

  getValueFromWorkpackProperty(nameProperty: string, session: string = 'PROPERTIES') {
    const propertyWorkpackModel = this.workpack.model.properties.find(p => p.name === nameProperty && p.session === session);
    const propertyWorkpack = this.workpack.properties.find(p => p.idPropertyModel === propertyWorkpackModel.id);
    return propertyWorkpack.value as string;
  }
}
