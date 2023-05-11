import { takeUntil } from 'rxjs/operators';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { PropertyTemplateModel } from './../../../shared/models/PropertyTemplateModel';
import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';

import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IPlanModel } from 'src/app/shared/interfaces/IPlanModel';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { FilterDataviewService } from 'src/app/shared/services/filter-dataview.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { PlanModelService } from 'src/app/shared/services/plan-model.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-strategy-list',
  templateUrl: './strategy-list.component.html',
  styleUrls: ['./strategy-list.component.scss']
})
export class StrategyListComponent implements OnInit, OnDestroy {

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: '',
    collapseble: true,
    initialStateCollapse: false,
    showFilters: true
  };
  propertiesOffice: IOffice;
  idOffice: number;
  cardItemsProperties: ICardItem[] = [];
  isUserAdmin: boolean;
  editPermission: boolean;
  responsive: boolean;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  idFilterSelected: number;
  sharedPlanModels: IPlanModel[];
  $destroy = new Subject();
  isLoading = false;

  constructor(
    private planModelSvr: PlanModelService,
    private officeSrv: OfficeService,
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private responsiveSrv: ResponsiveService,
    private filterSrv: FilterDataviewService,
    private router: Router,
    private configDataViewSrv: ConfigDataViewService
  ) {
    localStorage.removeItem('@currentPlan');
    localStorage.removeItem('@pmo/propertiesCurrentPlan');
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
    this.activeRoute.queryParams.subscribe(async ({ idOffice }) => {
      this.idOffice = +idOffice;
      await this.getOfficeById()
      this.setBreadcrumb()
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
  }

  async ngOnInit() {
    this.isLoading = true;
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    if (!this.isUserAdmin && !this.editPermission) {
      this.router.navigate(['/offices']);
    }
    await this.getOfficeById();
    this.setBreadcrumb()
    await this.loadFiltersStrategies();
    await this.loadPropertiesStrategies();
  }

  ngOnDestroy() {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

  setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'administration',
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName,
        routerLink: ['/configuration-office'],
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'configuration',
        info: 'planModels',
        tooltip: this.translateSrv.instant('planModels'),
        routerLink: ['/strategies'],
        queryParams: { idOffice: this.idOffice }
      },
    ]);
  }

  async getOfficeById() {
    const { data, success } = await this.officeSrv.GetById(this.idOffice);
    if (success) {
      this.propertiesOffice = data;
    }
  }

  async loadPropertiesStrategies() {
    this.isLoading = true;
    const { success, data } = await this.planModelSvr.GetAll({ 'id-office': this.idOffice, idFilter: this.idFilterSelected });
    
    if (this.editPermission) {
      const resultSharedPlanModels = await this.planModelSvr.getSharedPlanModels({ 'id-office': this.idOffice });
      if (resultSharedPlanModels.success) {
        this.sharedPlanModels = resultSharedPlanModels.data;
      }
    }
    const itemsProperties: ICardItem[] = this.editPermission
      ? [{
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        iconMenuItems: [
          {
            label: this.translateSrv.instant('fromScratch'),
            command: () => this.handleCreateNewEstrategy(),
          }
        ],
      }]
      : [];
    if (this.sharedPlanModels && this.sharedPlanModels.length > 0 && itemsProperties.length > 0) {
      itemsProperties[0].iconMenuItems.push({
        label: this.translateSrv.instant('fromShared'),
        items: this.sharedPlanModels.map(plan => ({
          label: plan.name,
          icon: `app-icon ${IconsEnum.PlanModel}`,
          command: () => this.handleCreateNewEstrategyFromShared(plan.id),
        }))
      });
    }
    if (success) {
      itemsProperties.unshift(...data.map(strategy => ({
        typeCardItem: 'listItem',
        iconSvg: true,
        icon: IconsEnum.PlanModel,
        nameCardItem: strategy.name,
        fullNameCardItem: strategy.fullName,
        itemId: strategy.id,
        menuItems:
          [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt', command: () => this.deleteStrategy(strategy), disabled: !this.editPermission
          }] as MenuItem[],
        urlCard: 'strategies/strategy',
        paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }]
      })));
      this.isLoading = false;
    }
    this.cardItemsProperties = itemsProperties;
    this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;
    this.cardProperties.showCreateNemElementButton = this.editPermission ? true : false;
  }

  handleCreateNewEstrategy() {
    this.router.navigate(['/strategies/strategy'], {
      queryParams: {
        idOffice: this.idOffice
      }
    });
  }

  async handleCreateNewEstrategyFromShared(idPlanModel) {
    const result = await this.planModelSvr.createPlanModelFromShared(this.idOffice, idPlanModel);
    if (result.success) {
      this.router.navigate(['strategies/strategy'], {
        queryParams: {
          id: result.data.id,
          idOffice: this.idOffice
        }
      });
    }
  }

  async deleteStrategy(strategy: IPlanModel) {
    const { success } = await this.planModelSvr.delete(strategy);
    if (success) {
      this.cardItemsProperties = Array.from(this.cardItemsProperties.filter(element => element.itemId !== strategy.id));
      this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;
    }
  };

  async loadFiltersStrategies() {
    const result = await this.filterSrv.getAllFilters('plan-models');
    if (result.success && result.data.length > 0) {
      const filterDefault = result.data.find(filter => !!filter.favorite);
      this.idFilterSelected = filterDefault ? filterDefault.id : undefined;
      this.cardProperties = Object.assign({}, {
        ...this.cardProperties,
        filters: Array.from(result.data)
      });
    }
  }

  handleEditFilter(event) {
    this.setBreadcrumbStorage();
    const idFilter = event.filter;
    if (idFilter) {
      const filterProperties = this.loadFilterPropertiesList();
      this.filterSrv.setFilterProperties(filterProperties);
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName: 'plan-models'
        }
      });
    }
  }

  async handleSelectedFilter(event) {
    const idFilter = event.filter;
    this.idFilterSelected = idFilter;
    await this.loadPropertiesStrategies();
  }

  handleNewFilter() {
    this.setBreadcrumbStorage();
    const filterProperties = this.loadFilterPropertiesList();
    this.filterSrv.setFilterProperties(filterProperties);
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: 'plan-models'
      }
    });
  }

  loadFilterPropertiesList() {
    const listProperties = FilterDataviewPropertiesEntity.strategies;
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
      key: 'administration',
      info: this.propertiesOffice?.name,
      tooltip: this.propertiesOffice?.fullName,
      routerLink: ['/configuration-office'],
      queryParams: { idOffice: this.idOffice }
    },
    {
      key: 'configuration',
      info: 'planModels',
      tooltip: this.translateSrv.instant('planModels'),
      routerLink: ['/strategies'],
      queryParams: { idOffice: this.idOffice }
    }, {
      key: 'filter',
      routerLink: ['filter-dataview']
    }]);
  }


}
