import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { FilterDataviewPropertiesEntity } from './../../../shared/constants/filterDataviewPropertiesEntity';
import { FilterDataviewService } from './../../../shared/services/filter-dataview.service';
import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { MenuItem, MessageService } from 'primeng/api';

import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { OfficeService } from 'src/app/shared/services/office.service';
import { PlanService } from 'src/app/shared/services/plan.service';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IPlanModel } from 'src/app/shared/interfaces/IPlanModel';
import { PlanModelService } from 'src/app/shared/services/plan-model.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { MenuService } from 'src/app/shared/services/menu.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { PersonService } from 'src/app/shared/services/person.service';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

@Component({
  selector: 'app-office',
  templateUrl: './office.component.html',
  styleUrls: ['./office.component.scss']
})
export class OfficeComponent implements OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

  propertiesOffice: IOffice;
  responsive = false;
  formOffice: FormGroup;
  idOffice: number;
  planModelsOfficeList: IPlanModel[];
  menuItemsNewPlan: MenuItem[];
  plans: IPlan[];
  cardItemsPlans: ICardItem[];
  cardItemPlanMenu: MenuItem[];
  $destroy = new Subject();
  isUserAdmin: boolean;
  editPermission: boolean;
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  filterProperties: IFilterProperty[] = this.filterSrv.get;
  idFilterSelected: number;
  isLoading = false;
  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'properties',
    collapseble: true,
  };
  cardPlans: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'plans',
    collapseble: true,
    showFilters: true,
    initialStateCollapse: this.collapsePanelsStatus
  };
  formIsSaving = false;

  constructor(
    private formBuilder: FormBuilder,
    private officeSrv: OfficeService,
    private planModelSrv: PlanModelService,
    private planSrv: PlanService,
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private responsiveSvr: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private messageSrv: MessageService,
    private menuSrv: MenuService,
    private filterSrv: FilterDataviewService,
    private configDataViewSrv: ConfigDataViewService,
    private personSrv: PersonService
  ) {
    this.configDataViewSrv.observableCollapsePanelsStatus.pipe(takeUntil(this.$destroy)).subscribe(collapsePanelStatus => {
      this.collapsePanelsStatus = collapsePanelStatus === 'collapse' ? true : false;
      this.cardProperties = Object.assign({}, {
        ...this.cardProperties,
        initialStateCollapse: this.collapsePanelsStatus
      });
      this.cardPlans = Object.assign({}, {
        ...this.cardPlans,
        initialStateCollapse: this.collapsePanelsStatus
      });
    });
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
    this.activeRoute.queryParams.subscribe(async ({ id }) => {
      this.idOffice = +id;
      if (this.idOffice) {
        this.isLoading = true;
        this.cardProperties.isLoading = true;
        this.setWorkOffice();
      }
      await this.load();
    });
    this.loadCards();
    this.formOffice = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: ['', [Validators.required]]
    });
    this.formOffice.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formOffice.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formOffice.dirty && this.formOffice.valid))
      .subscribe(() => {
        this.saveButton.showButton();
      });
    this.formOffice.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formOffice.dirty))
      .subscribe(() => {
        this.cancelButton.showButton();
      });
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    localStorage.removeItem('open-pmo:WORKPACK_TABVIEW');
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  mirrorFullName(): boolean {
    return (isNaN(this.idOffice) && this.formOffice.get('fullName').pristine);
  }

  setWorkOffice() {
    this.personSrv.setPersonWorkLocal({
      idOffice: this.idOffice,
      idPlan: null,
      idWorkpack: null,
      idWorkpackModelLinked: null
    });
  }

  async load() {
    this.isLoading = true;
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    await this.loadPropertiesOffice();
    if (this.idOffice) {
      await this.loadPlans();
    }
  }

  loadCards() {
    this.cardProperties.initialStateCollapse = this.idOffice ? this.collapsePanelsStatus : false
  }

  async loadPropertiesOffice() {
    if (this.idOffice) {
      this.propertiesOffice = await this.officeSrv.getCurrentOffice(this.idOffice);
      if (this.propertiesOffice) {
        this.formOffice.reset({ name: this.propertiesOffice.name, fullName: this.propertiesOffice.fullName });
        if (!this.editPermission) {
          this.formOffice.disable();
        }
        this.cardProperties.isLoading = false;
      } else {
        this.router.navigate(['offices']);
        return;
      }
    }
    this.breadcrumbSrv.setMenu([]);
  }

  async loadPlanModelsOfficeList() {
    this.isLoading = true;
    const { success, data } = await this.planModelSrv.GetAll({ 'id-office': this.idOffice });
    if (success) {
      this.planModelsOfficeList = data;
      this.loadMenuItemsNewPlan();
    }
  }

  loadMenuItemsNewPlan() {
    this.menuItemsNewPlan = this.planModelsOfficeList.map(planModel =>
    ({
      label: planModel.name,
      icon: 'app-icon plan-model',
      command: () => this.navigateToNewPlan(planModel.id)
    })
    );
  }

  async loadPlans() {
    this.isLoading = true;
    await this.loadPlanModelsOfficeList();
    const filters = await this.loadFiltersPlans();
    this.cardPlans = {
      ...this.cardPlans,
      filters
    }
    const result = await this.planSrv.GetAll({ 'id-office': this.idOffice, 'idFilter': this.idFilterSelected });
    if (result.success) {
      this.plans = result.data;
      this.isLoading = false;
    }
    this.loadCardItemsPlans();
  }

  async loadCardItemsPlans() {
    const itemsPlans: ICardItem[] = (this.editPermission && this.menuItemsNewPlan?.length > 0) ? [
      {
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        iconMenuItems: this.menuItemsNewPlan,
      }
    ] : [];
    if (this.plans) {
      itemsPlans.unshift(... this.plans.map(plan => {
        const editPermissions = !this.isUserAdmin && plan.permissions.filter(p => p.level === 'EDIT');
        const planEditPermission = this.isUserAdmin ? true : (editPermissions.length > 0 ? true : false);
        return {
          typeCardItem: 'listItem',
          iconSvg: true,
          icon: IconsEnum.Plan,
          nameCardItem: plan.name,
          fullNameCardItem: plan.fullName,
          subtitleCardItem: plan.planModel && plan.planModel.name,
          itemId: plan.id,
          menuItems: [
            {
              label: this.translateSrv.instant('permissions'),
              icon: 'icon: fas fa-user-lock',
              command: () => this.navigateToPlanPermissions(plan.id),
            },
            {
              label: this.translateSrv.instant('delete'),
              icon: 'fas fa-trash-alt',
              command: () => this.deletePlan(plan),
              disabled: !planEditPermission
            },
          ],
          urlCard: '/plan',
          paramsUrlCard: [{name: 'idOffice', value: this.idOffice}]
        };
      }));
    }
    this.cardItemsPlans = itemsPlans;
    this.totalRecords = this.cardItemsPlans && this.cardItemsPlans.length;
    this.cardPlans = {
      ...this.cardPlans,
      idFilterSelected: this.idFilterSelected,
      showCreateNemElementButton: this.editPermission && this.menuItemsNewPlan?.length > 0 ? true : false,
      createNewElementMenuItems: this.menuItemsNewPlan
    }
    this.isLoading = false;
  }

  navigateToNewPlan(idPlanModel: number) {
    this.router.navigate(['/plan'],
      {
        queryParams: {
          idOffice: this.idOffice,
          idPlanModel
        }
      }
    );
  }

  navigateToPlanPermissions(idPlan: number) {
    this.router.navigate(['/plan', 'permission'],
      {
        queryParams: {
          idPlan
        }
      }
    );
  }

  async deletePlan(plan: IPlan) {
    const result = await this.planSrv.delete(plan, { useConfirm: true });
    if (result.success) {
      this.cardItemsPlans = Array.from(this.cardItemsPlans.filter(p => p.itemId !== plan.id));
      this.totalRecords = this.cardItemsPlans && this.cardItemsPlans.length;
    }
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    if (this.idOffice) {
      this.formOffice.reset({ name: this.propertiesOffice.name, fullName: this.propertiesOffice.fullName });
    } else {
      this.formOffice.reset();
    }
  }

  async handleOnSubmit() {
    this.cancelButton.hideButton();
    const isPut = !!this.idOffice;
    this.formIsSaving = true;
    const { success, data } = isPut
      ? await this.officeSrv.put({ ...this.formOffice.value, id: this.idOffice })
      : await this.officeSrv.post(this.formOffice.value);
    if (success) {
      this.idOffice = data.id;
      if (!this.isUserAdmin && !isPut) {
        this.createOfficePermission(data.id);
      }
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      if (!isPut) {
        this.personSrv.setPersonWorkLocal({
          idOffice: this.idOffice,
          idPlan: null,
          idWorkpack: null,
          idWorkpackModelLinked: null
        });
        this.propertiesOffice = {
          ...this.formOffice.value
        };
        localStorage.setItem('@pmo/propertiesCurrentOffice', JSON.stringify(this.propertiesOffice));
        localStorage.setItem('@pmo/propertiesCurrentOffice', this.idOffice.toString());
        this.officeSrv.nextIDOffice(this.idOffice);
      }
      this.formIsSaving = false;
      this.menuSrv.reloadMenuOffice();
    }
  }

  async createOfficePermission(idOffice: number) {
    const payload = this.authSrv.getTokenPayload();
    if (payload) {
      await this.officePermissionSrv.post({
        email: payload.email,
        idOffice,
        permissions: [{
          level: 'EDIT',
          role: 'User'
        }]
      });
    }
  }

  async loadFiltersPlans() {
    const result = await this.filterSrv.getAllFilters('plans');
    if (result.success && result.data.length > 0) {
      const filterDefault = result.data.find(defaultFilter => !!defaultFilter.favorite);
      this.idFilterSelected = filterDefault ? filterDefault.id : undefined;
      return result.data;
    }
  }

  handleEditFilter(event) {
    const idFilter = event.filter;
    if (idFilter) {
      this.setBreadcrumbStorage();
      const filterProperties = this.loadFilterPropertiesList();
      this.filterSrv.setFilterProperties(filterProperties);
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          idFilter: idFilter,
          entityName: 'plans'
        }
      });
    }
  }

  async handleSelectedFilter(event) {
    this.isLoading = true;
    const idFilter = event.filter;
    this.idFilterSelected = idFilter;
    const result = await this.planSrv.GetAll({ 'id-office': this.idOffice, idFilter: this.idFilterSelected });
    if (result.success) {
      this.plans = result.data;
    }
    this.loadCardItemsPlans();
  }

  async handleSearchText(event) {
    const term = event.term;
    const result = await this.planSrv.GetAll({
      'id-office': this.idOffice,
      idFilter: this.idFilterSelected,
      term
    });
    if (result.success) {
      this.plans = result.data;
    }
    this.loadCardItemsPlans();
  }

  handleNewFilter() {
    const filterProperties = this.loadFilterPropertiesList();
    this.filterSrv.setFilterProperties(filterProperties);
    this.setBreadcrumbStorage();
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: 'plans'
      }
    });
  }

  loadFilterPropertiesList() {
    const listProperties = FilterDataviewPropertiesEntity.plans;
    const filterPropertiesList = listProperties.map(prop => {
      const property: IFilterProperty = {
        type: prop.type,
        label: prop.label,
        name: prop.apiValue,
        active: true,
      }
      return property;
    });

    return filterPropertiesList;
  }

  setBreadcrumbStorage() {
    this.breadcrumbSrv.setBreadcrumbStorage([{
      key: 'office',
      routerLink: ['/offices', 'office'],
      queryParams: { id: this.idOffice },
      info: this.propertiesOffice?.name,
      tooltip: this.propertiesOffice?.fullName
    }]);
  }

}
