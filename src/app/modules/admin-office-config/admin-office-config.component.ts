import { OfficePermissionService } from './../../shared/services/office-permission.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-admin-office-config',
  templateUrl: './admin-office-config.component.html',
  styleUrls: ['./admin-office-config.component.scss']
})
export class AdminOfficeConfigComponent implements OnInit {

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'configurations',
    collapseble: true,
    initialStateCollapse: false
  };
  cardItemsProperties: ICardItem[];
  idOffice: number;
  propertiesOffice: IOffice;
  displayModeAll = 'grid';
  responsive: boolean;

  constructor(
    private translateSvr: TranslateService,
    private activeRoute: ActivatedRoute,
    private officeSrv: OfficeService,
    private router: Router,
    private responsiveSrv: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    public authSrv: AuthService,
    private messageSrv: MessageService,
    private translateSrv: TranslateService,
    private officePermissionSrv: OfficePermissionService

  ) {
    this.activeRoute.queryParams.subscribe( async({ idOffice }) => {
      this.idOffice = +idOffice;
      await this.resetConfigProperties();
    });
    this.responsiveSrv.observable.subscribe(value => this.responsive = value);
  }

  async ngOnInit(): Promise<void> {
    await this.checkPermissions();
  }

  async checkPermissions() {
    const isAdmin = await this.authSrv.isUserAdmin();
    const editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    if (!isAdmin && !editPermission) {
      this.router.navigate(['/offices']);
    }
  }

  async resetConfigProperties() {
    this.propertiesOffice = undefined;
    await this.getOfficeById();
    await this.verifyIsAdminOrEditPermission();
    this.loadCardItemsProperties();
    this.setBreadcrumb();
  }

  async verifyIsAdminOrEditPermission() {
    const isAdmin = await this.authSrv.isUserAdmin();
    const editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    if (isAdmin || editPermission) {
      return;
    }
    this.messageSrv.add({
      summary: this.translateSrv.instant('error'),
      severity: 'warn',
      detail: this.translateSrv.instant('messages.error.unauthorized')
    });
   return this.router.navigate(['/offices']);
  }

  loadCardItemsProperties() {
    this.cardItemsProperties = [
      {
        typeCardItem: 'listItem',
        iconSvg: true,
        icon: 'app-icon plan-model-solid',
        nameCardItem:  this.translateSvr.instant('planModels'),
        fullNameCardItem: this.translateSvr.instant('planModels'),
        urlCard: '/strategies',
        paramsUrlCard: [ {name: 'idOffice', value: this.idOffice} ]
      },
      {
        typeCardItem: 'listItem',
        icon: 'fas fa-building',
        nameCardItem:  this.translateSvr.instant('organizations'),
        fullNameCardItem: this.translateSvr.instant('organizations'),
        urlCard: '/organizations',
        paramsUrlCard: [ {name: 'idOffice', value: this.idOffice} ]
      },
      {
        typeCardItem: 'listItem',
        icon: 'fas fa-building',
        nameCardItem:  this.translateSvr.instant('domains'),
        fullNameCardItem: this.translateSvr.instant('domains'),
        urlCard: '/domains',
        paramsUrlCard: [ {name: 'idOffice', value: this.idOffice} ]
      },
      {
        typeCardItem: 'listItem',
        icon: 'fas fa-ruler-horizontal',
        nameCardItem:  this.translateSvr.instant('measureUnits'),
        fullNameCardItem: this.translateSvr.instant('measureUnits'),
        urlCard: '/measure-units',
        paramsUrlCard: [ {name: 'idOffice', value: this.idOffice} ]
      },
      {
        typeCardItem: 'listItem',
        icon: 'fas fa-lock',
        nameCardItem:  this.translateSvr.instant('permissions'),
        fullNameCardItem: this.translateSvr.instant('permissions'),
        urlCard: '/offices/permission',
        paramsUrlCard: [ {name: 'idOffice', value: this.idOffice} ]
      },
      {
        typeCardItem: 'listItem',
        icon: 'fas fa-users',
        nameCardItem:  this.translateSvr.instant('persons'),
        fullNameCardItem: this.translateSvr.instant('persons'),
        urlCard: '/persons',
        paramsUrlCard: [ {name: 'idOffice', value: this.idOffice} ]
      },
    ];
  }

  async getOfficeById() {
    const { data, success } = await this.officeSrv.GetById(this.idOffice);
    if (success) {
      this.propertiesOffice = data;
    }
  }

  setBreadcrumb() {
    this.breadcrumbSrv.setMenu([{
      key: 'administration',
      info: this.propertiesOffice?.name,
      tooltip: this.propertiesOffice?.fullName,
      routerLink: [ '/configuration-office' ],
      queryParams: { idOffice: this.idOffice }
    }]);
  }

  handleChangeDisplayMode(event) {
    this.displayModeAll = event.displayMode;
  }
}

