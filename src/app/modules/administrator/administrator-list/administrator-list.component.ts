import { takeUntil } from 'rxjs/operators';
import { Component, OnInit, OnDestroy } from '@angular/core';
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
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-administrator-list',
  templateUrl: './administrator-list.component.html',
  styleUrls: ['./administrator-list.component.scss']
})
export class AdministratorListComponent implements OnInit, OnDestroy {

  responsive: boolean;
  administrators: IPerson[];
  cardItemsAdministrators: ICardItemPermission[] = [];
  cardAdministrators: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'administrators',
    collapseble: true,
    initialStateCollapse: false,

  };
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;
  currentUserInfo: IPerson;
  idFilterSelected: number;
  idCurrentPerson: number;
  isLoading = false;
  $destroy = new Subject();
  showBackToManagement = false;
  infoPerson;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private personSrv: PersonService,
    private messageSrv: MessageService,
    private router: Router,
    private configDataViewSrv: ConfigDataViewService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.configDataViewSrv.observableDisplayModeAll.pipe(takeUntil(this.$destroy)).subscribe(displayMode => {
      this.displayModeAll = displayMode;
    });
    this.configDataViewSrv.observablePageSize.pipe(takeUntil(this.$destroy)).subscribe(pageSize => {
      this.pageSize = pageSize;
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
    this.checkShowBackToManagement()
  }

  checkShowBackToManagement() {
    this.infoPerson = this.authSrv.getInfoPerson();
    if (this.infoPerson && this.infoPerson.workLocal &&
      (this.infoPerson.workLocal.idOffice || this.infoPerson.workLocal.idPlan || this.infoPerson.workLocal.idWorkpack)) {
      this.showBackToManagement = true;
    }
  }

  async navigateToManagement() {
    const workLocal = this.infoPerson.workLocal;
    if (workLocal.idWorkpackModelLinked && workLocal.idWorkpack && workLocal.idPlan && workLocal.idOffice) {
      this.router.navigate(['workpack'], {
        queryParams: {
          id: Number(workLocal.idWorkpack),
          idPlan: Number(workLocal.idPlan),
          idWorkpackModelLinked: Number(workLocal.idWorkpackModelLinked)
        }
      });
      return;
    }
    if (workLocal.idWorkpack && workLocal.idPlan && workLocal.idOffice) {
      this.router.navigate(['workpack'], {
        queryParams: {
          id: Number(workLocal.idWorkpack),
          idPlan: Number(workLocal.idPlan),
        }
      });
      return;
    }
    if (workLocal.idPlan && workLocal.idOffice) {
      this.router.navigate(['plan'], {
        queryParams: {
          id: Number(workLocal.idPlan),
        }
      });
      return;
    }
    if (workLocal.idOffice) {
      this.router.navigate(['offices/office'], {
        queryParams: {
          id: Number(workLocal.idOffice),
        }
      });
      return;
    }
  }

  ngOnDestroy(): void {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

  async loadCurrentUserInfo() {
    this.idCurrentPerson = Number(this.authSrv.getIdPerson());
  }


  async loadAdministrators() {
    this.isLoading = true;
    const result = await this.personSrv.getPersonsAdministrators();
    if (result.success) {
      this.administrators = result.data;
      this.loadCardItemsAdministrators();
      this.isLoading = false;
    }
  }

  loadCardItemsAdministrators() {
    if (this.administrators) {
      this.cardItemsAdministrators = this.administrators.map(administrator => {
        return {
          typeCardItem: 'listItem',
          titleCardItem: administrator.name,
          fullNameUser: administrator.fullName,
          roleDescription: administrator.email,
          menuItems: [{
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
        urlCard: '/administrators/administrator',
      }
    );
    this.totalRecords = this.cardItemsAdministrators && this.cardItemsAdministrators.length;
    this.cardAdministrators.showCreateNemElementButton = true;
  }

  loadBreadcrump() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'administrators',
        routerLink: ['/administrators'],
      }
    ]);
  }

  async handleCreateNewOfficePermission() {
    await this.router.navigate(['/administrators/administrator']);
  }

  async deleteAdministrator(administrator: IPerson) {
    if (administrator.id === this.idCurrentPerson) {
      return this.messageSrv.add({
        summary: this.translateSrv.instant('error'),
        severity: 'warn',
        detail: this.translateSrv.instant('messages.error.permission.delete.relationship.error')
      });
    }
    const result = await this.personSrv.setPersonAdministrator(administrator.id, false);
    if (result.success) {
      const administratorIndex = this.cardItemsAdministrators.findIndex(p => p.itemId === administrator.id);
      if (administratorIndex > -1) {
        this.cardItemsAdministrators.splice(administratorIndex, 1);
        this.cardItemsAdministrators = Array.from(this.cardItemsAdministrators);
        this.totalRecords = this.cardItemsAdministrators && this.cardItemsAdministrators.length;
      }
    }
  }

  handleCreateNewAdministrator() {
    this.router.navigate(['/administrators/administrator'])
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
        routerLink: ['/administrators'],
        admin: true
      }
    ]);
  }
}
