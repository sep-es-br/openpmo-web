import { AuthService } from './../../../../shared/services/auth.service';
import {AuthServerService} from '../../../../shared/services/auth-server.service';
import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {MessageService} from 'primeng/api';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ResponsiveService} from 'src/app/shared/services/responsive.service';
import {ICard} from 'src/app/shared/interfaces/ICard';
import {IPerson} from 'src/app/shared/interfaces/IPerson';
import {PersonService} from 'src/app/shared/services/person.service';
import {enterLeave} from '../../../../shared/animations/enterLeave.animation';
import {BreadcrumbService} from 'src/app/shared/services/breadcrumb.service';
import {SaveButtonComponent} from 'src/app/shared/components/save-button/save-button.component';
import {cpfValidator} from 'src/app/shared/utils/cpfValidator';
import {CitizenUserService} from 'src/app/shared/services/citizen-user.service';

@Component({
  selector: 'app-administrator',
  templateUrl: './administrator.component.html',
  styleUrls: ['./administrator.component.scss'],
  animations: [
    enterLeave({opacity: 0, pointerEvents: 'none'}, {opacity: 1, pointerEvents: 'all'}, 300)
  ]
})
export class AdministratorComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  person: IPerson;
  cardAdministrator: ICard;
  responsive: boolean;
  citizenAuthServer: boolean;
  personSearchBy: string; // SEARCH / NEW
  citizenSearchBy: string; //CPF | NAME
  searchedNameUser: string;
  searchedCpfUser: string;
  searchedEmailUser: string;
  selectedPerson: IPerson;
  resultPersonsByName: IPerson[];
  notFoundPerson = false;
  validCpf = true;
  publicServersResult: IPerson[];
  citizenUserNotFoundByCpf = false;
  showMessageNotFoundUserByEmail = false;
  showListBoxPublicServers = false;
  showMessagePublicServerNotFoundByName = false;
  showMessageInvalidEmail = false;
  $destroy = new Subject();
  isLoading = false;

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private personSrv: PersonService,
    private messageSrv: MessageService,
    private breadcrumbSrv: BreadcrumbService,
    private router: Router,
    private authServerSrv: AuthServerService,
    private citizenUserSrv: CitizenUserService,
    private authSrv: AuthService
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.citizenUserSrv.loadCitizenUsers().then();
  }

  async ngOnDestroy(): Promise<void> {
    this.$destroy.next();
    this.$destroy.complete();
    await this.citizenUserSrv.unloadCitizenUsers();
  }

  async ngOnInit() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    if (!isUserAdmin) {
      this.router.navigate['/offices'];
    }
    await this.getAuthServer();
    this.loadBreadcrumb();
    this.loadCards();
  }

  async getAuthServer() {
    const result = await this.authServerSrv.GetAuthServer();
    if (result.success) {
      this.citizenAuthServer = result.data;
    }
  }

  loadBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'administrators',
        routerLink: ['/persons/administrators'],
      },
      {
        key: 'administrator',
        routerLink: ['/persons/administrators/administrator'],
      },
    ]);
  }

  getRouterLinkFromType(type: string): string[] {
    switch (type) {
      case 'office':
        return ['/offices', 'office'];
      case 'plan':
        return ['plan'];
      default:
        return ['/workpack'];
    }
  }

  validateClearSearchPerson(event) {
    if (!event || event.length === 0) {
      this.person = undefined;
      this.saveButton.hideButton();
    }
  }

  validateClearSearchUserName(event) {
    if (!event || (event.length === 0)) {
      this.publicServersResult = [];
      this.showListBoxPublicServers = false;
      this.showMessagePublicServerNotFoundByName = false;
      this.saveButton.hideButton();
    }
  }

  validateClearSearchUserByEmail(event) {
    if (!event || (event.length === 0)) {
      this.person = undefined;
      this.showMessageInvalidEmail = false;
      this.showMessageNotFoundUserByEmail = false;
      this.saveButton.hideButton();
    }
  }

  validateClearSearchByUser() {
    this.person = undefined;
    this.publicServersResult = [];
    this.showListBoxPublicServers = false;
    this.showMessagePublicServerNotFoundByName = false;
    this.citizenUserNotFoundByCpf = false;
    this.validCpf = true;
    this.searchedCpfUser = null;
    this.searchedNameUser = null;
    this.saveButton.hideButton();
  }

  resetPerson() {
    this.person = undefined;
    this.selectedPerson = undefined;
  }

  loadCards() {
    this.cardAdministrator = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'person',
      collapseble: true,
      initialStateCollapse: false
    };
  }

  async searchUserByEmail() {
    if (this.searchedEmailUser && this.searchedEmailUser.length > 5 && this.searchedEmailUser.split('@').length > 1) {
      const {data} = await this.personSrv.GetByEmail(this.searchedEmailUser);
      if (data) {
        this.person = data;
        this.showMessageNotFoundUserByEmail = false;
      } else {
        this.person = {
          name: this.searchedEmailUser.split('@')[0],
          fullName: this.searchedEmailUser.split('@')[0],
          email: this.searchedEmailUser,
          administrator: true,
          isUser: true,
        };
        this.showMessageNotFoundUserByEmail = true;
      }
      this.saveButton.showButton();
    } else {
      this.person = null;
      this.showMessageInvalidEmail = true;
    }
  }

  async searchCitizenUserByName() {
    this.publicServersResult = [];
    if (this.person) {
      this.person = undefined;
    }
    this.isLoading = true;
    const result = await this.citizenUserSrv.GetPublicServersByName({
      name: this.searchedNameUser
    });
    this.isLoading = false;
    if (result.success) {
      this.publicServersResult = result.data;
      this.showListBoxPublicServers = this.publicServersResult.length > 0;
    }
    this.showMessagePublicServerNotFoundByName =
      !this.publicServersResult || (this.publicServersResult && this.publicServersResult.length === 0);
    // this.saveButton.showButton();
  }

  validateClearSearchByCpf(event) {
    if (!event || (event.length === 0)) {
      this.person = undefined;
      this.validCpf = true;
      this.citizenUserNotFoundByCpf = false;
    }
  }

  async validateCpf() {
    this.citizenUserNotFoundByCpf = false;
    this.validCpf = cpfValidator(this.searchedCpfUser);
    if (this.validCpf) {
      this.isLoading = true;
      const result = await this.citizenUserSrv.GetCitizenUserByCpf({
        cpf: this.searchedCpfUser
      });
      this.isLoading = false;
      if (result.success) {
        this.person = result.data;
        this.saveButton.showButton();
      } else {
        this.citizenUserNotFoundByCpf = true;
        this.saveButton.hideButton();
      }
    }
  }

  showFormPerson() {
    return this.person ? true : this.personSearchBy === 'NEW';
  }

  async handleSelectedPublicServer(event) {
    this.showListBoxPublicServers = false;
    this.isLoading = true;
    const publicServer = event.value;
    const result = await this.citizenUserSrv.GetPublicServer(publicServer.sub);
    this.isLoading = false;
    if (result.success) {
      this.person = result.data;
      this.searchedNameUser = '';
      this.publicServersResult = [];
      this.showListBoxPublicServers = false;
      this.saveButton.showButton();
    }
  }

  async savePersonToAdministrator() {
    if (!this.person) {
      return;
    }
    if (this.person && this.person.id) {
      const result = await this.personSrv.setPersonAdministrator(this.person.id, true);
      if (result.success) {
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
        await this.router.navigate(
          ['/persons/administrators'],
        );
      }
    } else {
      const result = await this.personSrv.post({
        ...this.person,
        administrator: true,
        isUser: true
      });
      if (result.success) {
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
        await this.router.navigate(
          ['/persons/administrators'],
        );
      }
    }
  }

}
