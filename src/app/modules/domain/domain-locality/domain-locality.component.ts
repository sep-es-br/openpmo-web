import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MenuItem, MessageService } from 'primeng/api';

import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IPlanModel } from 'src/app/shared/interfaces/IPlanModel';
import { ILocality, ILocalityList } from 'src/app/shared/interfaces/ILocality';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { LocalityService } from 'src/app/shared/services/locality.service';
import { TypeLocality } from 'src/app/shared/enums/TypeLocality';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IDomain } from 'src/app/shared/interfaces/IDomain';
import { OfficeService } from 'src/app/shared/services/office.service';
import { DomainService } from 'src/app/shared/services/domain.service';
import { FilterDataviewService } from 'src/app/shared/services/filter-dataview.service';
import { FilterDataviewPropertiesEntity } from 'src/app/shared/constants/filterDataviewPropertiesEntity';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';

@Component({
  selector: 'app-domain-locality',
  templateUrl: './domain-locality.component.html',
  styleUrls: ['./domain-locality.component.scss']
})
export class DomainLocalityComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  propertiesLocality: ILocalityList;
  responsive = false;
  formLocality: FormGroup;
  idLocality: number;
  idDomain: number;
  propertiesDomain: IDomain;
  idParent: number;
  idOffice: number;
  propertiesOffice: IOffice;
  type: string;
  planModelsOfficeList: IPlanModel[];
  cardProperties: ICard;
  cardLocalities: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'localities',
    collapseble: true,
    initialStateCollapse: false
  };
  childrenLocalities: ILocality[];
  cardItemsChildrenLocalities: ICardItem[];
  cardItemPlanMenu: MenuItem[];
  $destroy = new Subject();
  isUserAdmin: boolean;
  editPermission: boolean;
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  idFilterSelected: number;

  constructor(
    private formBuilder: FormBuilder,
    private localitySvr: LocalityService,
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private responsiveSvr: ResponsiveService,
    private router: Router,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private messageSrv: MessageService,
    private officeSrv: OfficeService,
    private domainSrv: DomainService,
    private filterSrv: FilterDataviewService
  ) {
    this.activeRoute.queryParams.subscribe(async({ id, idOffice, idDomain, type, idParent }) => {
      this.idLocality = +id;
      this.idOffice = +idOffice;
      this.idDomain = +idDomain;
      this.type = type;
      this.idParent = +idParent;
      this.saveButton?.hideButton();
      this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
      await this.loadPropertiesLocality();
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
        {
          key: 'domain',
          info: this.propertiesDomain?.name,
          tooltip: this.propertiesDomain?.fullName,
          routerLink: ['/domains', 'detail'],
          queryParams: { id: this.idDomain, idOffice: this.idOffice }
        },
        ... await this.getBreadcrumbs()
      ]);
    });
    this.formLocality = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: ['', Validators.required],
      latitude: null,
      longitude: null,
    });
    this.formLocality.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formLocality.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formLocality.dirty))
      .subscribe(() => this.saveButton.showButton());
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  async getBreadcrumbs() {
    if (this.idLocality || this.idParent) {
      const { success, data } = await this.breadcrumbSrv.getBreadcrumbLocality(this.idLocality || this.idParent);
      const { idOffice, idDomain, type, idParent } = this;
      return success
        ? [
          ...data.map((l, i) => ({
            key: l.type.toLowerCase() === 'root' ? 'localityRoot' : l.type.toLowerCase(),
            info: l?.name,
            tooltip: l?.fullName,
            routerLink: ['/domains', 'locality'],
            queryParams: { id: l.id, idOffice, idDomain, type: l.type, idParent: i ? data[i - 1].id : '' }
          })),
          ... !this.idLocality
            ? [{
              key: this.type.toLowerCase(),
              routerLink: ['/domains', 'locality'],
              queryParams: { idOffice, idDomain, type, idParent }
            }]
            : []
        ]
        : [];
    } else {
      return [
        {
          key: this.type.toLowerCase(),
          routerLink: ['/domains', 'locality'],
          queryParams: { idOffice: this.idOffice, idDomain: this.idDomain, type: this.type }
        }
      ];
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    if (!this.isUserAdmin && !this.editPermission) {
      this.router.navigate(['/offices']);
    }
    await this.loadCards();
  }

  handleChangeCollapseExpandPanel(event) {
    this.collapsePanelsStatus = event.mode === 'collapse' ? true : false;
    this.cardProperties = Object.assign({}, {
      ...this.cardProperties,
      initialStateCollapse: this.collapsePanelsStatus
    });
    this.cardLocalities = Object.assign({}, {
      ...this.cardLocalities,
      initialStateCollapse: this.collapsePanelsStatus
    });
  }

  handleChangeDisplayMode(event) {
    this.displayModeAll = event.displayMode;
  }

  handleChangePageSize(event) {
    this.pageSize = event.pageSize;
  }

  async loadCards() {
    this.cardProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: !!this.idLocality
    };
  }

  async loadPropertiesLocality(filterSelected?: boolean) {
    if (!filterSelected) {
      await this.loadFiltersLocalities();
    }
    if (this.idLocality) {
      const { success, data } =
        await this.localitySvr.getLocalityById(this.idLocality, { idFilter: this.idFilterSelected });
      if (success) {
        this.propertiesLocality = data as ILocalityList;
        this.formLocality.reset(Object.keys(this.formLocality.controls).reduce((a, key) => (a[key] = data[key] || '', a), {}));
        if (!this.editPermission) {
          this.formLocality.disable();
        }
      }
      this.loadCardItemsChildrenLocalities();
    } else {
      this.propertiesLocality = undefined;
      this.formLocality?.reset();
    }
    if (this.idOffice) {
      const { success, data } = await this.officeSrv.GetById(this.idOffice);
      if (success) {
        this.propertiesOffice = data;
      }
    }
    this.idDomain = this.idDomain ||
      (this.propertiesLocality?.domain
        ? this.propertiesLocality?.domain?.id
        : (this.propertiesLocality?.domainRoot && this.propertiesLocality?.domainRoot?.id));

    if (this.idDomain) {
      const { success, data } = await this.domainSrv.GetById(this.idDomain);
      if (success) {
        this.propertiesDomain = data;
      }
    }
    if (this.cardProperties) {
      this.cardProperties.initialStateCollapse = !!this.idLocality;
    }
  }

  mirrorNameToFullname() {
    if (!this.formLocality.controls.fullName.dirty) {
      this.formLocality.controls.fullName.setValue(this.formLocality.controls.name.value);
    }
  }

  navigateToPage(type: string) {
    this.router.navigate(['/domains/locality'],
      {
        queryParams: {
          type,
          idParent: this.idLocality,
          idDomain: this.propertiesLocality.domain ? this.propertiesLocality.domain.id : this.propertiesLocality.domainRoot.id,
          idOffice: this.idOffice
        },
      }
    );
  }

  loadCardItemsChildrenLocalities() {
    const itemsChildrenLocalities: ICardItem[] = this.editPermission ? [
      {
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        iconMenuItems: !this.propertiesLocality?.children ? [
          {
            label: this.translateSrv.instant(TypeLocality.Country),
            command: () => this.navigateToPage(TypeLocality.Country.toUpperCase())
          },
          {
            label: this.translateSrv.instant(TypeLocality.Region),
            command: () => this.navigateToPage(TypeLocality.Region.toUpperCase())
          },
          {
            label: this.translateSrv.instant(TypeLocality.State),
            command: () => this.navigateToPage(TypeLocality.State.toUpperCase())
          },
          {
            label: this.translateSrv.instant(TypeLocality.City),
            command: () => this.navigateToPage(TypeLocality.City.toUpperCase())
          },
          {
            label: this.translateSrv.instant(TypeLocality.District),
            command: () => this.navigateToPage(TypeLocality.District.toUpperCase())
          },
        ] : undefined,
        urlCard: this.propertiesLocality?.children ? '/domains/locality' : undefined,
        paramsUrlCard: [
          { name: 'idDomain',
            value: (this.propertiesLocality?.domain
                    ? this.propertiesLocality?.domain?.id
                    : this.propertiesLocality?.domainRoot && this.propertiesLocality?.domainRoot?.id) },
          { name: 'idParent', value: this.idLocality },
          { name: 'idOffice', value: this.idOffice },
          { name: 'type', value: this.propertiesLocality?.children ? this.propertiesLocality?.children[0]?.type : undefined }
        ]
      }
    ] : [];
    this.cardLocalities.showCreateNemElementButton = this.editPermission && this.propertiesLocality
      && this.propertiesLocality.children ? true : false;
    if (this.propertiesLocality?.children) {
      itemsChildrenLocalities.unshift(...this.propertiesLocality.children.map(locality => (
        {
          typeCardItem: 'listItem',
          iconSvg: true,
          icon: IconsEnum.MapMarked,
          nameCardItem: locality.name,
          fullNameCardItem: locality.fullName,
          subtitleCardItem: this.translateSrv.instant(locality.type.toLocaleLowerCase()),
          itemId: locality.id,
          menuItems: [
            {
              label: this.translateSrv.instant('delete'),
              icon: 'fas fa-trash-alt',
              command: () => this.deleteLocality(locality as ILocality),
              disabled: !this.editPermission
            },
          ] as MenuItem[],
          urlCard: '/domains/locality',
          paramsUrlCard: [
            { name: 'idDomain',
              value: (this.propertiesLocality?.domain
                      ? this.propertiesLocality?.domain?.id
                      : this.propertiesLocality?.domainRoot?.id) },
            { name: 'idParent', value: this.idLocality },
            { name: 'idOffice', value: this.idOffice },
            { name: 'type', value: this.propertiesLocality?.children ? this.propertiesLocality.children[0].type : undefined }
          ]
        }
      )));
    }
    this.cardItemsChildrenLocalities = itemsChildrenLocalities;
    this.totalRecords = this.cardItemsChildrenLocalities && this.cardItemsChildrenLocalities.length;
  }

  async deleteLocality(locality: ILocality) {
    const { success } = await this.localitySvr.delete(locality);
    if (success) {
      this.cardItemsChildrenLocalities = Array.from(this.cardItemsChildrenLocalities.filter(element => element.itemId !== locality.id));
      this.totalRecords = this.cardItemsChildrenLocalities && this.cardItemsChildrenLocalities.length;
    }
  }

  createNewLocality() {
    this.router.navigate(['/domains/locality'], {
      queryParams: {
        idDomain: this.propertiesLocality?.domain ? this.propertiesLocality?.domain?.id : this.propertiesLocality?.domainRoot?.id,
        idParent: this.idLocality,
        idOffice: this.idOffice,
        type: this.propertiesLocality?.children ? this.propertiesLocality.children[0].type : undefined
      }
    });
  }

  async handleOnSubmit() {
    const idDomain = this.propertiesLocality?.domain
                      ? this.propertiesLocality?.domain?.id
                      : (this.propertiesLocality?.domainRoot && this.propertiesLocality?.domainRoot?.id);
    delete this.propertiesLocality?.domain;
    const { success, data } = this.propertiesLocality
      ? await this.localitySvr.put({ ...this.propertiesLocality, ...this.formLocality.value, idDomain })
      : await this.localitySvr.post(
        {
          ...this.formLocality.value,
          idDomain: this.idDomain,
          idParent: this.idParent,
          type: this.type
        }
      );
    if (success) {
      this.idLocality = data.id;
      await this.loadPropertiesLocality();
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.breadcrumbSrv.updateLastCrumb({
        key: 'locality',
        routerLink: ['/domains', 'locality'],
        queryParams: { id: this.idLocality, idOffice: this.idOffice },
        info: this.propertiesLocality?.name,
        tooltip: this.propertiesLocality?.fullName
      });
    }
  }

  async loadFiltersLocalities() {
    const result = await this.filterSrv.getAllFilters('localities');
    if (result.success && result.data.length > 0) {
      const filterDefault = result.data.find(dataFilter => !!dataFilter.favorite);
      this.idFilterSelected = filterDefault ? filterDefault.id : undefined;
      this.cardLocalities.filters = result.data;
    }
    this.cardLocalities.showFilters = true;
  }

  async handleEditFilter(event) {
    const idFilter = event.filter;
    if (idFilter) {
      const filterProperties = this.loadFilterPropertiesList();
      this.filterSrv.setFilterProperties(filterProperties);
      await this.setBreadcrumbStorage();
      this.router.navigate(['/filter-dataview'], {
        queryParams: {
          id: idFilter,
          entityName: 'localities'
        }
      });
    }
  }

  async handleSelectedFilter(event) {
    const idFilter = event.filter;
    this.idFilterSelected = idFilter;
    const filterSelected = idFilter !== null;
    await this.loadPropertiesLocality(filterSelected);
  }

  async handleNewFilter() {
    const filterProperties = this.loadFilterPropertiesList();
    this.filterSrv.setFilterProperties(filterProperties);
    await this.setBreadcrumbStorage();
    this.router.navigate(['/filter-dataview'], {
      queryParams: {
        entityName: 'localities'
      }
    });
  }

  loadFilterPropertiesList() {
    const listProperties = FilterDataviewPropertiesEntity.localities;
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

  async setBreadcrumbStorage() {
    this.breadcrumbSrv.setBreadcrumbStorage([
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
      {
        key: 'domain',
        info: this.propertiesDomain?.name,
        tooltip: this.propertiesDomain?.fullName,
        routerLink: ['/domains', 'detail'],
        queryParams: { id: this.idDomain, idOffice: this.idOffice }
      },
      ... await this.getBreadcrumbs(),
      ...[{
        key: 'filter',
        routerLink: ['/filter-dataview']
      }]
    ]);
  }


}
