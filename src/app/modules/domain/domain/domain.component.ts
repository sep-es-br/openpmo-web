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
import { ILocality } from 'src/app/shared/interfaces/ILocality';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { DomainService } from 'src/app/shared/services/domain.service';
import { IDomain } from 'src/app/shared/interfaces/IDomain';
import { LocalityService } from 'src/app/shared/services/locality.service';
import { TypeLocality } from 'src/app/shared/enums/TypeLocality';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { OfficeService } from 'src/app/shared/services/office.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';

@Component({
  selector: 'app-domain',
  templateUrl: './domain.component.html',
  styleUrls: ['./domain.component.scss']
})
export class DomainComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  propertiesDomain: IDomain;
  responsive = false;
  formDomain: FormGroup;
  idDomain: number;
  idOffice: number;
  planModelsOfficeList: IPlanModel[];
  cardProperties: ICard;
  cardLocalities: ICard;
  localities: ILocality[];
  cardItemsLocalities: ICardItem[];
  cardItemPlanMenu: MenuItem[];
  $destroy = new Subject();
  isUserAdmin: boolean;
  editPermission: boolean;
  permissionsOffices: IOffice[];

  constructor(
    private formBuilder: FormBuilder,
    private domainSvr: DomainService,
    private localitySvr: LocalityService,
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private responsiveSvr: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private officeSrv: OfficeService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private messageSrv: MessageService
  ) {
    this.activeRoute.queryParams.subscribe(({ id, idOffice }) => {
      this.idDomain = +id;
      this.idOffice = +idOffice;
    });
    this.formDomain = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: ['', Validators.required]
    });
    this.formDomain.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formDomain.dirty))
      .subscribe(() => this.saveButton.showButton());
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    await this.loadCards();
    await this.loadPropertiesDomain();
    this.breadcrumbSrv.pushMenu({
      key: 'domain',
      info: this.propertiesDomain?.name,
      routerLink: ['/domains', 'detail'],
      queryParams: { id: this.idDomain, idOffice: this.idOffice }
    });
  }

  loadCards() {
    this.cardProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: this.idDomain ? true : false
    };
    this.cardLocalities = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'localities',
      collapseble: true,
      initialStateCollapse: false
    };
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
    }
  }

  async loadLocalities() {
    const { success, data } = await this.localitySvr.getLocalitiesFirstLevel({ 'id-domain': this.idDomain });
    if (success) {
      this.localities = data;
      this.loadCardItemsLocalities();
    }
  }

  navigateToPage(type: string) {
    this.router.navigate(['/domains/locality'], { queryParams: { type, idDomain: this.idDomain } });
  }

  loadCardItemsLocalities() {
    const itemsLocalities: ICardItem[] = this.editPermission ? [
      {
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        iconMenuItems: [
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
        ],
        urlCard: this.localities.length > 0 ? '/domains/locality' : undefined,
        paramsUrlCard: [
          { name: 'idDomain', value: this.idDomain },
          { name: 'idOffice', value: this.idOffice},
          { name: 'type', value: this.localities[0] ? this.localities[0].type : '' }
        ]
      }
    ] : [];
    if (this.localities) {
      itemsLocalities.unshift(...this.localities.map(locality => (
        {
          typeCardItem: 'listItem',
          iconSvg: true,
          icon: IconsEnum.MapMarked,
          nameCardItem: locality.name,
          fullNameCardItem: locality.fullName,
          itemId: locality.id,
          menuItems: [
            {
              label: this.translateSrv.instant('delete'),
              icon: 'fas fa-trash-alt',
              command: () => this.deleteLocality(locality),
              disabled: !this.editPermission
            },
          ] as MenuItem[],
          urlCard: '/domains/locality',
          paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }]
        }
      )));
    }
    this.cardItemsLocalities = itemsLocalities;
  }

  async deleteLocality(locality: ILocality) {
    const { success } = await this.localitySvr.delete(locality);
    if (success) {
      const localityIndex = this.cardItemsLocalities.findIndex(element => element.itemId === locality.id);
      if (localityIndex > -1) {
        this.cardItemsLocalities.splice(localityIndex, 1);
        this.cardItemsLocalities = Array.from(this.cardItemsLocalities);
      }
    }
  }

  async handleOnSubmit() {
    if (this.propertiesDomain) {
      const { success } = await this.domainSvr.put({ ...this.formDomain.value, id: this.idDomain });

      if (success) {
        await this.loadPropertiesDomain();
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
      }
    } else {
      const { success, data } = await this.domainSvr.post({ ...this.formDomain.value, idOffice: this.idOffice });
      if (success) {
        this.idDomain = data.id;
        await this.loadPropertiesDomain();
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
        this.breadcrumbSrv.updateLastCrumb({
          key: 'domain',
          routerLink: ['/domains', 'detail'],
          queryParams: { id: this.idDomain, idOffice: this.idOffice },
          info: this.propertiesDomain?.name
        });
      }
    }
  }

}
