import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
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
    collapseble: false,
    initialStateCollapse: false
  };
  propertiesOffice: IOffice;
  idOffice: number;
  cardItemsProperties: ICardItem[] = [];
  isUserAdmin: boolean;
  editPermission: boolean;
  responsive: boolean;

  constructor(
    private organizationSvr: OrganizationService,
    private officeSrv: OfficeService,
    private translateSvr: TranslateService,
    private activeRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private responsiveSrv: ResponsiveService
  ) {
    this.activeRoute.queryParams.subscribe(({ idOffice }) => this.idOffice = +idOffice);
    this.responsiveSrv.observable.subscribe(value => this.responsive = value);
  }


  async ngOnInit() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    await this.loadPropertiesOrganizations();
    await this.getOfficeById();
    this.breadcrumbSrv.pushMenu({
      key: 'organizations',
      info: this.propertiesOffice?.name,
      tooltip: this.propertiesOffice?.fullName,
      routerLink: [ '/organizations' ],
      queryParams: { idOffice: this.idOffice }
    });
  }

  async getOfficeById() {
    const { data, success } = await this.officeSrv.GetById(this.idOffice);
    if (success) {
      this.propertiesOffice = data;
    }
  }

  async loadPropertiesOrganizations() {
    const { success, data } = await this.organizationSvr.GetAll({ 'id-office': this.idOffice });
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
      itemsProperties.unshift(... data.map(organization => ({
          typeCardItem: 'listItem',
          iconSvg: true,
          icon: IconsEnum.MapMarked,
          nameCardItem: organization.name,
          subtitleCardItem: organization.fullName,
          itemId: organization.id,
          menuItems: [{ label: 'Delete', icon: 'fas fa-trash-alt',
            command: () => this.deleteOrganization(organization),
            disabled: !this.editPermission }] as MenuItem[],
          urlCard: 'organization',
          paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }],
        })
      ));
    }

    this.cardItemsProperties = itemsProperties;
  }

  async deleteOrganization(organization: IOrganization) {
    const { success } = await this.organizationSvr.delete(organization);
    if (success) {
      this.cardItemsProperties = Array.from(this.cardItemsProperties.filter(element => element.itemId !== organization.id));
    }
  };
}
