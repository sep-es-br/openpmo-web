import { CitizenUserService } from './../../shared/services/citizen-user.service';
import { MilestoneStatusEnum } from './../../shared/enums/MilestoneStatusEnum';
import { IWorkpackCardItem } from './../../shared/interfaces/IWorkpackCardItem';
import { FilterDataviewService } from 'src/app/shared/services/filter-dataview.service';
import { Component, OnDestroy, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Calendar } from 'primeng/calendar';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
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
import { CookieService } from 'ngx-cookie';


interface IWorkpackModelCard {
  idWorkpackModel: number;
  propertiesCard: ICard;
  workpackItemCardList: IWorkpackCardItem[];
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
    private cookieSrv: CookieService,
    private citizenSrv: CitizenUserService
  ) {
    this.citizenSrv.loadCitizenUsers();
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
      .subscribe(() => this.saveButton.hideButton());
    this.formPlan.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formPlan.dirty && this.formPlan.valid))
      .subscribe(() => this.saveButton.showButton());
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    if (this.idPlan) {
      this.setCurrentPlanStorage();
      this.setWorkPlanUser();
    }
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    const today = moment();
    const yearStart = today.year();
    this.yearRange = (yearStart - 1).toString() + ':' + (yearStart + 15).toString();
    this.calendarFormat = this.translateSrv.instant('dateFormat');
  }

  setCurrentPlanStorage() {
    localStorage.setItem('@currentPlan', this.idPlan.toString());
  }

  setWorkPlanUser() {
    const user = this.authSrv.getTokenPayload();
    const cookiesPermission = this.cookieSrv.get('cookiesPermission' + user.email);
    if (cookiesPermission && user && user.email) {
      const date = moment().add(60, 'days').calendar();
      this.cookieSrv.put('planWorkUser' + user.email, this.idPlan.toString(), { expires: date });
    }
  }

  handleChangeCollapseExpandPanel(event) {
    this.collapsePanelsStatus = event.mode === 'collapse' ? true : false;
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
  }

  handleChangeDisplayMode(event) {
    this.displayModeAll = event.displayMode;
  }

  handleChangePageSize(event) {
    this.pageSize = event.pageSize;
  }

  setBreacrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'office',
        routerLink: ['/offices', 'office'],
        queryParams: { id: this.idOffice },
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName
      },
    ]);
  }

  async resetPlan() {
    this.planSrv.nextIDPlan(this.idPlan);
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
      initialStateCollapse: !!this.idPlan
    };
    if (this.idPlan) {
      const result = await this.planSrv.GetById(this.idPlan);
      this.planData = result.data;
      if (this.planData) {
        this.officeSrv.nextIDOffice(this.planData.idOffice);
        this.idPlanModel = this.planData.idPlanModel;
        this.formPlan.controls.name.setValue(this.planData.name);
        this.formPlan.controls.fullName.setValue(this.planData.fullName);
        this.formPlan.controls.start.setValue(new Date(this.planData.start + 'T00:00:00'));
        this.formPlan.controls.finish.setValue(new Date(this.planData.finish + 'T00:00:00'));
        await this.loadPropertiesOffice();
        await this.loadPermissions();
        this.loadWorkPackModels();
      }
    } else {
      await this.loadPropertiesOffice();
    }
  }

  async loadPropertiesOffice() {
    this.idOffice = this.planData?.idOffice || this.idOffice;
    const { success, data } = await this.officeSrv.GetById(this.idOffice);
    if (success) {
      this.propertiesOffice = data;
    }
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
    this.planData = {
      id: this.idPlan,
      idOffice: this.idOffice,
      idPlanModel: this.idPlanModel,
      name: this.formPlan.controls.name.value,
      fullName: this.formPlan.controls.fullName.value,
      start: this.formPlan.controls.start.value,
      finish: this.formPlan.controls.finish.value,
    };
    const isPut = !!this.planData.id;
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
        idPlanModel: this.planData.idPlanModel,
        name: this.planData.name,
        fullName: this.planData.fullName,
        start: this.planData.start,
        finish: this.planData.finish
      });
    if (success) {
      if (!isPut) {
        this.idPlan = data.id;
        this.setCurrentPlanStorage();
        this.setWorkPlanUser();
        if (!this.isUserAdmin) {
          await this.createPlanPermission(data.id);
        }
        await this.loadPropertiesPlan();
      }
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.setBreacrumb();
      this.menuSrv.reloadMenuOffice();
      this.saveButton.hideButton();
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
      this.cardsPlanWorkPackModels = await Promise.all(workpackModels.map(async (workpackModel) => {
        const propertiesCard: ICard = {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: workpackModel.modelNameInPlural,
          collapseble: true,
          initialStateCollapse: this.collapsePanelsStatus,
          showFilters: true
        };
        const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${workpackModel.id}/workpacks`);
        if (resultFilters.success && Array.isArray(resultFilters.data)) {
          propertiesCard.filters = resultFilters.data;
        } else {
          propertiesCard.filters = [];
        }
        const idFilterSelected = propertiesCard.filters && propertiesCard.filters.find(defaultFilter => !!defaultFilter.favorite) ?
          propertiesCard.filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
        const cardListResult = await this.loadWorkpacksFromWorkpackModel(this.planData.id, workpackModel.id, idFilterSelected);
        propertiesCard.createNewElementMenuItemsWorkpack = cardListResult && cardListResult.iconMenuItems;
        return {
          idWorkpackModel: workpackModel.id,
          propertiesCard,
          workpackItemCardList: cardListResult && cardListResult.workpackItemCardList,
        };
      }));
      this.cardsPlanWorkPackModels.forEach((workpackModel, i) => {
        this.totalRecords[i] = workpackModel.workpackItemCardList && workpackModel.workpackItemCardList.length;
        if (workpackModel.workpackItemCardList && workpackModel.workpackItemCardList.find(card => card.typeCardItem === 'newCardItem')) {
          workpackModel.propertiesCard.showCreateNemElementButton = true;
        }
      });
    }
  }

  async loadWorkpacksFromWorkpackModel(idPlan: number, workpackModelId: number, idFilterSelected: number) {
    const result = await this.workpackSrv.GetAll({
      'id-plan': idPlan,
      'id-plan-model': this.idPlanModel,
      'id-workpack-model': workpackModelId,
      idFilter: idFilterSelected,
      noLoading: true
    });
    const workpacks = result.success && result.data;
    if (workpacks && workpacks.length > 0) {
      const workpackItemCardList: IWorkpackCardItem[] = workpacks.map(workpack => {
        const propertyNameWorkpackModel = workpack.model?.properties?.find(p => p.name === 'name' && p.session === 'PROPERTIES');
        const propertyNameWorkpack = workpack.properties?.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
        const propertyFullnameWorkpackModel = workpack.model?.properties?.find(p => p.name === 'fullName' && p.session === 'PROPERTIES');
        const propertyFullnameWorkpack = workpack.properties?.find(p => p.idPropertyModel === propertyFullnameWorkpackModel.id);
        const menuItems: MenuItem[] = [];
        if (workpack.canceled && workpack.type !== 'Project' && !workpack.linked) {
          menuItems.push({
            label: this.translateSrv.instant('restore'),
            icon: 'fas fa-redo-alt',
            command: (event) => this.handleRestoreWorkpack(workpack.id),
            disabled: !this.editPermission
          });
        } else {
          if (workpack.type !== 'Project' && !!workpack.canDeleted && !workpack.canceled && !workpack.linked) {
            menuItems.push({
              label: this.translateSrv.instant('delete'),
              icon: 'fas fa-trash-alt',
              command: (event) => this.deleteWorkpack(workpack),
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
              command: (event) => this.handleCancelWorkpack(workpack.id),
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
                command: (event) => this.navigateToCancelProject(workpack.id, propertyNameWorkpack.value as string),
              });
            }
            if (!workpack.pendingBaseline && !workpack.cancelPropose && !workpack.hasActiveBaseline && !workpack.linked) {
              menuItems.push({
                label: this.translateSrv.instant('delete'),
                icon: 'fas fa-trash-alt',
                command: (event) => this.deleteWorkpack(workpack),
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
              command: (event) => this.unlinkedWorkpack(workpack.id, workpack.linkedModel),
            });
          }
        }
        return {
          typeCardItem: workpack.type,
          icon: workpack.model.fontIcon,
          iconSvg: false,
          nameCardItem: propertyNameWorkpack?.value as string,
          fullNameCardItem: propertyFullnameWorkpack?.value as string,
          itemId: workpack.id,
          menuItems,
          urlCard: '/workpack',
          paramsUrlCard: workpack.linked ?  [{ name: 'idPlan', value: this.idPlan }, { name: 'idWorkpackModelLinked', value: workpack.linkedModel }] :
            [{ name: 'idPlan', value: this.idPlan }],
          linked: !!workpack.linked ? true : false,
          shared: workpack.sharedWith && workpack.sharedWith.length > 0 ? true : false,
          canceled: workpack.canceled,
          completed: workpack.completed,
          endManagementDate: workpack.endManagementDate,
          dashboard: workpack.dashboard,
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
              command: () => this.handleLinkToWorkpack(wp.id, workpackModelId)
            }))
          });
        }
        const workpackCuted = this.workpackSrv.getWorkpackCuted();
        if (workpackCuted) {
          const { canPaste, incompatiblesProperties } = await this.checkPasteWorkpack(workpackCuted, workpackModelId);
          const validPasteOutherOffice = workpackCuted.plan.idOffice === this.idOffice ? true : this.isUserAdmin;
          if (canPaste && validPasteOutherOffice) {
            iconMenuItems.push({
              label: `${this.translateSrv.instant('paste')} ${this.getNameWorkpack(workpackCuted)}`,
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
              command: () => this.handleLinkToWorkpack(wp.id, workpackModelId)
            }))
          });
        }
        const workpackCuted = this.workpackSrv.getWorkpackCuted();
        if (workpackCuted) {
          const { canPaste, incompatiblesProperties } = await this.checkPasteWorkpack(workpackCuted, workpackModelId);
          const validPasteOutherOffice = workpackCuted.plan.idOffice === this.idOffice ? true : this.isUserAdmin;
          if (canPaste && validPasteOutherOffice) {
            iconMenuItems.push({
              label: `${this.translateSrv.instant('paste')} ${this.getNameWorkpack(workpackCuted)}`,
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

  async handleRestoreWorkpack(idWorkpack: number) {
    const result = await this.workpackSrv.restoreWorkpack(idWorkpack);
  }

  getNameWorkpack(workpack: IWorkpack): string {
    const propertyNameWorkpackModel = workpack.model?.properties?.find(p => p.name === 'name' && p.session === 'PROPERTIES');
    const propertyNameWorkpack = workpack.properties?.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
    return propertyNameWorkpack?.value as string;
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

  async unlinkedWorkpack(idWorkpackLinked, idWorkpackModel) {
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

  async handleCancelWorkpack(idWorkpack: number) {
    const result = await this.workpackSrv.cancelWorkpack(idWorkpack);
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
      .findIndex(workpackModel => workpackModel.idWorkpackModel === workpack.model.id);
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
    const result = await this.workpackSrv.pasteWorkpack(workpackCuted.id, idWorkpackModelTo, {
      idPlanFrom: workpackCuted.plan.id,
      idParentFrom: workpackCuted.idParent,
      idPlanTo,
      idParentTo,
      idWorkpackModelFrom: workpackCuted.model.id
    });
    if (result.success) {
      this.menuSrv.reloadMenuPortfolio();
      await this.loadWorkPackModels();
      this.workpackSrv.removeWorkpackCuted();
    }
  }

  async checkPasteWorkpack(workpackCuted: IWorkpack, idWorkpackModelTo: number) {
    const result = await this.workpackSrv.checkPasteWorkpack(workpackCuted.id, idWorkpackModelTo, {
      idWorkpackModelFrom: workpackCuted.model.id,
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

  async handleLinkToWorkpack(idWorkpack: number, idWorkpackModel: number) {
    const result = await this.workpackSrv.linkWorkpack(idWorkpack, idWorkpackModel, { 'id-plan': this.idPlan });
    if (result.success) {
      this.router.navigate(['/workpack'], {
        queryParams: {
          id: idWorkpack,
          idWorkpackModelLinked: idWorkpackModel
        }
      });
    }
  }

  async deleteWorkpack(workpack: IWorkpack) {
    const result = await this.workpackSrv.delete(workpack, { useConfirm: true });
    if (result.success) {
      const workpackModelIndex = this.cardsPlanWorkPackModels
        .findIndex(workpackModel => workpackModel.idWorkpackModel === workpack.model.id);
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

  async handleEndManagementDeliverable() {
    if (this.endManagementWorkpack && this.endManagementWorkpack.reason.length > 0
      && this.endManagementWorkpack.endManagementDate !== null) {
      const result = await this.workpackSrv.endManagementDeliverable({
        idWorkpack: this.endManagementWorkpack.idWorkpack,
        endManagementDate: moment(this.endManagementWorkpack.endManagementDate).format('yyyy-MM-DD'),
        reason: this.endManagementWorkpack.reason
      });
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
    await this.reloadWorkpacksOfWorkpackModelSelectedFilter(idFilter, idWorkpackModel);
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
      },
      {
        key: 'filter',
        routerLink: ['/filter-dataview'],
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

  async reloadWorkpacksOfWorkpackModelSelectedFilter(idFilter: number, idWorkpackModel: number) {
    const { workpackItemCardList, iconMenuItems } = await this.loadWorkpacksFromWorkpackModel(this.planData.id, idWorkpackModel, idFilter);
    const workpacksByFilter = workpackItemCardList;
    const workpackModelCardIndex = this.cardsPlanWorkPackModels.findIndex(card => card.idWorkpackModel === idWorkpackModel);
    if (workpackModelCardIndex > -1) {
      this.cardsPlanWorkPackModels[workpackModelCardIndex].workpackItemCardList = Array.from(workpacksByFilter);
      this.cardsPlanWorkPackModels[workpackModelCardIndex].propertiesCard.createNewElementMenuItemsWorkpack = iconMenuItems;
      if (this.cardsPlanWorkPackModels[workpackModelCardIndex].workpackItemCardList.find(card => card.typeCardItem === 'newCardItem')) {
        this.cardsPlanWorkPackModels[workpackModelCardIndex].propertiesCard.showCreateNemElementButton = true;
      }
      this.totalRecords[workpackModelCardIndex] = workpacksByFilter && workpacksByFilter.length;
    }
  }

}
