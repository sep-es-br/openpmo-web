import { cpfValidator } from 'src/app/shared/utils/cpfValidator';
import { AuthServerService } from '../../../shared/services/auth-server.service';
import { CitizenUserService } from '../../../shared/services/citizen-user.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

import { IOfficePermission } from 'src/app/shared/interfaces/IOfficePermission';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICardItemPermission } from 'src/app/shared/interfaces/ICardItemPermission';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { PersonService } from 'src/app/shared/services/person.service';
import { enterLeave } from '../../../shared/animations/enterLeave.animation';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { OfficeService } from 'src/app/shared/services/office.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

@Component({
  selector: 'app-office-permissions',
  templateUrl: './office-permissions.component.html',
  styleUrls: ['./office-permissions.component.scss'],
  animations: [
    enterLeave({ opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'all' }, 300)
  ]
})
export class OfficePermissionsComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

  idOffice: number;
  propertiesOffice: IOffice;
  cardPersonPermission: ICard;
  key: string;
  responsive: boolean;
  searchedEmailPerson: string;
  permission: IOfficePermission;
  person: IPerson;
  currentUserInfo: IPerson;
  showSearchInputMessage = false;
  cardItemsOfficePermission: ICardItemPermission[];
  debounceSearch = new Subject<string>();
  $destroy = new Subject();
  invalidMailMessage: string;
  isReadOnly: boolean;
  citizenAuthServer: boolean;
  citizenSearchBy: string = 'CPF'; //CPF | NAME
  searchedNameUser: string;
  searchedCpfUser: string;
  selectedPerson: IPerson;
  validCpf = true;
  publicServersResult: IPerson[];
  citizenUserNotFoundByCpf = false;
  showListBoxPublicServers = false;
  showMessagePublicServerNotFoundByName = false;
  isLoadingCitizen = false;
  isLoading = false;
  formIsSaving = false;
  showMessageIsSamePerson = false;
  isUserAdmin = false;

  constructor(
    private actRouter: ActivatedRoute,
    private authSrv: AuthService,
    private responsiveSrv: ResponsiveService,
    private officeSrv: OfficeService,
    private officePermissionsSrv: OfficePermissionService,
    private translateSrv: TranslateService,
    private personSrv: PersonService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private router: Router,
    private citizenUserSrv: CitizenUserService,
    private authServerSrv: AuthServerService,
  ) {
    localStorage.removeItem('@currentPlan');
    localStorage.removeItem('@pmo/propertiesCurrentPlan');
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idOffice = queryParams.idOffice;
      this.key = queryParams.key;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.debounceSearch.pipe(debounceTime(500), takeUntil(this.$destroy)).subscribe(async () => {
      if (this.searchedEmailPerson.length > 5 && this.validateEmail()) {
        await this.searchPerson();
        this.invalidMailMessage = undefined;
      } else {
        this.invalidMailMessage = this.searchedEmailPerson.length > 0 ? this.translateSrv.instant('messages.invalidEmail') : '';
        this.person = null;
      }
    });
  }

  async ngOnDestroy(): Promise<void> {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.isLoading = true;
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    const editPermission = await this.officePermissionsSrv.getPermissions(this.idOffice);
    if (!editPermission) {
      await this.router.navigate(['/offices']);
    }
    await this.getAuthServer();
    await this.loadPermission();
    await this.loadPropertiesOffice();
    await this.loadCurrentUserInfo();
    this.breadcrumbSrv.setMenu([
      {
        key: 'administration',
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName,
        routerLink: ['/configuration-office'],
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'configuration',
        info: 'officePermissions',
        tooltip: this.translateSrv.instant('officePermissions'),
        routerLink: ['/offices', 'permission'],
        queryParams: { idOffice: this.idOffice },
      },
      {
        key: 'permissions',
        routerLink: ['/offices', 'permission', 'detail'],
        queryParams: { idOffice: this.idOffice, key: this.key }
      }
    ]);
    if (this.key) {
      this.loadIsReadOnly();
    }
  }

  async getAuthServer() {
    const result = await this.authServerSrv.GetAuthServer();
    if (result.success) {
      this.citizenAuthServer = result.data;
    }
  }

  async loadPropertiesOffice() {
    this.propertiesOffice = await this.officeSrv.getCurrentOffice(this.idOffice);
  }

  validateEmail() {
    if (this.searchedEmailPerson.includes('@')) {
      const email = this.searchedEmailPerson.split('@');
      return email[1] !== '';
    } else {
      return false;
    }
  }

  async loadPermission() {
    this.cardPersonPermission = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'permissions',
      collapseble: true,
      initialStateCollapse: false
    };
    if (this.key) {
      this.isLoading = true;
      const result = await this.officePermissionsSrv.GetAll({ key: this.key, 'id-office': this.idOffice });
      if (result.success) {
        this.permission = result.data[0];
        this.isLoading = false;
      }
      if (this.permission) {
        this.person = {
          id: this.permission.person.id,
          name: this.permission.person.name,
          fullName: this.permission.person.fullName,
          key: this.permission.person.key,
          email: this.permission.person.email,
          roles: this.permission.permissions.map(p => ({ role: p.role })),
          guid: this.permission.person.guid
        };
      }
      this.loadCardItemsPersonPermissions();
    } else {
      this.isLoading = false;
    }
  }

  loadCardItemsPersonPermissions() {
    if (this.permission) {
      this.cardItemsOfficePermission = this.permission?.permissions && this.permission?.permissions.map(p => ({
        typeCardItem: 'editItem',
        titleCardItem: p.role,
        levelListOptions: [
          { label: this.translateSrv.instant('read'), value: 'READ' },
          { label: this.translateSrv.instant('edit'), value: 'EDIT' },
          { label: this.translateSrv.instant('none'), value: 'NONE' }
        ],
        selectedOption: p.level,
        itemId: p.id
      }));
      const rolesNotPermissions = this.permission?.permissions ? this.permission?.person?.roles
        .filter(r => this.permission?.permissions.filter(p => p.role === r.role).length === 0) : this.permission?.person?.roles;
      if (rolesNotPermissions) {
        rolesNotPermissions.forEach(r => {
          if (this.cardItemsOfficePermission && this.cardItemsOfficePermission.length > 0) {
            this.cardItemsOfficePermission.push({
              typeCardItem: 'editItem',
              titleCardItem: r.role,
              levelListOptions: [
                { label: this.translateSrv.instant('read'), value: 'READ' },
                { label: this.translateSrv.instant('edit'), value: 'EDIT' },
                { label: this.translateSrv.instant('none'), value: 'NONE' }
              ]
            });
          } else {
            this.cardItemsOfficePermission = [{
              typeCardItem: 'editItem',
              titleCardItem: r.role,
              levelListOptions: [
                { label: this.translateSrv.instant('read'), value: 'READ' },
                { label: this.translateSrv.instant('edit'), value: 'EDIT' },
                { label: this.translateSrv.instant('none'), value: 'NONE' }
              ]
            }];
          }
        });
      }
    } else {
      this.cardItemsOfficePermission = null;
    }
  }

  async loadCurrentUserInfo() {
    this.currentUserInfo = await this.authSrv.getInfoPerson();
  }

  loadIsReadOnly() {
    this.isReadOnly = this.currentUserInfo && this.currentUserInfo.id === this.person.id;
  }

  async searchPerson() {
    this.saveButton?.hideButton();
    this.showMessageIsSamePerson = false;
    if (this.searchedEmailPerson) {
      const { data } = await this.personSrv.GetByKey(this.searchedEmailPerson);
      if (data) {
        if (!this.isUserAdmin && data.id === Number(this.authSrv.getIdPerson())) {
          this.person = null;
          this.showMessageIsSamePerson = true;
          return;
        }
        this.showSearchInputMessage = false;
        this.person = data;
        this.person.email = this.searchedEmailPerson;
      } else {
        const email = this.searchedEmailPerson.split('@');
        const name = email[0];
        this.person = {
          name,
          email: this.searchedEmailPerson,
          roles: [{ role: 'citizen' }]
        };
      }
    } else {
      this.person = null;
    }
    this.loadNewPermission();
  }

  validateClearSearchUserName(event) {
    if (!event || (event.length === 0)) {
      this.publicServersResult = [];
      this.showListBoxPublicServers = false;
      this.showMessagePublicServerNotFoundByName = false;
      this.showMessageIsSamePerson = false;
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
    this.showMessageIsSamePerson = false;
  }

  async searchCitizenUserByName() {
    this.saveButton?.hideButton();
    this.publicServersResult = [];
    if (this.person) {
      this.person = undefined;
    }
    this.isLoadingCitizen = true;
    const result = await this.citizenUserSrv.GetPublicServersByName({
      name: this.searchedNameUser,
      idOffice: this.idOffice
    });
    this.isLoadingCitizen = false;
    if (result.success) {
      this.publicServersResult = result.data;
      this.showListBoxPublicServers = this.publicServersResult.length > 0;
    }
    this.showMessagePublicServerNotFoundByName =
      !this.publicServersResult || (this.publicServersResult && this.publicServersResult.length === 0);
  }

  validateClearSearchByCpf(event) {
    if (!event || (event.length === 0)) {
      this.person = undefined;
      this.loadNewPermission();
      this.validCpf = true;
      this.citizenUserNotFoundByCpf = false;
      this.showMessageIsSamePerson = false;
    }
  }

  async validateCpf() {
    this.saveButton?.hideButton();
    this.citizenUserNotFoundByCpf = false;
    this.validCpf = cpfValidator(this.searchedCpfUser);
    if (this.validCpf) {
      this.isLoadingCitizen = true;
      const result = await this.citizenUserSrv.GetCitizenUserByCpf({
        cpf: this.searchedCpfUser,
        idOffice: this.idOffice,
        loadWorkLocation: false
      });
      this.isLoadingCitizen = false;
      if (result.success) {
        if (!this.isUserAdmin && result.data.id === Number(this.authSrv.getIdPerson())) {
          this.showMessageIsSamePerson = true;
          return;
        }
        this.person = result.data;
        this.loadNewPermission();
      } else {
        this.citizenUserNotFoundByCpf = true;
      }
    }
  }

  async handleSelectedPublicServer(event) {
    this.showListBoxPublicServers = false;
    this.isLoadingCitizen = true;
    const publicServer = event.value;
    const result = await this.citizenUserSrv.GetPublicServer(publicServer.sub, {
      idOffice: this.idOffice,
      loadWorkLocation: false
    });
    this.isLoadingCitizen = false;
    if (result.success) {
      if (!this.isUserAdmin && result.data.id === Number(this.authSrv.getIdPerson())) {
        this.showMessageIsSamePerson = true;
        return;
      }
      this.person = result.data;
      this.searchedNameUser = '';
      this.publicServersResult = [];
      this.showListBoxPublicServers = false;
      this.loadNewPermission();
    }
  }

  loadNewPermission() {
    if (this.person) {
      const permissions = this.person.roles
        ? this.person.roles.map(p => ({ role: p.role, level: 'NONE' }))
        : [{ role: 'citizen', level: 'NONE' }];
      this.permission = {
        idOffice: this.idOffice,
        person: {
          ...this.person
        },
        permissions
      };
    } else {
      this.permission = null;
    }
    this.loadCardItemsPersonPermissions();
  }

  async savePermission() {
    this.cancelButton.hideButton();
    this.formIsSaving = true;
    this.permission.permissions = this.cardItemsOfficePermission
      .map(cardItem => (
        {
          id: cardItem.itemId,
          role: cardItem.titleCardItem,
          level: cardItem.selectedOption
        }
      ));

    const permission: IOfficePermission = {
      idOffice: this.idOffice,
      key: this.key ? this.key : this.person.key,
      person: this.person,
      permissions: this.permission.permissions
    };
    const result = this.key
      ? await this.officePermissionsSrv.put(permission)
      : await this.officePermissionsSrv.post(permission);
    if (result.success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.formIsSaving = false;
      await this.router.navigate(['/offices', 'permission'], { queryParams: { idOffice: this.idOffice } });
    }
  }


  handleOnCancel() {
    this.saveButton.hideButton();
    if (this.key) {
      this.loadCardItemsPersonPermissions();
    } else {
      this.validateClearSearchByCpf('');
      this.validateClearSearchByUser();
      this.validateClearSearchUserName('');
      this.citizenSearchBy = 'CPF'
    }
  }
}
