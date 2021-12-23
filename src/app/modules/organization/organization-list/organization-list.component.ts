import { PropertyTemplateModel } from './../../../shared/models/PropertyTemplateModel';
import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { FilterDataviewService } from './../../../shared/services/filter-dataview.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MenuItem } from 'primeng/api';

import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IOrganization } from 'src/app/shared/interfaces/IOrganization';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { OrganizationService } from 'src/app/shared/services/organization.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-organization-list',
  templateUrl: './organization-list.component.html',
  styleUrls: ['./organization-list.component.scss']
})
export class OrganizationListComponent implements OnInit {

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'organizations',
    collapseble: true,
    initialStateCollapse: false
  };
  propertiesOffice: IOffice;
  idOffice: number;
  cardItemsProperties: ICardItem[] = [];
  isUserAdmin: boolean;
  editPermission: boolean;
  responsive: boolean;
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  idFilterSelected: number;

  constructor(
    private organizationSvr: OrganizationService,
    private officeSrv: OfficeService,
    private activeRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private responsiveSrv: ResponsiveService,
    private filterSrv: FilterDataviewService,
    private router: Router
  ) {
    this.activeRoute.queryParams.subscribe(({ idOffice }) => this.idOffice = +idOffice);
    this.responsiveSrv.observable.subscribe(value => this.responsive = value);
  }


  async ngOnInit() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    await this.loadFiltersOrganizations();
    await this.loadPropertiesOrganizations();
    await this.getOfficeById();
    this.breadcrumbSrv.setMenu([
      {
        key: 'administration',
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName,
        routerLink: [ '/configuration-office' ],
        queryParams: { idOffice: this.idOffice }
      },
      {
      key: 'organizations',
      info: this.propertiesOffice?.name,
      tooltip: this.propertiesOffice?.fullName,
      routerLink: ['/organizations'],
      queryParams: { idOffice: this.idOffice }
    }
  ]);
  }

  handleChangeCollapseExpandPanel(event) {
    this.collapsePanelsStatus = event.mode === 'collapse' ? true : false;
    this.cardProperties = Object.assign({}, {
      ...this.cardProperties,
      initialStateCollapse: this.collapsePanelsStatus
    });
  }

  handleChangeDisplayMode(event) {
    this.displayModeAll = event.displayMode;
  }

  handleChangePageSize(event) {
    this.pageSize = event.pageSize;
  }

  async getOfficeById() {
    const { data, success } = await this.officeSrv.GetById(this.idOffice);
    if (success) {
      this.propertiesOffice = data;
    }
  }

  async loadPropertiesOrganizations() {
    const { success, data } = await this.organizationSvr.GetAll({ 'id-office': this.idOffice, idFilter: this.idFilterSelected });
    const itemsProperties = this.editPermission
      ? [{
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        urlCard: '/organizations/organization',
        paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }]
      }]
      : [];
    if (success) {
      itemsProperties.unshift(...data.map(organization => ({
        typeCardItem: 'listItem',
        iconSvg: true,
        icon: IconsEnum.Building,
        nameCardItem: organization.name,
        fullNameCardItem: organization.fullName,
        itemId: organization.id,
        menuItems: [{
          label: 'Delete', icon: 'fas fa-trash-alt',
          command: () => this.deleteOrganization(organization),
          disabled: !this.editPermission
        }] as MenuItem[],
        urlCard: 'organization',
        paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }],
      })
      ));
    }
    this.cardItemsProperties = itemsProperties;
    this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;
    this.cardProperties.showCreateNemElementButton = this.editPermission ? true : false;
  }

  handleCreateNewOrganization() {
    this.router.navigate(['/organizations/organization'], {
      queryParams: {
        idOffice: this.idOffice
      }
    });
  }

  async deleteOrganization(organization: IOrganization) {
    const { success } = await this.organizationSvr.delete(organization);
    if (success) {
      this.cardItemsProperties = Array.from(this.cardItemsProperties.filter(element => element.itemId !== organization.id));
      this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;
    }
  };

  async loadFiltersOrganizations() {
    const result = await this.filterSrv.getAllFilters('organizations');
    if (result.success && result.data.length > 0) {
      const filterDefault = result.data.find(filter => !!filter.favorite);
      this.idFilterSelected = filterDefault ? filterDefault.id : undefined;
      this.cardProperties.filters = result.data;
    }
    this.cardProperties.showFilters = true;
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
          entityName: 'organizations'
        }
      });
    }
  }

  async handleSelectedFilter(event) {
    const idFilter = event.filter;
    if (idFilter) {
      this.idFilterSelected = idFilter;
      await this.loadPropertiesOrganizations();
    }
  }

  handleNewFilter() {
    const filterProperties = this.loadFilterPropertiesList();
    this.filterSrv.setFilterProperties(filterProperties);
    this.setBreadcrumbStorage();
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: 'organizations'
      }
    });
  }

  loadFilterPropertiesList() {
    const listProperties = FilterDataviewPropertiesEntity.organizations;
    const filterPropertiesList = listProperties.map(prop => {
      const property = new PropertyTemplateModel();
      property.type = prop.type;
      property.label = prop.label;
      property.name = prop.apiValue;
      property.active = true;
      property.possibleValues = prop.possibleValues;
      return property;
    });
    return filterPropertiesList;
  }

  setBreadcrumbStorage() {
    this.breadcrumbSrv.setBreadcrumbStorage([{
      key: 'organizations',
      info: this.propertiesOffice?.name,
      tooltip: this.propertiesOffice?.fullName,
      routerLink: ['/organizations'],
      queryParams: { idOffice: this.idOffice }
    },
    {
      key: 'filter',
      routerLink: ['/filter-dataview'],
    }]);
  }
}
