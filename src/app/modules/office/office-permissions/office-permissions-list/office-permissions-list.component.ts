import { takeUntil } from 'rxjs/operators';
import { CitizenUserService } from './../../../../shared/services/citizen-user.service';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { PropertyTemplateModel } from './../../../../shared/models/PropertyTemplateModel';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IOfficePermission } from 'src/app/shared/interfaces/IOfficePermission';
import { OfficeService } from 'src/app/shared/services/office.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICardItemPermission } from 'src/app/shared/interfaces/ICardItemPermission';
import { TranslateService } from '@ngx-translate/core';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { AuthService } from 'src/app/shared/services/auth.service';
import { FilterService, MessageService } from 'primeng/api';
import { FilterDataviewService } from 'src/app/shared/services/filter-dataview.service';
import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { Subject } from 'rxjs';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';

@Component({
  selector: 'app-office-permissions-list',
  templateUrl: './office-permissions-list.component.html',
  styleUrls: ['./office-permissions-list.component.scss']
})
export class OfficePermissionsListComponent implements OnInit {

  idOffice: number;
  responsive: boolean;
  propertiesOffice: IOffice;
  officePermissions: IOfficePermission[];
  cardItemsOfficePermissions: ICardItemPermission[];
  cardOfficePermissions: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: '',
    collapseble: true,
    initialStateCollapse: false
  };
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  currentUserInfo: IPerson;
  idFilterSelected: number;
  $destroy = new Subject();
  isLoading = false;
  term = '';

  constructor(
    private actRouter: ActivatedRoute,
    private responsiveSrv: ResponsiveService,
    private officeSrv: OfficeService,
    private officePermissionsSrv: OfficePermissionService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private messageSrv: MessageService,
    private filterSrv: FilterDataviewService,
    private router: Router,
    private citizenUserSrv: CitizenUserService,
    private configDataViewSrv: ConfigDataViewService
  ) {
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
    this.citizenUserSrv.loadCitizenUsers();
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idOffice = queryParams.idOffice;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
  }

  async ngOnInit() {
    this.isLoading = true;
    const editPermission = await this.officePermissionsSrv.getPermissions(this.idOffice);
    if (!editPermission) {
      this.router.navigate(['/offices']);
    }
    await this.loadPropertiesOffice();
    await this.loadCurrentUserInfo();
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
        info: 'officePermissions',
        tooltip: this.translateSrv.instant('officePermissions'),
        routerLink: ['/offices', 'permission'],
        queryParams: { idOffice: this.idOffice },
      }
    ]);
  }

  async loadPropertiesOffice() {
    if (this.idOffice) {
      const result = await this.officeSrv.GetById(this.idOffice);
      this.propertiesOffice = result.data;
      await this.loadOfficePermissionsFilters();
      await this.loadOfficePermissions();
    }
  }

  async loadOfficePermissions() {
    const result = await this.officePermissionsSrv.GetAll({ 'id-office': this.idOffice,
      idFilter: this.idFilterSelected,
      term: this.term
    });
    if (result.success) {
      this.officePermissions = result.data;
      this.loadCardItemsOfficePermissions();
      this.isLoading = false;
    }
  }

  async loadOfficePermissionsFilters() {
    const result = await this.filterSrv.getAllFilters('office-permissions');
    if (result.success && result.data.length > 0) {
      const filterDefault = result.data.find(filter => !!filter.favorite);
      this.idFilterSelected = filterDefault ? filterDefault.id : undefined;
      this.cardOfficePermissions.filters = result.data;
    }
    this.cardOfficePermissions.showFilters = true;
  }

  loadCardItemsOfficePermissions() {
    if (this.officePermissions) {
      this.cardItemsOfficePermissions = this.officePermissions.map(p => {
        const fullName = p.person.name.split(' ');
        const name = fullName.length > 1 ? fullName[0] + ' ' + fullName[1] : fullName[0];
        return {
          typeCardItem: 'listItem',
          fullNameUser: p.person.fullName,
          titleCardItem: name,
          roleDescription: (p.permissions.filter(r => r.level === 'EDIT').length > 0
            ? this.translateSrv.instant('edit')
            : this.translateSrv.instant('read')),
          menuItems: [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteOfficePermission(p)
          }],
          itemId: p.person.id,
          urlCard: '/offices/permission/detail',
          paramsUrlCard: [
            { name: 'idOffice', value: this.idOffice },
            { name: 'key', value: p.person.key }
          ]
        };
      });
    }
    this.cardItemsOfficePermissions.push(
      {
        typeCardItem: 'newCardItem',
        urlCard: '/offices/permission/detail',
        paramsUrlCard: [
          { name: 'idOffice', value: this.idOffice }
        ]
      }
    );
    this.totalRecords = this.cardItemsOfficePermissions && this.cardItemsOfficePermissions.length;
    this.cardOfficePermissions.showCreateNemElementButton = true;
  }

  async loadCurrentUserInfo() {
    this.currentUserInfo = await this.authSrv.getInfoPerson();
  }

  handleCreateNewOfficePermission() {
    this.router.navigate(['/offices/permission/detail'], { queryParams: { idOffice: this.idOffice } });
  }

  async deleteOfficePermission(permission: IOfficePermission) {
    if (permission.person.id === this.currentUserInfo.id) {
      return this.messageSrv.add({
        summary: this.translateSrv.instant('error'),
        severity: 'warn',
        detail: this.translateSrv.instant('messages.error.permission.delete.relationship.error')
      });
    }
    const result = await this.officePermissionsSrv.deletePermission({ key: permission.person.key, 'id-office': permission.idOffice });
    if (result.success) {
      const permissionIndex = this.cardItemsOfficePermissions.findIndex(p => p.itemId === permission.person.id);
      if (permissionIndex > -1) {
        this.cardItemsOfficePermissions.splice(permissionIndex, 1);
        this.cardItemsOfficePermissions = Array.from(this.cardItemsOfficePermissions);
        this.totalRecords = this.cardItemsOfficePermissions && this.cardItemsOfficePermissions.length;
      }
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
          id: idFilter,
          entityName: 'office-permissions'
        }
      });
    }
  }

  async handleSelectedFilter(event) {
    const idFilter = event.filter;
    this.idFilterSelected = idFilter;
    await this.loadOfficePermissions();
  }

  async handleSearchText(event) {
    this.term = event;
    await this.loadOfficePermissions();
  }

  handleNewFilter() {
    const filterProperties = this.loadFilterPropertiesList();
    this.filterSrv.setFilterProperties(filterProperties);
    this.setBreadcrumbStorage();
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: 'office-permissions'
      }
    });
  }

  loadFilterPropertiesList() {
    const listProperties = FilterDataviewPropertiesEntity.officePermissions;
    const filterPropertiesList = listProperties.map(prop => {
      const property: IFilterProperty = {
        type: prop.type,
        label: prop.label,
        name: prop.apiValue,
        active: true,
        possibleValues: prop.possibleValues
      }
      return property;
    });
    return filterPropertiesList;
  }

  setBreadcrumbStorage() {
    this.breadcrumbSrv.setBreadcrumbStorage([
      {
        key: 'officePermissions',
        routerLink: ['/offices', 'permission'],
        queryParams: { idOffice: this.idOffice },
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName
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
  }

}
