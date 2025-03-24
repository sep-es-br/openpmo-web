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
import { ILocality, ILocalityRoot } from 'src/app/shared/interfaces/ILocality';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { DomainService } from 'src/app/shared/services/domain.service';
import { IDomain } from 'src/app/shared/interfaces/IDomain';
import { TypeLocality } from 'src/app/shared/enums/TypeLocality';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { OfficeService } from 'src/app/shared/services/office.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

@Component({
  selector: 'app-domain',
  templateUrl: './domain.component.html',
  styleUrls: ['./domain.component.scss']
})
export class DomainComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

  propertiesDomain: IDomain;
  responsive = false;
  formDomain: FormGroup;
  formLocalityRoot: FormGroup;
  idDomain: number;
  idOffice: number;
  planModelsOfficeList: IPlanModel[];
  cardProperties: ICard;
  cardLocalityRoot: ICard;
  localities: ILocality[];
  cardItemsLocalities: ICardItem[];
  cardItemPlanMenu: MenuItem[];
  $destroy = new Subject();
  isUserAdmin: boolean;
  editPermission: boolean;
  permissionsOffices: IOffice[];
  propertiesOffice: IOffice;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  idFilterSelected: number;
  isLoading = false;
  formIsSaving = false

  constructor(
    private formBuilder: FormBuilder,
    private domainSvr: DomainService,
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private responsiveSvr: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private officeSrv: OfficeService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private messageSrv: MessageService,
    private configDataViewSrv: ConfigDataViewService
  ) {
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
    });
    this.activeRoute.queryParams.subscribe(({ id, idOffice }) => {
      this.idDomain = +id;
      this.idOffice = +idOffice;
    });
    this.formDomain = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: ['', Validators.required],
    });
    this.formLocalityRoot = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: ['', Validators.required],
      latitude: null,
      longitude: null,
      type: TypeLocality.Root.toLocaleUpperCase(),
    });
    this.formDomain.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formLocalityRoot.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formDomain.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formDomain.dirty && this.formDomain.valid &&
        (!this.propertiesDomain || !this.propertiesDomain.localityRoot ? this.formLocalityRoot.valid : true)))
      .subscribe(() => { this.saveButton.showButton(); });
    this.formDomain.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formDomain.dirty))
      .subscribe(() => { this.cancelButton.showButton() });
    this.formLocalityRoot.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formDomain.valid && this.formLocalityRoot.dirty
        && this.formLocalityRoot.valid))
      .subscribe(() => this.saveButton.showButton());
    this.formLocalityRoot.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formLocalityRoot.dirty))
      .subscribe(() => this.cancelButton.showButton());
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.isLoading = true;
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    if (!this.isUserAdmin && !this.editPermission) {
      this.router.navigate(['/offices']);
    }
    await this.loadCards();
    await this.loadPropertiesDomain();
    await this.loadPropertiesOffice();
    this.breadcrumbSrv.setMenu([
      {
        key: 'administration',
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName,
        routerLink: ['/configuration-office'],
        queryParams: { idOffice: this.idOffice },
        admin: true
      },
      {
        key: 'configuration',
        info: 'domains',
        tooltip: this.translateSrv.instant('domains'),
        routerLink: ['/domains'],
        queryParams: { idOffice: this.idOffice },
        admin: true
      },
      {
        key: 'domain',
        info: this.propertiesDomain?.name,
        tooltip: this.propertiesDomain?.fullName,
        routerLink: ['/domains', 'detail'],
        queryParams: { id: this.idDomain, idOffice: this.idOffice },
        admin: true
      }
    ]);
  }

  async loadCards() {
    this.cardProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: false,
      initialStateCollapse: false
    };
    this.cardLocalityRoot = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'localityRoot',
      collapseble: false,
      initialStateCollapse: false,
      showCreateNemElementButton: false,
      showFilters: false
    };
  }

  mirrorDomainNameToFullname() {
    if (!this.formDomain.controls.fullName.dirty) {
      this.formDomain.controls.fullName.setValue(this.formDomain.controls.name.value);
    }
  }

  mirrorLocRootNameToFullname() {
    if (!this.formLocalityRoot.controls.fullName.dirty) {
      this.formLocalityRoot.controls.fullName.setValue(this.formLocalityRoot.controls.name.value);
    }
  }

  async loadPropertiesDomain() {
    if (this.idDomain) {
      const { data, success } = await this.domainSvr.GetById(this.idDomain);
      if (success) {
        this.propertiesDomain = data;
        this.formDomain.reset({
          name: this.propertiesDomain.name,
          fullName: this.propertiesDomain.fullName
        });
        if (!this.editPermission) {
          this.formDomain.disable();
        }
        await this.loadLocalities();
      }
    } else {
      this.isLoading = false;
    }
  }

  async loadPropertiesOffice() {
    if (this.idOffice) {
      this.propertiesOffice = await this.officeSrv.getCurrentOffice(this.idOffice);
    }
  }

  async loadLocalities() {
    const localities: ILocalityRoot[] = [];
    if (this.propertiesDomain && this.propertiesDomain.localityRoot) {
      localities.push(this.propertiesDomain.localityRoot);
    }
    this.localities = localities;
    this.isLoading = false;
    this.loadCardItemsLocalities();
  }

  navigateToPage(type: string) {
    this.router.navigate(['/domains/locality'], { queryParams: { type, idDomain: this.idDomain, idOffice: this.idOffice } });
  }

  loadCardItemsLocalities() {
    const itemsLocalities: ICardItem[] = [];
    if (this.localities) {
      itemsLocalities.unshift(...this.localities.map(locality => (
        {
          typeCardItem: 'listItem',
          iconSvg: true,
          icon: IconsEnum.MapMarked,
          nameCardItem: locality.name,
          fullNameCardItem: locality.fullName,
          itemId: locality.id,
          urlCard: '/domains/locality',
          paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }]
        }
      )));
    }
    this.cardItemsLocalities = itemsLocalities;
    this.totalRecords = this.cardItemsLocalities && this.cardItemsLocalities.length;
  }

  async handleOnSubmit() {
    this.cancelButton.hideButton();
    this.formIsSaving = true;
    const { success, data } = this.propertiesDomain
      ? await this.domainSvr.put({
        ...this.formDomain.value, id: this.idDomain,
        localityRoot: this.propertiesDomain.localityRoot ? this.propertiesDomain.localityRoot : this.formLocalityRoot.value
      })
      : await this.domainSvr.post({ ...this.formDomain.value, idOffice: this.idOffice, localityRoot: this.formLocalityRoot.value });

    if (success) {
      this.formIsSaving = false;
      if (!this.idDomain) {
        this.idDomain = data.id;
        this.propertiesDomain = {
          ...this.formDomain.value, idOffice: this.idOffice, localityRoot: this.formLocalityRoot.value
        };
        await this.loadLocalities();
      }
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.breadcrumbSrv.updateLastCrumb({
        key: 'domain',
        routerLink: ['/domains', 'detail'],
        queryParams: { id: this.idDomain, idOffice: this.idOffice },
        info: this.propertiesDomain?.name,
        tooltip: this.propertiesDomain?.fullName
      });

    }
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    if (this.idDomain) {
      this.formDomain.reset({ name: this.propertiesDomain.name, fullName: this.propertiesDomain.fullName });
    } else {
      this.formDomain.reset();
    }
  }

}
