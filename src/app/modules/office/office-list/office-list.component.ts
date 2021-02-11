import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';

import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { AuthService } from 'src/app/shared/services/auth.service';
import { OfficeService } from 'src/app/shared/services/office.service';

@Component({
  selector: 'app-office-list',
  templateUrl: './office-list.component.html',
  styleUrls: ['./office-list.component.scss']
})
export class OfficeListComponent implements OnInit {

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'offices',
    collapseble: false,
    initialStateCollapse: false
  };
  cardItemsProperties: ICardItem[];
  isUserAdmin: boolean;
  isListEmpty = false;

  constructor(
    private officeSvr: OfficeService,
    private router: Router,
    private translateSvr: TranslateService,
    private authSrv: AuthService
  ) {

  }

  async ngOnInit() {
    this.loadPropertiesOffice();
  }

  async loadPropertiesOffice() {
    const { success, data } = await this.officeSvr.GetAll();
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    const itemsProperties: ICardItem[] = this.isUserAdmin ? [
      {
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        urlCard: '/offices/office',
      }
    ] : [];
    if (success) {
      this.isListEmpty = !data.length;
      itemsProperties.unshift(... data.map( office => {
        const editPermissions = (!this.isUserAdmin && office.permissions) && office.permissions.filter( p => p.level === 'EDIT');
        const editPermission =  this.isUserAdmin ? true : (editPermissions && editPermissions.length > 0 ? true : false);
        const officeCardItem =  {
          typeCardItem: 'listItem',
          iconSvg: true,
          icon: IconsEnum.Offices,
          nameCardItem: office.name,
          fullNameCardItem: office.fullName,
          itemId: office.id,
          menuItems: [
            { label: this.translateSvr.instant('strategies'), icon: 'app-icon plan-model-solid',
              command: () => this.navigateToPage('strategies', office.id) },
            { label: this.translateSvr.instant('organizations'), icon: 'fas fa-building',
              command: () => this.navigateToPage('organizations', office.id) },
            { label: this.translateSvr.instant('domains'), icon: 'fas fa-map-marked-alt',
              command: () => this.navigateToPage('domains', office.id) },
            { label: this.translateSvr.instant('measureUnits'), icon: 'fas fa-ruler-horizontal',
              command: () => this.navigateToPage('measure-units', office.id) },
            { label: this.translateSvr.instant('permissions'), icon: 'fas fa-user-lock',
              command: () => this.navigateToPage('offices/permission', office.id), disabled: !editPermission },
            { label: this.translateSvr.instant('delete'), icon: 'fas fa-trash-alt',
              command: async() => await this.deleteOffice(office), disabled: !editPermission }
          ] as MenuItem[],
          urlCard: 'office',
        };
        return officeCardItem;
      }));
    }

    this.cardItemsProperties = itemsProperties;
  }

 async deleteOffice(office: IOffice) {
    const { success } = await this.officeSvr.delete(office);
    if (success) {
      this.cardItemsProperties = Array.from(this.cardItemsProperties.filter(c => c.itemId !== office.id));
    }
  }

  navigateToPage(url: string, idOffice: number) {
    this.router.navigate([`${url}`]);
    this.router.navigate([ url ], { queryParams: { idOffice }});
  }
}
