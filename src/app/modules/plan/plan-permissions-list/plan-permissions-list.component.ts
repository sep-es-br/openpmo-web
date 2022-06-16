import { takeUntil } from 'rxjs/operators';
import { CitizenUserService } from './../../../shared/services/citizen-user.service';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { PropertyTemplateModel } from './../../../shared/models/PropertyTemplateModel';
import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { FilterDataviewService } from './../../../shared/services/filter-dataview.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { IPlanPermission } from 'src/app/shared/interfaces/IPlanPermission';
import { PlanService } from 'src/app/shared/services/plan.service';
import { PlanPermissionService } from 'src/app/shared/services/plan-permissions.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICardItemPermission } from 'src/app/shared/interfaces/ICardItemPermission';
import { TranslateService } from '@ngx-translate/core';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-plan-permissions-list',
  templateUrl: './plan-permissions-list.component.html',
  styleUrls: ['./plan-permissions-list.component.scss']
})
export class PlanPermissionsListComponent implements OnInit {

  idPlan: number;
  idOffice: number;
  responsive: boolean;
  propertiesPlan: IPlan;
  propertiesOffice: IOffice;
  planPermissions: IPlanPermission[];
  cardItemsPlanPermissions: ICardItemPermission[];
  cardPlanPermissions: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'permissions',
    collapseble: true,
    initialStateCollapse: false,
    showFilters: true
  };
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  idFilterSelected: number;
  $destroy = new Subject();

  constructor(
    private actRouter: ActivatedRoute,
    private responsiveSrv: ResponsiveService,
    private planSrv: PlanService,
    private planPermissionSrv: PlanPermissionService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private officeSrv: OfficeService,
    private filterSrv: FilterDataviewService,
    private router: Router,
    private citizenUserSrv: CitizenUserService
  ) {
    this.citizenUserSrv.loadCitizenUsers();
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idPlan = queryParams.idPlan;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.planSrv.nextIDPlan(this.idPlan);
  }

  async ngOnInit() {
    await this.loadPlanPermissionsFilters();
    await this.loadPropertiesPlan();
    await this.loadPropertiesOffice();
  }


  handleChangeDisplayMode(event) {
    this.displayModeAll = event.displayMode;
  }

  handleChangePageSize(event) {
    this.pageSize = event.pageSize;
  }

  async loadPropertiesPlan() {
    if (this.idPlan) {
      const result = await this.planSrv.GetById(this.idPlan);
      this.propertiesPlan = result.data;
      this.loadPlanPermissions();
    }
  }

  async loadPlanPermissions() {
    const result = await this.planPermissionSrv.GetAll({ 'id-plan': this.idPlan, idFilter: this.idFilterSelected });
    if (result.success) {
      this.planPermissions = result.data;
      this.loadCardItemsPlanPermissions();
    }
  }

  async loadPropertiesOffice() {
    this.idOffice = this.propertiesPlan?.idOffice;
    const { success, data } = await this.officeSrv.GetById(this.idOffice);
    if (success) {
      this.propertiesOffice = data;
    }
    this.setBreacrumb();
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
      {
        key: 'planPermissions',
        routerLink: ['/plan', 'permission'],
        queryParams: { idPlan: this.idPlan },
        info: this.propertiesPlan?.name,
        tooltip: this.propertiesPlan?.fullName
      }
    ]);
  }

  loadCardItemsPlanPermissions() {
    this.cardItemsPlanPermissions = this.planPermissions.map(p => {
      const fullName = p.person.name.split(' ');
      const name = fullName.length > 1 ? fullName[0] + ' ' + fullName[1] : fullName[0];
      return {
        typeCardItem: 'listItem',
        titleCardItem: name,
        fullNameUser: p.person.fullName,
        roleDescription: (p.permissions.filter(r => r.level === 'EDIT').length > 0
          ? this.translateSrv.instant('edit')
          : this.translateSrv.instant('read')),
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deletePlanPermission(p)
        }],
        itemId: p.person.id,
        urlCard: 'plan/permission/detail',
        paramsUrlCard: [
          { name: 'idPlan', value: this.idPlan },
          { name: 'email', value: p.person.email }
        ]
      };
    });
    this.cardItemsPlanPermissions.push(
      {
        typeCardItem: 'newCardItem',
        urlCard: '/plan/permission/detail',
        paramsUrlCard: [
          { name: 'idPlan', value: this.idPlan }
        ]
      }
    );
    this.totalRecords = this.cardItemsPlanPermissions && this.cardItemsPlanPermissions.length;
    this.cardPlanPermissions.showCreateNemElementButton = true;
  }

  handleCreateNewPlanPermission() {
    this.router.navigate(['/plan/permission/detail'], {
      queryParams: {
        idPlan: this.idPlan
      }
    });
  }

  async deletePlanPermission(permission: IPlanPermission) {
    const result = await this.planPermissionSrv.deletePermission({ email: permission.person.email, 'id-plan': permission.idPlan });
    if (result.success) {
      this.cardItemsPlanPermissions = Array.from(this.cardItemsPlanPermissions.filter(p => p.itemId !== permission.person.id));
      this.totalRecords = this.cardItemsPlanPermissions && this.cardItemsPlanPermissions.length;
    }
  }

  async loadPlanPermissionsFilters() {
    const result = await this.filterSrv.getAllFilters('plan-permissions');
    if (result.success && result.data.length > 0) {
      const filterDefault = result.data.find(filter => !!filter.favorite);
      this.idFilterSelected = filterDefault ? filterDefault.id : undefined;
      this.cardPlanPermissions.filters = result.data;
    }
    this.cardPlanPermissions.showFilters = true;
  }

  handleEditFilter(event) {
    const idFilter = event.filter;
    if (idFilter) {
      const filterProperties = this.loadFilterPropertiesList();
      this.filterSrv.setFilterProperties(filterProperties);
      this.setBreadcrumbStorage();
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName: 'plan-permissions'
        }
      });
    }
  }

  async handleSelectedFilter(event) {
    const idFilter = event.filter;
    this.idFilterSelected = idFilter;
    await this.loadPlanPermissions();
  }

  handleNewFilter() {
    const filterProperties = this.loadFilterPropertiesList();
    this.filterSrv.setFilterProperties(filterProperties);
    this.setBreadcrumbStorage();
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: 'plan-permissions'
      }
    });
  }

  loadFilterPropertiesList() {
    const listProperties = FilterDataviewPropertiesEntity.planPermissions;
    const filterPropertiesList = listProperties.map(prop => {
      const property: IFilterProperty = {
        type: prop.type,
        label: prop.label,
        name: prop.apiValue,
        active: true,
        possibleValues: prop.possibleValues
      };
      return property;
    });
    return filterPropertiesList;
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
        key: 'planPermissions',
        routerLink: ['/plan', 'permission'],
        queryParams: { idPlan: this.idPlan },
        info: this.propertiesPlan?.name,
        tooltip: this.propertiesPlan?.fullName
      },
      {
        key: 'filter',
        routerLink: ['filter-dataview'],
      }
    ]);
  }

  async ngOnDestroy(): Promise<void> {
    this.$destroy.next();
    this.$destroy.complete();
    this.citizenUserSrv.unloadCitizenUsers();
  }
}
