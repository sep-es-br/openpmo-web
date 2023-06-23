import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
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
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';

@Component({
  selector: 'app-domain-list',
  templateUrl: './domain-list.component.html',
  styleUrls: ['./domain-list.component.scss']
})
export class DomainListComponent implements OnInit, OnDestroy {

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: '',
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
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  idFilterSelected: number;
  isLoading = false;
  term = '';

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
    private router: Router,
    private translateSrv: TranslateService,
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
    this.activeRoute.queryParams.subscribe(params => {
      this.idOffice = +params.idOffice;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  async ngOnInit() {

    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    if (!this.editPermission) {
      this.router.navigate(['/offices']);
    }
    this.isLoading = true;
    await this.loadFiltersDomains();
    await this.loadPropertiesDomains();
    await this.getOfficeById();
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
        info: 'domains',
        tooltip: this.translateSrv.instant('domains'),
        routerLink: ['/domains'],
        queryParams: { idOffice: this.idOffice }
      },
    ]);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async getOfficeById() {
    const { success, data } = await this.officeSrv.GetById(this.idOffice);
    if (success) {
      this.propertiesOffice = data;
    }
  }

  async loadPropertiesDomains() {
    this.isLoading = true;
    const { success, data } = await this.domainSvr.GetAll({
      'id-office': this.idOffice,
      idFilter: this.idFilterSelected,
      term: this.term
    });
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
        menuItems: [{
          label: this.translateSvr.instant('delete'), icon: 'fas fa-trash-alt',
          command: () => this.deleteDomain(domain),
          disabled: !this.editPermission
        }] as MenuItem[],
        urlCard: 'domains/detail',
        paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }]
      })));
    }
    this.isLoading = false;
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
      this.setBreadcrumbStorage(idFilter);
      this.router.navigate(['/config/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName: 'domains',
          idOffice: this.idOffice
        }
      });
    }
  }

  async handleSelectedFilter(event) {
    const idFilter = event.filter;
    this.idFilterSelected = idFilter;
    await this.loadPropertiesDomains();
  }

  async handleSearchText(event) {
    this.term = event.term;
    await this.loadPropertiesDomains();
  }

  handleNewFilter() {
    const filterProperties = this.loadFilterPropertiesList();
    this.filterSrv.setFilterProperties(filterProperties);
    this.setBreadcrumbStorage();
    this.router.navigate(['/config/filter-dataview'], {
      queryParams: {
        entityName: 'domains',
        idOffice: this.idOffice
      }
    });
  }

  loadFilterPropertiesList() {
    const listProperties = FilterDataviewPropertiesEntity.domains;
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

  setBreadcrumbStorage(idFilter?) {
    const breadcrumb = idFilter ?
      [{
        key: 'administration',
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName,
        routerLink: ['/configuration-office'],
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'configuration',
        info: 'domains',
        tooltip: this.translateSrv.instant('domains'),
        routerLink: ['/domains'],
        queryParams: { idOffice: this.idOffice }
      }, {
        key: 'filter',
        routerLink: ['/config/filter-dataview'],
        queryParams: { id: idFilter, entityName: 'domains', idOffice: this.idOffice}
      }] :
      [{
        key: 'administration',
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName,
        routerLink: ['/configuration-office'],
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'configuration',
        info: 'domains',
        tooltip: this.translateSrv.instant('domains'),
        routerLink: ['/domains'],
        queryParams: { idOffice: this.idOffice }
      }, {
        key: 'filter',
        routerLink: ['/config/filter-dataview'],
        queryParams: { entityName: 'domains', idOffice: this.idOffice}
      }];
    this.breadcrumbSrv.setBreadcrumbStorage(breadcrumb);
  }

  createNewDomain() {
    this.router.navigate(['/domains/detail'], { queryParams: { idOffice: this.idOffice } });
  }

}
