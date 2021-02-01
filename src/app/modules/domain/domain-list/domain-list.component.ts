import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IDomain } from 'src/app/shared/interfaces/IDomain';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { DomainService } from 'src/app/shared/services/domain.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-domain-list',
  templateUrl: './domain-list.component.html',
  styleUrls: ['./domain-list.component.scss']
})
export class DomainListComponent implements OnInit, OnDestroy {

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'domains',
    collapseble: false,
    initialStateCollapse: false
  };
  idOffice: number;
  propertiesOffice: IOffice;
  cardItemsProperties: ICardItem[] = [];
  isUserAdmin: boolean;
  editPermission: boolean;
  $destroy = new Subject();
  responsive: boolean;

  constructor(
    private domainSvr: DomainService,
    private officeSrv: OfficeService,
    private translateSvr: TranslateService,
    private activeRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private responsiveSrv: ResponsiveService
  ) {
    this.activeRoute.queryParams.subscribe(params => {
      this.idOffice = +params.idOffice;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  async ngOnInit() {
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    await this.loadPropertiesDomains();
    await this.getOfficeById();
    this.breadcrumbSrv.pushMenu({
      key: 'domains',
      info: this.propertiesOffice?.name,
      routerLink: ['/domains'],
      queryParams: { idOffice: this.idOffice }
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async getOfficeById() {
    const { success, data } = await this.officeSrv.GetById(this.idOffice);
    if (success) {
      this.propertiesOffice = data;
    }
  }

  async loadPropertiesDomains() {
    const { success, data } = await this.domainSvr.GetAll({ 'id-office': this.idOffice });
    const itemsProperties: ICardItem[] = this.editPermission ? [
      {
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        urlCard: '/domains/detail',
        paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }]
      }
    ] : [];
    if (success) {
      itemsProperties.unshift(...data.map(domain => ({
        typeCardItem: 'listItem',
        iconSvg: true,
        icon: IconsEnum.MapMarked,
        nameCardItem: domain.name,
        fullNameCardItem: domain.fullName,
        itemId: domain.id,
        menuItems: [{ label: this.translateSvr.instant('delete'), icon: 'fas fa-trash-alt',
          command: () => this.deleteDomain(domain),
          disabled: !this.editPermission }] as MenuItem[],
        urlCard: 'detail',
        paramsUrlCard: [{ name: 'idOffice', value: this.idOffice }]
      })));
    }
    this.cardItemsProperties = itemsProperties;
  }

  async deleteDomain(domain: IDomain) {
    const { success } = await this.domainSvr.delete(domain);
    if (success) {
      this.cardItemsProperties = Array.from(this.cardItemsProperties.filter(element => element.itemId !== domain.id));
    }
  };

}
