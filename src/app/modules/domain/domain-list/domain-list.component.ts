import { PropertyTemplateModel } from './../../../shared/models/PropertyTemplateModel';
import { FilterDataviewPropertiesEntity } from './../../../shared/constants/filterDataviewPropertiesEntity';
import { FilterDataviewService } from './../../../shared/services/filter-dataview.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IDomain } from 'src/app/shared/interfaces/IDomain';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { DomainService } from 'src/app/shared/services/domain.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-domain-list',
  templateUrl: './domain-list.component.html',
  styleUrls: ['./domain-list.component.scss']
})
export class DomainListComponent implements OnInit, OnDestroy {

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'domains',
    collapseble: true,
    initialStateCollapse: false
  };
  idOffice: number;
  propertiesOffice: IOffice;
  cardItemsProperties: ICardItem[];
  isUserAdmin: boolean;
  editPermission: boolean;
  $destroy = new Subject();
  responsive: boolean;
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  idFilterSelected: number;

  constructor(
    private domainSvr: DomainService,
    private officeSrv: OfficeService,
    private translateSvr: TranslateService,
    private activeRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private responsiveSrv: ResponsiveService,
    private filterSrv: FilterDataviewService,
    private router: Router
  ) {
    this.activeRoute.queryParams.subscribe(params => {
      this.idOffice = +params.idOffice;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  async ngOnInit() {
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    await this.loadFiltersDomains();
    await this.loadPropertiesDomains();
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
      key: 'domains',
      info: this.propertiesOffice?.name,
      tooltip: this.propertiesOffice?.fullName,
      routerLink: ['/domains'],
      queryParams: { idOffice: this.idOffice }
    }
  ]);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
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
    const { success, data } = await this.officeSrv.GetById(this.idOffice);
    if (success) {
      this.propertiesOffice = data;
    }
  }

  async loadPropertiesDomains() {
    const { success, data } = await this.domainSvr.GetAll({ 'id-office': this.idOffice, idFilter: this.idFilterSelected });
    const itemsProperties: ICardItem[] = this.editPermission ? [
      {
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        urlCard: '/domains/detail',
        paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }]
      }
    ] : [];
    this.cardProperties.showCreateNemElementButton = this.editPermission ? true : false;
    if (success) {

      itemsProperties.unshift(...data.map(domain => ({
        typeCardItem: 'listItem',
        iconSvg: true,
        icon: IconsEnum.MapMarked,
        nameCardItem: domain.name,
        fullNameCardItem: domain.fullName,
        itemId: domain.id,
        menuItems: [{ label: this.translateSvr.instant('delete'), icon: 'fas fa-trash-alt',
          command: () => this.deleteDomain(domain),
          disabled: !this.editPermission }] as MenuItem[],
        urlCard: 'detail',
        paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }]
      })));
    }
    this.cardItemsProperties = itemsProperties;
    this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;

  }

  async deleteDomain(domain: IDomain) {
    const { success } = await this.domainSvr.delete(domain);
    if (success) {
      this.cardItemsProperties = Array.from(this.cardItemsProperties.filter(element => element.itemId !== domain.id));
      this.totalRecords = this.cardItemsProperties && this.cardItemsProperties.length;
    }
  };

  async loadFiltersDomains() {
    const result = await this.filterSrv.getAllFilters('domains');
    if (result.success && result.data.length > 0) {
      const filterDefault = result.data.find( filter => !!filter.favorite);
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
          entityName: 'domains'
        }
      });
    }
  }

  async handleSelectedFilter(event) {
    const idFilter = event.filter;
    if (idFilter) {
      this.idFilterSelected = idFilter;
      await this.loadPropertiesDomains();
    }
  }

  handleNewFilter() {
    const filterProperties = this.loadFilterPropertiesList();
    this.filterSrv.setFilterProperties(filterProperties);
    this.setBreadcrumbStorage();
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: 'domains'
      }
    });
  }

  loadFilterPropertiesList() {
    const listProperties = FilterDataviewPropertiesEntity.domains;
    const filterPropertiesList = listProperties.map( prop => {
      const property =  new PropertyTemplateModel();
      property.type = prop.type;
      property.label = prop.label;
      property.name = prop.apiValue;
      property.active = true;
      return property;
    });
    return filterPropertiesList;
  }

  setBreadcrumbStorage() {
    this.breadcrumbSrv.setBreadcrumbStorage([{
      key: 'domains',
      info: this.propertiesOffice?.name,
      tooltip: this.propertiesOffice?.fullName,
      routerLink: ['/domains'],
      queryParams: { idOffice: this.idOffice }
    }, {
      key: 'filter',
      routerLink: ['filter-dataview']
    }]);
  }

  createNewDomain() {
    this.router.navigate(['/domains/detail'], { queryParams: { idOffice: this.idOffice } });
  }

}
