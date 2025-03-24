import { AuthServerService } from './../../../shared/services/auth-server.service';
import { CitizenUserService } from './../../../shared/services/citizen-user.service';
import { cpfValidator } from 'src/app/shared/utils/cpfValidator';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MessageService } from 'primeng/api';

import { IPlanPermission } from 'src/app/shared/interfaces/IPlanPermission';
import { PlanPermissionService } from 'src/app/shared/services/plan-permissions.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICardItemPermission } from 'src/app/shared/interfaces/ICardItemPermission';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { PersonService } from 'src/app/shared/services/person.service';
import { enterLeave } from '../../../shared/animations/enterLeave.animation';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { PlanService } from 'src/app/shared/services/plan.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { OfficeService } from 'src/app/shared/services/office.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

@Component({
  selector: 'app-plan-permissions',
  templateUrl: './plan-permissions.component.html',
  styleUrls: ['./plan-permissions.component.scss'],
  animations: [
    enterLeave({ opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'all' }, 300)
  ]
})
export class PlanPermissionsComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

  idPlan: number;
  propertiesPlan: IPlan;
  idOffice: number;
  propertiesOffice: IOffice;
  cardPersonPermission: ICard;
  key: string;
  responsive: boolean;
  searchedEmailPerson: string;
  permission: IPlanPermission;
  person: IPerson;
  showSearchInputMessage = false;
  cardItemsPlanPermission: ICardItemPermission[];
  debounceSearch = new Subject();
  $destroy = new Subject();
  invalidMailMessage: string;
  citizenAuthServer: boolean;
  citizenSearchBy: string = 'CPF'; //CPF | NAME
  searchedNameUser: string;
  searchedCpfUser: string;
  selectedPerson: IPerson;
  validCpf = true;
  publicServersResult: {name: string; sub: string}[];
  citizenUserNotFoundByCpf = false;
  showMessageNotFoundUserByEmail = false;
  showListBoxPublicServers = false;
  showMessagePublicServerNotFoundByName = false;
  showMessageInvalidEmail = false;
  isLoadingCitizen = false;
  isLoading = false;
  formIsSaving = false;
  isUserAdmin = false;
  showMessageIsSamePerson = false;
  isSamePerson = false;

  constructor(
    private actRouter: ActivatedRoute,
    private responsiveSrv: ResponsiveService,
    private planPermissionSrv: PlanPermissionService,
    private translateSrv: TranslateService,
    private personSrv: PersonService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private planSrv: PlanService,
    private router: Router,
    private officeSrv: OfficeService,
    private citizenUserSrv: CitizenUserService,
    private authServerSrv: AuthServerService,
    private authSrv: AuthService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idPlan = +queryParams.idPlan;
      this.key = queryParams.key;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.debounceSearch.pipe(debounceTime(500), takeUntil(this.$destroy)).subscribe(() => {
      if (this.searchedEmailPerson.length > 5 && this.validateEmail()) {
        this.searchPerson();
        this.invalidMailMessage = undefined;
      } else {
        this.invalidMailMessage = this.translateSrv.instant('messages.invalidEmail');
        this.person = null;
      }
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
    this.citizenUserSrv.unloadCitizenUsers();
  }

  async ngOnInit() {
    this.isLoading = true;
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    await this.getAuthServer();
    await this.loadPermission();
    await this.loadPropertiesPlan();
    await this.loadPropertiesOffice();
  }

  async getAuthServer() {
    const result = await this.authServerSrv.GetAuthServer();
    if (result.success) {
      this.citizenAuthServer = result.data;
    }
  }

  async loadPropertiesPlan() {
    this.propertiesPlan = await this.planSrv.getCurrentPlan(this.idPlan);
  }

  async loadPropertiesOffice() {
    this.idOffice = this.propertiesPlan?.idOffice;
    this.propertiesOffice = await this.officeSrv.getCurrentOffice(this.idOffice);
    this.setBreacrumb();
  }

  setBreacrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'office',
        routerLink: [ '/offices', 'office' ],
        queryParams: { id: this.idOffice },
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName
      },
      {
        key: 'planPermissions',
        routerLink: [ '/plan', 'permission' ],
        queryParams: { idPlan: this.idPlan },
        info: this.propertiesPlan?.name,
        tooltip: this.propertiesPlan?.fullName
      },
      {
        key: 'permission',
        routerLink: [ '/plan', 'permission', 'detail' ],
        queryParams: { idPlan: this.idPlan, key: this.key },
        info: this.person?.name,
        tooltip: this.person?.fullName
      }
    ]);
  }

  validateEmail() {
    if (this.searchedEmailPerson.includes('@')) {
      const email = this.searchedEmailPerson.split('@');
      if (email[1] !== '') {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  validateClearSearchUserName(event) {
    if (!event || (event.length === 0)) {
      this.publicServersResult = [];
      this.showListBoxPublicServers = false;
      this.showMessageIsSamePerson = false;
      this.showMessagePublicServerNotFoundByName = false;
    }
  }

  validateClearSearchByUser() {
    this.person = undefined;
    this.publicServersResult = [];
    this.showListBoxPublicServers = false;
    this.showMessagePublicServerNotFoundByName = false;
    this.citizenUserNotFoundByCpf = false;
    this.showMessageIsSamePerson = false;
    this.validCpf = true;
    this.searchedCpfUser = null;
    this.searchedNameUser = null;
  }

  async searchCitizenUserByName() {
    this.saveButton?.hideButton();
    this.cancelButton.showButton();
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
    this.showMessagePublicServerNotFoundByName = !this.publicServersResult || (this.publicServersResult && this.publicServersResult.length === 0);
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
    this.cancelButton.showButton();
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
    const result = await this.citizenUserSrv.GetPublicServer(publicServer.sub, { idOffice: this.idOffice, loadWorkLocation: false });
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

  async loadPermission() {
    this.cardPersonPermission = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'permissions',
      collapseble: true,
      initialStateCollapse: false
    };
    if (this.key) {
      const result = await this.planPermissionSrv.GetAll({key: this.key, 'id-plan': this.idPlan});
      if (result.success) {
        this.permission = result.data[0];
      }
      if (this.permission) {
        this.person = {
          name: this.permission.person.name,
          email: this.permission.person.email,
          guid: this.permission.person.guid,
          key: this.permission.person.key,
          id: this.permission.person.id,
          roles: this.permission.permissions.map(p => ({'role': p.role}))
        };
        this.isSamePerson = !this.isUserAdmin && this.person.id === Number(this.authSrv.getIdPerson());
      }
      this.loadCardItemsPersonPermissions();
      this.isLoading = false;
    } else {
      this.isLoading = false;
    }
  }

  loadCardItemsPersonPermissions() {
    if (this.permission) {
      this.cardItemsPlanPermission = this.permission.permissions.map(p => ({
        typeCardItem: 'editItem',
        titleCardItem: p.role,
        levelListOptions: [
          { label: this.translateSrv.instant('read'), value: 'READ' },
          { label: this.translateSrv.instant('edit'), value: 'EDIT' },
          { label: this.translateSrv.instant('none'), value: 'NONE' }
        ],
        selectedOption: p.level,
        readOnly: this.isSamePerson
      }));
      const rolesNotPermissions = this.permission?.permissions ? this.permission?.person?.roles
        .filter(r => this.permission?.permissions.filter(p => p.role === r.role).length === 0) : this.permission?.person?.roles;
      if (rolesNotPermissions) {
        rolesNotPermissions.forEach(r => {
          if (this.cardItemsPlanPermission && this.cardItemsPlanPermission.length > 0) {
            this.cardItemsPlanPermission.push({
              typeCardItem: 'editItem',
              titleCardItem: r.role,
              levelListOptions: [
                { label: this.translateSrv.instant('read'), value: 'READ' },
                { label: this.translateSrv.instant('edit'), value: 'EDIT' },
                { label: this.translateSrv.instant('none'), value: 'NONE' }
              ]
            });
          } else {
            this.cardItemsPlanPermission = [{
              typeCardItem: 'editItem',
              titleCardItem: r.role,
              levelListOptions: [
                { label: this.translateSrv.instant('read'), value: 'READ' },
                { label: this.translateSrv.instant('edit'), value: 'EDIT' },
                { label: this.translateSrv.instant('none'), value: 'NONE' }
              ]
            }];
          }
        })
      }
    } else {
      this.cardItemsPlanPermission = null;
    }
  }

  async searchPerson() {
    this.showMessageIsSamePerson = false;
    this.saveButton?.hideButton();
    this.cancelButton.showButton();
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
        this.person.email = this.searchedEmailPerson
      } else {
        const email = this.searchedEmailPerson.split('@');
        const name = email[0];
        this.person = {
          name,
          fullName: name,
          email: this.searchedEmailPerson,
          roles: [ {role: 'citizen'} ]
        };
      }
    } else {
      this.person = null;
    }
    this.loadNewPermission();
  }

  loadNewPermission() {
    if (this.person) {
      const permissions = this.person.roles
        ?  this.person.roles.map(p => ({ role: p.role, level: 'NONE' }))
        : [{ role: 'citizen', level: 'NONE' }];
      this.permission = {
        idPlan: this.idPlan,
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
    this.permission.permissions = this.cardItemsPlanPermission.filter( p => p.selectedOption && p.selectedOption !== 'NONE').map(cardItem => (
      {
        id: cardItem.itemId,
        role: cardItem.titleCardItem,
        level: cardItem.selectedOption
      }
    ));
    const permission: IPlanPermission = {
      idPlan: this.idPlan,
      email: this.person.email,
      key: this.key ? this.key : this.person.key,
      person: this.person,
      permissions: this.permission.permissions
    };
    const { success } = this.key
      ? await this.planPermissionSrv.put(permission)
      : await this.planPermissionSrv.post(permission);
    if (success) {
      this.formIsSaving = false;
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.router.navigate([ '/plan', 'permission' ], { queryParams: { idPlan: this.idPlan }});
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
      this.citizenSearchBy = 'CPF';
    }
  }
}
