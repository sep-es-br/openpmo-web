import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';

import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IPlanModel } from 'src/app/shared/interfaces/IPlanModel';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { PlanModelService } from 'src/app/shared/services/plan-model.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-strategy-list',
  templateUrl: './strategy-list.component.html',
  styleUrls: ['./strategy-list.component.scss']
})
export class StrategyListComponent implements OnInit {

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'strategies',
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
    private planModelSvr: PlanModelService,
    private officeSrv: OfficeService,
    private translateSvr: TranslateService,
    private activeRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private responsiveSrv: ResponsiveService
  ) {
    this.activeRoute.queryParams.subscribe(async({ idOffice}) => {
      this.idOffice = +idOffice;
      await this.getOfficeById();
      await this.loadPropertiesStrategies();
      this.breadcrumbSrv.pushMenu({
        key: 'strategies',
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName,
        routerLink: [ '/strategies' ],
        queryParams: { idOffice: this.idOffice }
      });
    });
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
  }

  async ngOnInit() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
  }

  async getOfficeById() {
    const { data, success } = await this.officeSrv.GetById(this.idOffice);
    if (success) {
      this.propertiesOffice = data;
    }
  }

  async loadPropertiesStrategies() {
    const { success, data } = await this.planModelSvr.GetAll({ 'id-office': this.idOffice });
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    const itemsProperties: ICardItem[] = this.editPermission
      ? [{
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        urlCard: '/strategies/strategy',
        paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }]
        }]
      : [];
    if (success) {
      itemsProperties.unshift(... data.map(strategy => ({
        typeCardItem: 'listItem',
        iconSvg: true,
        icon: IconsEnum.ChessKnight,
        nameCardItem: strategy.name,
        fullNameCardItem: strategy.fullName,
        itemId: strategy.id,
        menuItems:
          [{ label: this.translateSvr.instant('delete') ,
            icon: 'fas fa-trash-alt', command: () => this.deleteStrategy(strategy), disabled: !this.editPermission}] as MenuItem[],
        urlCard: 'strategy',
        paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }]
      })));
    }
    this.cardItemsProperties = itemsProperties;
  }

  async deleteStrategy(strategy: IPlanModel) {
    const { success } =await this.planModelSvr.delete(strategy);
    if (success) {
      this.cardItemsProperties = Array.from(this.cardItemsProperties.filter(element => element.itemId !== strategy.id));
    }
  };

}
