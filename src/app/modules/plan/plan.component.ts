import { MilestoneStatusEnum } from './../../shared/enums/MilestoneStatusEnum';
import { IWorkpackCardItem } from './../../shared/interfaces/IWorkpackCardItem';
import { FilterDataviewService } from 'src/app/shared/services/filter-dataview.service';
import { Component, OnDestroy, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Calendar } from 'primeng/calendar';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { PlanService } from 'src/app/shared/services/plan.service';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackModelService } from 'src/app/shared/services/workpack-model.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IWorkpack } from 'src/app/shared/interfaces/IWorkpack';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import { OfficeService } from 'src/app/shared/services/office.service';
import { PlanPermissionService } from 'src/app/shared/services/plan-permissions.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { MenuService } from 'src/app/shared/services/menu.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import * as moment from 'moment';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { PersonService } from 'src/app/shared/services/person.service';


interface IWorkpackModelCard {
  idWorkpackModel: number;
  propertiesCard: ICard;
  workpackItemCardList?: IWorkpackCardItem[];
}

@Component({
  selector: 'app-plan',
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.scss']
})
export class PlanComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChildren(Calendar) calendarComponents: Calendar[];

  responsive: boolean;
  idPlanModel: number;
  idOffice: number;
  propertiesOffice: IOffice;
  idPlan: number;
  cardPlanProperties: ICard;
  cardsPlanWorkPackModels: IWorkpackModelCard[];
  formPlan: FormGroup;
  planData: IPlan;
  $destroy = new Subject();
  editPermission = false;
  calendarFormat: string;
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number[] = [];
  idFilterSelected: number;
  isUserAdmin: boolean;
  yearRange: string;
  showDialogEndManagement = false;
  showDialogResumeManagement = false;
  endManagementWorkpack: {
    idWorkpackModel?: number;
    idWorkpack: number;
    reason: string;
    endManagementDate: Date;
  };
  language: string;
  formIsSaving = false;

  constructor(
    private actRouter: ActivatedRoute,
    private planSrv: PlanService,
    private workpackModelSrv: WorkpackModelService,
    private workpackSrv: WorkpackService,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officeSrv: OfficeService,
    private officePermissionSrv: OfficePermissionService,
    private planPermissionSrv: PlanPermissionService,
    private messageSrv: MessageService,
    private menuSrv: MenuService,
    private filterSrv: FilterDataviewService,
    private router: Router,
    private confirmationSrv: ConfirmationService,
    private configDataViewSrv: ConfigDataViewService,
    private personSrv: PersonService
  ) {
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.cardPlanProperties = Object.assign({}, {
        ...this.cardPlanProperties,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.cardsPlanWorkPackModels = this.cardsPlanWorkPackModels && this.cardsPlanWorkPackModels.map(card => (
        Object.assign({
          ...card,
          propertiesCard: {
            ...card.propertiesCard,
            initialStateCollapse: this.collapsePanelsStatus
          }
        })
      ));
    });
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.language = this.translateSrv.currentLang, 200);
    })
    this.actRouter.queryParams
      .subscribe(({ id, idOffice, idPlanModel }) => {
        this.idOffice = +idOffice;
        this.idPlanModel = +idPlanModel;
        this.idPlan = +id;
        this.resetPlan();
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
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    this.formPlan = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      fullName: ['', Validators.required],
      start: [null, Validators.required],
      finish: [null, Validators.required],
    });
    this.formPlan.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formPlan.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formPlan.dirty && this.formPlan.valid))
      .subscribe(() => {
        this.saveButton.showButton()
      });

    localStorage.removeItem('open-pmo:WORKPACK_TABVIEW');
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    const today = moment();
    const yearStart = today.year();
    this.yearRange = (yearStart - 10).toString() + ':' + (yearStart + 10).toString();
    this.calendarFormat = this.translateSrv.instant('dateFormat');
  }

  mirrorFullName(): boolean {
    return (isNaN(this.idPlan) && this.formPlan.controls.fullName.pristine);
  }

  setWorkPlanUser() {
    this.personSrv.setPersonWorkLocal({
      idOffice: this.planData?.idOffice || this.idOffice,
      idPlan: this.idPlan ? this.idPlan : null,
      idWorkpack: null,
      idWorkpackModelLinked: null
    });
  }

  setBreacrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'office',
        routerLink: ['/offices', 'office'],
        queryParams: { id: this.propertiesOffice.id },
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName
      },
    ]);
  }

  async resetPlan() {
    if (!this.idPlan) {
      this.planSrv.nextNewPlan(true);
    }
    this.cardPlanProperties = undefined;
    this.cardsPlanWorkPackModels = undefined;
    this.planData = undefined;
    this.editPermission = false;
    await this.loadPropertiesPlan();
  }

  async loadPropertiesPlan() {
    this.cardPlanProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      isLoading: this.idPlan ? true : false,
      initialStateCollapse: !!this.idPlan
    };
    if (!this.isUserAdmin) {
      await this.loadPermissions();
    } else {
      this.editPermission = true;
    }
    if (this.idPlan) {
      this.planData = await this.planSrv.getCurrentPlan(this.idPlan);
      if (this.planData) {
        this.officeSrv.nextIDOffice(this.planData.idOffice);
        this.idPlanModel = this.planData.planModel.id;
        this.planSrv.nextIDPlan(this.idPlan);
        this.loadWorkPackModels();
        this.formPlan.reset({
          name: this.planData.name,
          fullName: this.planData.fullName,
          start: new Date(this.planData.start + 'T00:00:00'),
          finish: new Date(this.planData.finish + 'T00:00:00') 
        });
        this.cardPlanProperties.isLoading = false;
      } else {
        const officeItem = localStorage.getItem('@pmo/propertiesCurrentOffice');
        const idOffice = officeItem && (JSON.parse(officeItem)).id;
        this.router.navigate(['offices/office'], {
          queryParams: {
            id: idOffice
          }
        });
        return;
      }
    } else {
      if (!this.editPermission) {
        this.router.navigate(['/offices']);
        return;
      }
    }
    this.setWorkPlanUser();
    await this.loadPropertiesOffice();
  }

  async loadPropertiesOffice() {
    this.propertiesOffice = await this.officeSrv.getCurrentOffice(this.planData?.idOffice || this.idOffice);
    this.setBreacrumb();
  }

  async loadPermissions() {
    const officePermission = await this.officePermissionSrv.getPermissions(this.planData?.idOffice || this.idOffice);
    this.editPermission = officePermission || await this.planPermissionSrv.getPermissions(this.idPlan);
    if (this.editPermission) {
      this.formPlan.enable();
    } else {
      this.formPlan.disable();
    }
  }

  async savePlan() {
    this.formIsSaving = true;
    this.planData = {
      id: this.idPlan,
      idOffice: this.idOffice,
      idPlanModel: this.idPlanModel,
      name: this.formPlan.controls.name.value,
      fullName: this.formPlan.controls.fullName.value,
      start: this.formPlan.controls.start.value,
      finish: this.formPlan.controls.finish.value,
    };
    const isPut = !!this.idPlan;
    const { success, data } = isPut
      ? await this.planSrv.put({
        id: this.planData.id,
        name: this.planData.name,
        fullName: this.planData.fullName,
        start: this.planData.start,
        finish: this.planData.finish
      })
      : await this.planSrv.post({
        idOffice: this.planData.idOffice,
        idPlanModel: this.idPlanModel,
        name: this.planData.name,
        fullName: this.planData.fullName,
        start: this.planData.start,
        finish: this.planData.finish
      });
    if (success) {
      if (!isPut) {
        this.idPlan = data.id;
        this.personSrv.setPersonWorkLocal({
          idOffice: this.idOffice,
          idPlan: this.idPlan,
          idWorkpack: null,
          idWorkpackModelLinked: null
        });
        if (!this.isUserAdmin) {
          await this.createPlanPermission(data.id);
        }
        this.planData.id = data.id;
        this.planSrv.nextIDPlan(this.idPlan);
        localStorage.setItem('@pmo/propertiesCurrentPlan', JSON.stringify(this.planData));
        localStorage.setItem('@currentPlan', this.planData.id.toString());
        await this.loadWorkPackModels();
      }
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.formIsSaving = false;
      this.setBreacrumb();
      this.menuSrv.reloadMenuOffice();
      return;
    };
  }

  async createPlanPermission(idPlan: number) {
    const payload = this.authSrv.getTokenPayload();
    if (payload) {
      const result = await this.planPermissionSrv.post({
        person: {
          name: payload.email.split('@')[0],
          fullName: payload.email.split('@')[0],
          email: payload.email
        },
        idPlan,
        permissions: [{
          level: 'EDIT',
          role: 'User'
        }]
      });
      if (result.success) {
        return;
      }
    }
  }

  async loadWorkPackModels() {
    const result = await this.workpackModelSrv.GetAll({ 'id-plan-model': this.idPlanModel });
    const workpackModels = result.success && result.data;
    if (workpackModels) {
      this.cardsPlanWorkPackModels = workpackModels.map((workpackModel) => {
        const propertiesCard: ICard = {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: workpackModel.modelNameInPlural,
          collapseble: true,
          isLoading: true,
          initialStateCollapse: this.collapsePanelsStatus,
          showFilters: true
        };
        return {
          idWorkpackModel: workpackModel.id,
          propertiesCard
        }
      });
      workpackModels.forEach(async (workpackModel, index) => {
        const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${workpackModel.id}/workpacks`);
        if (resultFilters.success && Array.isArray(resultFilters.data)) {
          this.cardsPlanWorkPackModels[index].propertiesCard.filters = resultFilters.data;
        } else {
          this.cardsPlanWorkPackModels[index].propertiesCard.filters = [];
        }
        const idFilterSelected = this.cardsPlanWorkPackModels[index].propertiesCard.filters &&
          this.cardsPlanWorkPackModels[index].propertiesCard.filters.find(defaultFilter => !!defaultFilter.favorite) ?
          this.cardsPlanWorkPackModels[index].propertiesCard.filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
        const cardListResult = await this.loadWorkpacksFromWorkpackModel(this.planData.id, workpackModel.id, index, idFilterSelected);
        this.cardsPlanWorkPackModels[index].propertiesCard.createNewElementMenuItemsWorkpack = cardListResult && cardListResult.iconMenuItems;
        this.cardsPlanWorkPackModels[index] = {
          ...this.cardsPlanWorkPackModels[index],
          workpackItemCardList: cardListResult && cardListResult.workpackItemCardList,
          propertiesCard: {
            ...this.cardsPlanWorkPackModels[index].propertiesCard,
            isLoading: false
          }
        };
      });
      this.cardsPlanWorkPackModels.forEach((workpackModel, i) => {
        this.totalRecords[i] = workpackModel.workpackItemCardList && workpackModel.workpackItemCardList.length;
        if (workpackModel.workpackItemCardList && workpackModel.workpackItemCardList.find(card => card.typeCardItem === 'newCardItem')) {
          workpackModel.propertiesCard.showCreateNemElementButton = true;
        }
      });
    }
  }

  async loadWorkpacksFromWorkpackModel(idPlan: number, workpackModelId: number, index: number, idFilterSelected: number, term?: string) {
    const result = await this.workpackSrv.GetAll({
      'id-plan': idPlan,
      'id-plan-model': this.idPlanModel,
      'id-workpack-model': workpackModelId,
      idFilter: idFilterSelected,
      term,
      noLoading: true
    });
    const workpacks = result.success && result.data;
    if (workpacks && workpacks.length > 0) {
      const workpackItemCardList: IWorkpackCardItem[] = workpacks.map(workpack => {
        const propertyNameWorkpack = workpack.name;
        const propertyFullnameWorkpack = workpack.fullName;
        const menuItems: MenuItem[] = [];
        if (workpack.canceled && workpack.type !== 'Project' && !workpack.linked) {
          menuItems.push({
            label: this.translateSrv.instant('restore'),
            icon: 'fas fa-redo-alt',
            command: (event) => this.handleRestoreWorkpack(workpack.id, index),
            disabled: !this.editPermission
          });
        } else {
          if (workpack.type !== 'Project' && !!workpack.canDeleted && !workpack.canceled && !workpack.linked) {
            menuItems.push({
              label: this.translateSrv.instant('delete'),
              icon: 'fas fa-trash-alt',
              command: (event) => this.deleteWorkpack(workpack, index),
              disabled: !this.editPermission
            });
          }
          if (!workpack.canceled && workpack.type === 'Deliverable' && (!workpack.endManagementDate || workpack.endManagementDate === null) && !workpack.linked) {
            menuItems.push({
              label: this.translateSrv.instant('endManagement'),
              icon: 'far fa-stop-circle',
              command: (event) => this.endManagementOfDeliverable(workpack, workpackModelId),
              disabled: !this.editPermission
            });
          }
          if (!workpack.canceled && workpack.type === 'Deliverable' && (!!workpack.endManagementDate && workpack.endManagementDate !== null) && !workpack.linked) {
            menuItems.push({
              label: this.translateSrv.instant('resumeManagement'),
              icon: 'far fa-play-circle',
              command: (event) => this.resumeManagementOfDeliverable(workpack, workpackModelId),
              disabled: !this.editPermission
            });
          }
          if (workpack.cancelable && this.editPermission && !workpack.linked) {
            menuItems.push({
              label: this.translateSrv.instant('cancel'),
              icon: 'fas fa-times',
              command: (event) => this.handleCancelWorkpack(workpack.id, index),
            });
          }
          if (workpack.type === 'Project' && this.editPermission && !workpack.linked) {
            menuItems.push({
              label: this.translateSrv.instant('changeControlBoard'),
              icon: 'app-icon ccb-member',
              command: (event) => this.navigateToConfigCCB(workpack.id),
            });
            if (!workpack.pendingBaseline && !workpack.cancelPropose && !!workpack.hasActiveBaseline && !workpack.linked) {
              menuItems.push({
                label: this.translateSrv.instant('cancel'),
                icon: 'fas fa-times',
                command: (event) => this.navigateToCancelProject(workpack.id, propertyNameWorkpack as string),
              });
            }
            if (!workpack.pendingBaseline && !workpack.cancelPropose && !workpack.hasActiveBaseline && !workpack.linked) {
              menuItems.push({
                label: this.translateSrv.instant('delete'),
                icon: 'fas fa-trash-alt',
                command: (event) => this.deleteWorkpack(workpack, index),
                disabled: !this.editPermission
              });
            }
          }
          if (this.editPermission && !workpack.canceled && !workpack.linked) {
            menuItems.push({
              label: this.translateSrv.instant('cut'),
              icon: 'fas fa-cut',
              command: (event) => this.handleCutWorkpack(workpack),
            });
          }
          if (!workpack.canceled && !workpack.linked && this.editPermission && !workpack.linked) {
            menuItems.push({
              label: this.translateSrv.instant('sharing'),
              icon: 'app-icon share',
              command: (event) => this.handleSharing(workpack.id),
            });
          }
          if (!!workpack.linked) {
            menuItems.push({
              label: this.translateSrv.instant('unlink'),
              icon: 'app-icon unlink',
              command: (event) => this.unlinkedWorkpack(workpack.id, workpack.linkedModel, index),
            });
          }
        }
        return {
          typeCardItem: workpack.type,
          icon: workpack.fontIcon,
          iconSvg: false,
          nameCardItem: propertyNameWorkpack,
          fullNameCardItem: propertyFullnameWorkpack,
          itemId: workpack.id,
          menuItems,
          urlCard: '/workpack',
          paramsUrlCard: workpack.linked ? [{ name: 'idPlan', value: this.idPlan }, { name: 'idWorkpackModelLinked', value: workpack.linkedModel }] :
            [{ name: 'idPlan', value: this.idPlan }],
          linked: !!workpack.linked ? true : false,
          shared: workpack.sharedWith,
          canceled: workpack.canceled,
          completed: workpack.completed,
          endManagementDate: workpack.endManagementDate,
          dashboardData: this.loadDashboardData(workpack.dashboard, workpack.milestones, workpack.risks),
          hasBaseline: workpack.hasActiveBaseline,
          baselineName: workpack.activeBaselineName,
          subtitleCardItem: workpack.type === 'Milestone' ? workpack.milestoneDate : '',
          statusItem: workpack.type === 'Milestone' ? MilestoneStatusEnum[workpack.milestoneStatus] : ''
        };
      });
      let iconMenuItems: MenuItem[];
      if (this.editPermission) {
        const sharedWorkpackList = await this.loadSharedWorkpackList(workpackModelId);
        iconMenuItems = [
          { label: this.translateSrv.instant('new'), command: () => this.handleNewWorkpack(idPlan, workpackModelId) }
        ];
        if (sharedWorkpackList && sharedWorkpackList.length > 0) {
          iconMenuItems.push({
            label: this.translateSrv.instant('linkTo'),
            items: sharedWorkpackList.map(wp => ({
              label: wp.name,
              icon: `app-icon ${wp.icon}`,
              command: () => this.handleLinkToWorkpack(wp.id, workpackModelId, index)
            }))
          });
        }
        const workpackCuted = this.workpackSrv.getWorkpackCuted();
        if (workpackCuted) {
          const { canPaste, incompatiblesProperties } = await this.checkPasteWorkpack(workpackCuted, workpackModelId);
          const validPasteOutherOffice = workpackCuted.plan.idOffice === this.idOffice ? true : this.isUserAdmin;
          if (canPaste && validPasteOutherOffice) {
            iconMenuItems.push({
              label: `${this.translateSrv.instant('paste')} ${workpackCuted.name}`,
              icon: 'fas fa-paste',
              command: (event) => this.handlePasteWorkpack(idPlan, workpackModelId, incompatiblesProperties)
            });
          }
        }
        workpackItemCardList.push(
          {
            typeCardItem: 'newCardItem',
            icon: IconsEnum.Plus,
            iconSvg: true,
            iconMenuItems
          }
        );
      }
      return { workpackItemCardList, iconMenuItems };
    }
    if ((!workpacks || workpacks.length === 0) && this.editPermission) {
      const iconMenuItems: MenuItem[] = [
        { label: this.translateSrv.instant('new'), command: () => this.handleNewWorkpack(idPlan, workpackModelId) }
      ];
      if (this.editPermission) {
        const sharedWorkpackList = await this.loadSharedWorkpackList(workpackModelId);
        if (sharedWorkpackList && sharedWorkpackList.length > 0) {
          iconMenuItems.push({
            label: this.translateSrv.instant('linkTo'),
            items: sharedWorkpackList.map(wp => ({
              label: wp.name,
              icon: `app-icon ${wp.icon}`,
              command: () => this.handleLinkToWorkpack(wp.id, workpackModelId, index)
            }))
          });
        }
        const workpackCuted = this.workpackSrv.getWorkpackCuted();
        if (workpackCuted) {
          const { canPaste, incompatiblesProperties } = await this.checkPasteWorkpack(workpackCuted, workpackModelId);
          const validPasteOutherOffice = workpackCuted.plan.idOffice === this.idOffice ? true : this.isUserAdmin;
          if (canPaste && validPasteOutherOffice) {
            iconMenuItems.push({
              label: `${this.translateSrv.instant('paste')} ${workpackCuted.name}`,
              icon: 'fas fa-paste',
              command: (event) => this.handlePasteWorkpack(idPlan, workpackModelId, incompatiblesProperties)
            });
          }
        }
      }
      const workpackItemCardList = [
        {
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconSvg: true,
          iconMenuItems
        }
      ];
      return { workpackItemCardList, iconMenuItems };
    }
  }

  loadDashboardData(dashboard?, milestones?, risks?) {
    const dashboardData =  {
      tripleConstraint: dashboard && dashboard.tripleConstraint && {
        idBaseline: dashboard.tripleConstraint.idBaseline,
        cost: {
          actualValue: dashboard.tripleConstraint.costActualValue,
          foreseenValue: dashboard.tripleConstraint.costForeseenValue,
          plannedValue: dashboard.tripleConstraint.costPlannedValue,
          variation: dashboard.tripleConstraint.costVariation,
        },
        schedule: {
          actualEndDate: dashboard.tripleConstraint.scheduleActualEndDate,
          actualStartDate: dashboard.tripleConstraint.scheduleActualStartDate,
          actualValue: dashboard.tripleConstraint.scheduleActualValue,
          foreseenEndDate: dashboard.tripleConstraint.scheduleForeseenEndDate,
          foreseenStartDate: dashboard.tripleConstraint.scheduleForeseenStartDate,
          foreseenValue: dashboard.tripleConstraint.scheduleForeseenValue,
          plannedEndDate: dashboard.tripleConstraint.schedulePlannedEndDate,
          plannedStartDate: dashboard.tripleConstraint.schedulePlannedStartDate,
          plannedValue: dashboard.tripleConstraint.schedulePlannedValue,
          variation: dashboard.tripleConstraint.scheduleVariation
        },
        scope: {
          actualVariationPercent: dashboard.tripleConstraint.scopeActualVariationPercent,
          foreseenVariationPercent: dashboard.tripleConstraint.scopeForeseenVariationPercent,
          plannedVariationPercent: dashboard.tripleConstraint.scopePlannedVariationPercent,
          foreseenValue: dashboard.tripleConstraint.scopeForeseenValue,
          actualValue: dashboard.tripleConstraint.scopeActualValue,
          plannedValue: dashboard.tripleConstraint.scopePlannedValue,
          variation: dashboard.tripleConstraint.scopeVariation
        }
      },
      earnedValue: dashboard && dashboard.performanceIndex && dashboard.performanceIndex.earnedValue,
      costPerformanceIndex: dashboard && dashboard.performanceIndex ? {
        costVariation: dashboard.performanceIndex.costPerformanceIndexVariation,
        indexValue: dashboard.performanceIndex.costPerformanceIndexValue
      } : null,
      schedulePerformanceIndex: dashboard && dashboard.performanceIndex ? {
        indexValue: dashboard.performanceIndex.schedulePerformanceIndexValue,
        scheduleVariation: dashboard.performanceIndex.schedulePerformanceIndexVariation
      } : null,
      risk: risks && {high: 0, low: 0, medium: 0, closed: 0, total: 0},
      milestone: milestones && {concluded: 0, late: 0, lateConcluded: 0, onTime: 0, quantity: 0}
    };
    const totalRisk = risks && risks.reduce( ( totalRisk: {high: number; low: number; medium: number; closed: number; total: number}, risk) => {
      switch (risk.importance) {
        case 'HIGH':
          totalRisk.high++;
          break;
        case 'LOW':
          totalRisk.low++;
          break;
        case 'MEDIUM':
          totalRisk.medium++;
          break;
      }
      if (risk.status !== 'OPEN') totalRisk.closed++;
      totalRisk.total++
      return totalRisk;
    }, {high: 0, low: 0, medium: 0, closed: 0, total: 0});

    const totalMilestones = milestones && milestones.reduce( ( totalMilestones: {
        concluded: number;
        late: number;
        lateConcluded: number;
        onTime: number;
        quantity: number
      }, milestone) => {
      
      if (milestone.completed) {
        if (!milestone.snapshotDate) {
          totalMilestones.concluded++;
          totalMilestones.quantity++;
          return totalMilestones;
        } else {
          const milestoneDate = moment(milestone.milestoneDate, 'yyyy-MM-DD');
          const snapshotDate = moment(milestone.snapshotDate, 'yyyy-MM-DD');
          if (milestoneDate.isSameOrBefore(snapshotDate)) {
            totalMilestones.concluded++;
            totalMilestones.quantity++;
            return totalMilestones;
          } else {
            totalMilestones.lateConcluded++;
            totalMilestones.quantity++;
            return totalMilestones;
          }
        }
      } else {
        const today = moment();
        const milestoneDate = moment(milestone.milestoneDate, 'yyyy-MM-DD');
        if (milestoneDate.isBefore(today)) {
          totalMilestones.late++;
          totalMilestones.quantity++;
          return totalMilestones;
        } else {
          totalMilestones.onTime++;
          totalMilestones.quantity++;
          return totalMilestones;
        }
      }
    }, {concluded: 0, late: 0, lateConcluded: 0, onTime: 0, quantity: 0});
    dashboardData.risk = totalRisk;
    dashboardData.milestone = totalMilestones;
    return dashboardData;
  }
  
  async handleRestoreWorkpack(idWorkpack: number, modelCardIndex: number) {
    this.cardsPlanWorkPackModels[modelCardIndex].propertiesCard.isLoading = true;
    await this.workpackSrv.restoreWorkpack(idWorkpack);
    this.cardsPlanWorkPackModels[modelCardIndex].propertiesCard.isLoading = false;
  }

  handleCreateNewWorkpack(idWorkpackModel: number) {
    this.router.navigate(['/workpack'], {
      queryParams: {
        idPlan: this.idPlan,
        idWorkpackModel
      }
    });
  }

  navigateToConfigCCB(idProject: number) {
    this.router.navigate(
      ['/workpack/change-control-board'],
      {
        queryParams: {
          idProject,
          idOffice: this.idOffice
        }
      });
  }

  async unlinkedWorkpack(idWorkpackLinked, idWorkpackModel, modelCardIndex: number) {
    this.cardsPlanWorkPackModels[modelCardIndex].propertiesCard.isLoading = true;
    const result = await this.workpackSrv.unlinkWorkpack(idWorkpackLinked, idWorkpackModel,
      { 'id-plan': this.idPlan });
    if (result.success) {
      const workpackModelIndex = this.cardsPlanWorkPackModels
        .findIndex(workpackModel => workpackModel.idWorkpackModel === idWorkpackModel);
      if (workpackModelIndex > -1) {
        const workpackIndex = this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList
          .findIndex(w => w.itemId === idWorkpackLinked);
        if (workpackIndex > -1) {
          this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList.splice(workpackIndex, 1);
          this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList =
            Array.from(this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList);
          this.totalRecords[workpackModelIndex] = this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList.length;
        }
      }
      this.cardsPlanWorkPackModels[modelCardIndex].propertiesCard.isLoading = false;
      this.menuSrv.reloadMenuPortfolio();
    }
  }

  handleSharing(idWorkpack: number) {
    this.router.navigate(['/workpack/sharing'], {
      queryParams: {
        idWorkpack,
        idPlan: this.idPlan,
      }
    });
  }

  navigateToCancelProject(idProject: number, projectName: string) {
    this.router.navigate(
      ['/workpack/baseline-cancelling'],
      {
        queryParams: {
          idProject,
          projectName
        }
      });
  }

  async handleCancelWorkpack(idWorkpack: number, modelCardIndex: number) {
    this.cardsPlanWorkPackModels[modelCardIndex].propertiesCard.isLoading = true;
    this.formIsSaving = true;
    const result = await this.workpackSrv.cancelWorkpack(idWorkpack);
    this.formIsSaving = false;
    this.cardsPlanWorkPackModels[modelCardIndex].propertiesCard.isLoading = false;
  }

  handleNewWorkpack(idPlan, idWorkpackModel) {
    this.router.navigate(['workpack'], {
      queryParams: {
        idPlan,
        idWorkpackModel,
      }
    });
  }

  async handleCutWorkpack(workpack: IWorkpack) {
    this.workpackSrv.setWorkpackCuted({ ...workpack });
    const workpackModelIndex = this.cardsPlanWorkPackModels
      .findIndex(workpackModel => workpackModel.idWorkpackModel === workpack.idWorkpackModel);
    if (workpackModelIndex > -1) {
      const workpackIndex = this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList
        .findIndex(w => w.itemId === workpack.id);
      if (workpackIndex > -1) {
        this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList.splice(workpackIndex, 1);
        this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList =
          Array.from(this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList);
        this.totalRecords[workpackModelIndex] = this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList.length;
      }
    }
  }

  async handlePasteWorkpack(idPlanTo: number, idWorkpackModelTo: number, incompatiblesProperties: boolean, idParentTo?: number) {
    const workpackCuted = this.workpackSrv.getWorkpackCuted();
    if (workpackCuted) {
      if (incompatiblesProperties) {
        this.confirmationSrv.confirm({
          message: this.translateSrv.instant('messages.confirmPaste'),
          key: 'pasteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async () => {
            await this.pasteWorkpack(workpackCuted, idWorkpackModelTo, idPlanTo, idParentTo);
          },
          reject: () => {
            return;
          }
        });
      } else {
        await this.pasteWorkpack(workpackCuted, idWorkpackModelTo, idPlanTo, idParentTo);
      }
    }
  }

  async pasteWorkpack(workpackCuted: IWorkpack, idWorkpackModelTo: number, idPlanTo: number, idParentTo?: number) {
    this.formIsSaving = true;
    const result = await this.workpackSrv.pasteWorkpack(workpackCuted.id, idWorkpackModelTo, {
      idPlanFrom: workpackCuted.plan.id,
      idParentFrom: workpackCuted.idParent,
      idPlanTo,
      idParentTo,
      idWorkpackModelFrom: workpackCuted.idWorkpackModel
    });
    if (result.success) {
      this.menuSrv.reloadMenuPortfolio();
      await this.loadWorkPackModels();
      this.formIsSaving = false;
      this.workpackSrv.removeWorkpackCuted();
    }
  }

  async checkPasteWorkpack(workpackCuted: IWorkpack, idWorkpackModelTo: number) {
    const result = await this.workpackSrv.checkPasteWorkpack(workpackCuted.id, idWorkpackModelTo, {
      idWorkpackModelFrom: workpackCuted.idWorkpackModel,
    });
    if (result.success) {
      return result.data;
    } else {
      return {} as any;
    }
  }

  async loadSharedWorkpackList(idWorkpackModel: number) {
    const result = await this.workpackSrv.GetSharedWorkpacks({ 'id-workpack-model': idWorkpackModel });
    if (result.success) {
      return result.data;
    }
    return [];
  }

  async handleLinkToWorkpack(idWorkpack: number, idWorkpackModel: number, modelCardIndex: number) {
    this.cardsPlanWorkPackModels[modelCardIndex].propertiesCard.isLoading = true;
    this.formIsSaving = true;
    const result = await this.workpackSrv.linkWorkpack(idWorkpack, idWorkpackModel, { 'id-plan': this.idPlan });
    this.formIsSaving = false;
    if (result.success) {
      this.cardsPlanWorkPackModels[modelCardIndex].propertiesCard.isLoading = false;
      this.router.navigate(['/workpack'], {
        queryParams: {
          id: idWorkpack,
          idWorkpackModelLinked: idWorkpackModel
        }
      });
    }
  }

  async deleteWorkpack(workpack: IWorkpack, modelCardIndex: number) {
    const result = await this.workpackSrv.delete(workpack, { useConfirm: true });
    if (result.success) {
      const workpackModelIndex = this.cardsPlanWorkPackModels
        .findIndex(workpackModel => workpackModel.idWorkpackModel === workpack.idWorkpackModel);
      if (workpackModelIndex > -1) {
        const workpackIndex = this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList
          .findIndex(w => w.itemId === workpack.id);
        if (workpackIndex > -1) {
          this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList.splice(workpackIndex, 1);
          this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList =
            Array.from(this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList);
          this.totalRecords[workpackModelIndex] = this.cardsPlanWorkPackModels[workpackModelIndex].workpackItemCardList.length;
        }
      }
      this.menuSrv.reloadMenuPortfolio();
    }
  }

  endManagementOfDeliverable(workpack: IWorkpack, idWorkpackModel) {
    this.showDialogEndManagement = true;
    this.endManagementWorkpack = {
      idWorkpackModel,
      idWorkpack: workpack.id,
      reason: '',
      endManagementDate: null
    };
  }

  handleCancelEndManagement() {
    this.showDialogEndManagement = false;
    this.endManagementWorkpack = undefined;
  }

  resumeManagementOfDeliverable(workpack: IWorkpack, idWorkpackModel) {
    this.showDialogResumeManagement = true;
    this.endManagementWorkpack = {
      idWorkpackModel,
      idWorkpack: workpack.id,
      reason: workpack.reason,
      endManagementDate: moment(workpack.endManagementDate, 'DD-MM-yyyy').toDate()
    };
  }

  handleCancelResumeManagement() {
    this.showDialogResumeManagement = false;
    this.endManagementWorkpack = undefined;
  }


  async handleEditFilter(event, idWorkpackModel: number) {
    const idFilter = event.filter;
    if (idFilter) {
      this.setBreadcrumbStorage();
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName: `workpacks`,
          idWorkpackModel,
          idOffice: this.idOffice
        }
      });
    }
  }

  async handleSelectedFilter(event, idWorkpackModel: number) {
    const idFilter = event.filter;
    const workpackModelCardIndex = this.cardsPlanWorkPackModels.findIndex(card => card.idWorkpackModel === idWorkpackModel);
    this.cardsPlanWorkPackModels[workpackModelCardIndex].propertiesCard.idFilterSelected = idFilter;
    await this.reloadWorkpacksOfWorkpackModelSelectedFilter(idWorkpackModel);
  }

  async handleSearchText(event, idWorkpackModel: number) {
    const term = event.term;
    const workpackModelCardIndex = this.cardsPlanWorkPackModels.findIndex(card => card.idWorkpackModel === idWorkpackModel);
    this.cardsPlanWorkPackModels[workpackModelCardIndex].propertiesCard.searchTerm = term;
    await this.reloadWorkpacksOfWorkpackModelSelectedFilter(idWorkpackModel);
  }

  setBreadcrumbStorage() {
    this.breadcrumbSrv.setBreadcrumbStorage([
      {
        key: 'office',
        routerLink: ['/offices', 'office'],
        queryParams: { id: this.idOffice },
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName
      },
      {
        key: 'plan',
        routerLink: ['/plan'],
        queryParams: { id: this.idPlan },
        info: this.planData?.name,
        tooltip: this.planData?.fullName
      }
    ]);
  }

  async handleNewFilter(idWorkpackModel: number) {
    this.setBreadcrumbStorage();
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: `workpacks`,
        idWorkpackModel,
        idOffice: this.idOffice
      }
    });
  }

  async reloadWorkpacksOfWorkpackModelSelectedFilter(idWorkpackModel: number) {
    const workpackModelCardIndex = this.cardsPlanWorkPackModels.findIndex(card => card.idWorkpackModel === idWorkpackModel);
    if (workpackModelCardIndex > -1) {
      const idFilter = this.cardsPlanWorkPackModels[workpackModelCardIndex].propertiesCard.idFilterSelected;
      const term = this.cardsPlanWorkPackModels[workpackModelCardIndex].propertiesCard.searchTerm;
      this.cardsPlanWorkPackModels[workpackModelCardIndex].propertiesCard.isLoading = true;
      const result = await this.loadWorkpacksFromWorkpackModel(this.planData.id, idWorkpackModel, workpackModelCardIndex, idFilter, term);
      const workpacksByFilter = result ? result.workpackItemCardList : [];
      this.cardsPlanWorkPackModels[workpackModelCardIndex].workpackItemCardList = Array.from(workpacksByFilter);
      this.cardsPlanWorkPackModels[workpackModelCardIndex].propertiesCard.createNewElementMenuItemsWorkpack = result ? result.iconMenuItems : [];
      if (this.cardsPlanWorkPackModels[workpackModelCardIndex].workpackItemCardList.find(card => card.typeCardItem === 'newCardItem')) {
        this.cardsPlanWorkPackModels[workpackModelCardIndex].propertiesCard.showCreateNemElementButton = true;
      }
      this.totalRecords[workpackModelCardIndex] = workpacksByFilter && workpacksByFilter.length;
      this.cardsPlanWorkPackModels[workpackModelCardIndex].propertiesCard.isLoading = false;
    }
  }

  async handleResumeManagementDeliverable() {
    this.formIsSaving = true;
    const result = await this.workpackSrv.endManagementDeliverable({
      endManagementDate: null,
      reason: this.endManagementWorkpack.reason,
      idWorkpack: this.endManagementWorkpack.idWorkpack
    });
    this.formIsSaving = false;
    if (result.success) {
      this.handleCancelResumeManagement();
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('messages.endManagementSuccess'),
        detail: this.translateSrv.instant('messages.endManagementSuccess'),
        life: 3000
      });
      this.loadWorkPackModels();
    }
  }

  async handleEndManagementDeliverable() {
    if (this.endManagementWorkpack && this.endManagementWorkpack.reason.length > 0
      && this.endManagementWorkpack.endManagementDate !== null) {
      this.formIsSaving = true;
      const result = await this.workpackSrv.endManagementDeliverable({
        idWorkpack: this.endManagementWorkpack.idWorkpack,
        endManagementDate: moment(this.endManagementWorkpack.endManagementDate).format('yyyy-MM-DD'),
        reason: this.endManagementWorkpack.reason
      });
      this.formIsSaving = false;
      if (result.success) {
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('messages.endManagementSuccess'),
          detail: this.translateSrv.instant('messages.endManagementSuccess'),
          life: 3000
        });
        this.handleCancelEndManagement();
      }
    } else {
      this.messageSrv.add({
        severity: 'warn',
        summary: this.translateSrv.instant('messages.invalidForm'),
        detail: this.translateSrv.instant('messages.endManagementInputAlert'),
        life: 3000
      });
    }
  }

}
