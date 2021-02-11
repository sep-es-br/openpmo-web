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
  idParent: number;
  idOffice: number;
  type: string;
  planModelsOfficeList: IPlanModel[];
  cardProperties: ICard;
  cardLocalities: ICard;
  childrenLocalities: ILocality[];
  cardItemsChildrenLocalities: ICardItem[];
  cardItemPlanMenu: MenuItem[];
  $destroy = new Subject();
  isUserAdmin: boolean;
  editPermission: boolean;

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
    private messageSrv: MessageService
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
      this.breadcrumbSrv.pushMenu({
        key: 'locality',
        info: this.propertiesLocality?.name,
        tooltip: this.propertiesLocality?.fullName,
        routerLink: [ '/domains', 'locality' ],
        queryParams: { id, idOffice, idDomain, type, idParent }
      });
    });
    this.formLocality = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: ['', Validators.required],
      latitude: null,
      longitude: null,
    });
    this.formLocality.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formLocality.dirty))
      .subscribe(() => this.saveButton.showButton());
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.loadCards();
  }

  loadCards() {
    this.cardProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: !!this.idLocality
    };
    this.cardLocalities = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'localities',
      collapseble: true,
      initialStateCollapse: false
    };
  }

  async loadPropertiesLocality() {
    if (this.idLocality) {
      const { success, data } = await this.localitySvr.GetById(this.idLocality);
      if (success) {
        this.propertiesLocality = data as ILocalityList;
        this.formLocality.reset();
        this.formLocality.setValue(
          Object.keys(this.formLocality.controls).reduce(( a, key ) => ( a[key] = data[key] || '', a ), { })
        );
        if (!this.editPermission) {
          this.formLocality.disable();
        }
      }
      this.loadCardItemsChildrenLocalities();
    } else {
      this.propertiesLocality = undefined;
      this.formLocality?.reset();
    }
    if (this.cardProperties) {
      this.cardProperties.initialStateCollapse = !!this.idLocality;
    }
  }

  navigateToPage(type: string) {
    this.router.navigate(['/domains/locality'],
      {
        queryParams: {
          type,
          idParent: this.idLocality,
          idDomain: this.propertiesLocality.domain.id,
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
          { name: 'idDomain', value: this.propertiesLocality.domain.id },
          { name: 'idParent', value: this.idLocality },
          { name: 'idOffice', value: this.idOffice},
          { name: 'type', value: this.propertiesLocality?.children ? this.propertiesLocality.children[0].type : undefined }
        ]
      }
    ] : [];
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
            { name: 'idDomain', value: this.propertiesLocality.domain.id },
            { name: 'idParent', value: this.idLocality },
            { name: 'idOffice', value: this.idOffice},
            { name: 'type', value: this.propertiesLocality?.children ? this.propertiesLocality.children[0].type : undefined }
          ]
        }
      )));
    }
    this.cardItemsChildrenLocalities = itemsChildrenLocalities;
  }

  async deleteLocality(locality: ILocality) {
    const { success } = await this.localitySvr.delete(locality);
    if (success) {
      this.cardItemsChildrenLocalities = Array.from(this.cardItemsChildrenLocalities.filter(element => element.itemId !== locality.id));
    }
  }

  async handleOnSubmit() {
    const idDomain = this.propertiesLocality?.domain?.id;
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

}
