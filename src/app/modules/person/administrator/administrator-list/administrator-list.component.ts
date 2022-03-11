import { Component, OnInit } from '@angular/core';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICardItemPermission } from 'src/app/shared/interfaces/ICardItemPermission';
import { TranslateService } from '@ngx-translate/core';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MessageService } from 'primeng/api';
import { PersonService } from 'src/app/shared/services/person.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-administrator-list',
  templateUrl: './administrator-list.component.html',
  styleUrls: ['./administrator-list.component.scss']
})
export class AdministratorListComponent implements OnInit {
  responsive: boolean;
  administrators: IPerson[];
  cardItemsAdministrators: ICardItemPermission[] = [];
  cardAdministrators: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'administrators',
    collapseble: true,
    initialStateCollapse: false
  };
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  currentUserInfo: IPerson;
  idFilterSelected: number;
  idCurrentPerson: number;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private personSrv: PersonService,
    private messageSrv: MessageService,
    private router: Router,

  ) {
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
  }

  async ngOnInit() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    if (!isUserAdmin) {
      await this.router.navigate(['/offices']);
    }
    await this.loadCurrentUserInfo();
    await this.loadAdministrators();
    this.loadBreadcrump();
  }

  async loadCurrentUserInfo() {
    this.idCurrentPerson = Number(this.authSrv.getIdPerson());
  }


  async loadAdministrators() {
    const result = await this.personSrv.getPersonsAdministrators();
    if (result.success) {
      this.administrators = result.data;
      this.loadCardItemsAdministrators();
    }
  }

  loadCardItemsAdministrators() {
    if (this.administrators) {
      this.cardItemsAdministrators = this.administrators.map(administrator => {
      return  {
          typeCardItem: 'listItem',
          titleCardItem: administrator.name,
          fullNameUser: administrator.fullName,
          roleDescription: administrator.email,
          menuItems:  [{
            label: this.translateSrv.instant('delete'),
            icon: 'fas fa-trash-alt',
            command: (event) => this.deleteAdministrator(administrator),
            disabled: administrator.id === this.idCurrentPerson
          }],
          itemId: administrator.id,
        };
      });
    }
    this.cardItemsAdministrators.push(
      {
        typeCardItem: 'newCardItem',
        urlCard: '/persons/administrators/administrator',
      }
    );
    this.totalRecords = this.cardItemsAdministrators && this.cardItemsAdministrators.length;
    this.cardAdministrators.showCreateNemElementButton = true;
  }

  loadBreadcrump() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'administrators',
        routerLink: [ '/persons/administrators' ],
      }
    ]);
  }

  handleChangeDisplayMode(event) {
    this.displayModeAll = event.displayMode;
  }

  handleChangePageSize(event) {
    this.pageSize = event.pageSize;
  }


  async handleCreateNewOfficePermission() {
    await this.router.navigate(['/persons/administrators/administrator']);
  }

  async deleteAdministrator(administrator: IPerson) {
    if(administrator.id === this.idCurrentPerson) {
      return this.messageSrv.add({
        summary: this.translateSrv.instant('error'),
        severity: 'warn',
        detail: this.translateSrv.instant('messages.error.permission.delete.relationship.error')
      });
    }
    const result = await this.personSrv.setPersonAdministrator(administrator.id, false);
    if (result.success) {
      const administratorIndex = this.cardItemsAdministrators.findIndex( p => p.itemId === administrator.id);
      if (administratorIndex > -1) {
        this.cardItemsAdministrators.splice(administratorIndex,1);
        this.cardItemsAdministrators = Array.from(this.cardItemsAdministrators);
        this.totalRecords = this.cardItemsAdministrators && this.cardItemsAdministrators.length;
      }
    }
  }

  async handleSelectedFilter(event) {
    const idFilter = event.filter;
    if (idFilter) {
      this.idFilterSelected = idFilter;
      await this.loadAdministrators();
    }
  }

  setBreadcrumbStorage() {
    this.breadcrumbSrv.setBreadcrumbStorage([
      {
        key: 'Administrators',
        routerLink: [ '/persons/administrators' ],
      }
    ]);
  }
}
