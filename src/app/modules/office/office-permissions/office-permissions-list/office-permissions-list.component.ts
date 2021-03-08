import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IOfficePermission } from 'src/app/shared/interfaces/IOfficePermission';
import { OfficeService } from 'src/app/shared/services/office.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICardItemPermission } from 'src/app/shared/interfaces/ICardItemPermission';
import { TranslateService } from '@ngx-translate/core';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';

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
    cardTitle: 'permissions',
    collapseble: true,
    initialStateCollapse: false
  };

  constructor(
    private actRouter: ActivatedRoute,
    private responsiveSrv: ResponsiveService,
    private officeSrv: OfficeService,
    private officePermissionsSrv: OfficePermissionService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService

  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idOffice = queryParams.idOffice;
    });
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
  }

  async ngOnInit() {
    await this.loadPropertiesOffice();
    this.breadcrumbSrv.setMenu([
      {
        key: 'officePermissions',
        routerLink: ['/offices', 'permission'],
        queryParams: { idOffice: this.idOffice },
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName
      }
    ]);
  }

  async loadPropertiesOffice() {
    if (this.idOffice) {
      const result = await this.officeSrv.GetById(this.idOffice);
      this.propertiesOffice = result.data;
      this.loadOfficePermissions();
    }
  }

  async loadOfficePermissions() {
    const result = await this.officePermissionsSrv.GetAll({'id-office': this.idOffice});
    if (result.success) {
      this.officePermissions = result.data;
      this.loadCardItemsOfficePermissions();
    }
  }

  loadCardItemsOfficePermissions() {
    if (this.officePermissions) {
      this.cardItemsOfficePermissions = this.officePermissions.map(p => {
        const fullName = p.person.name.split(' ');
        const name = fullName.length > 1 ? fullName[0] + ' ' + fullName[1] : fullName[0];
      return  {
          typeCardItem: 'listItem',
          titleCardItem: name,
          roleDescription: (p.permissions.filter( r => r.level === 'EDIT').length > 0
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
            {name: 'idOffice', value: this.idOffice},
            {name: 'email', value: p.person.email}
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
  }

  async deleteOfficePermission(permission: IOfficePermission) {
    const result = await this.officePermissionsSrv.deletePermission({email: permission.person.email, 'id-office': permission.idOffice});
    if (result.success) {
      const permissionIndex = this.cardItemsOfficePermissions.findIndex( p => p.itemId === permission.person.id);
      if (permissionIndex > -1) {
        this.cardItemsOfficePermissions.splice(permissionIndex,1);
        this.cardItemsOfficePermissions = Array.from(this.cardItemsOfficePermissions);
      }
    }
  }
}
