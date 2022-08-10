import {PlanService} from 'src/app/shared/services/plan.service';
import {AuthServerService} from '../../../shared/services/auth-server.service';
import {CitizenUserService} from '../../../shared/services/citizen-user.service';
import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {MessageService} from 'primeng/api';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';

import {ResponsiveService} from 'src/app/shared/services/responsive.service';
import {ICard} from 'src/app/shared/interfaces/ICard';
import {StakeholderService} from 'src/app/shared/services/stakeholder.service';
import {IStakeholder, IStakeholderPermission, IStakeholderRole} from 'src/app/shared/interfaces/IStakeholder';
import {IWorkpack} from 'src/app/shared/interfaces/IWorkpack';
import {WorkpackService} from 'src/app/shared/services/workpack.service';
import {IPerson} from 'src/app/shared/interfaces/IPerson';
import {PersonService} from 'src/app/shared/services/person.service';
import {enterLeave} from '../../../shared/animations/enterLeave.animation';
import {formatDateToString} from 'src/app/shared/utils/formatDateToString';
import {BreadcrumbService} from 'src/app/shared/services/breadcrumb.service';
import {SaveButtonComponent} from 'src/app/shared/components/save-button/save-button.component';
import {cpfValidator} from 'src/app/shared/utils/cpfValidator';

interface ICardItemRole {
  type: string;
  role?: IStakeholderRole;
  personRoleOptions?: { label: string; value: string }[];
}

@Component({
  selector: 'app-stakeholder-person',
  templateUrl: './stakeholder-person.component.html',
  styleUrls: ['./stakeholder-person.component.scss'],
  animations: [
    enterLeave({opacity: 0, pointerEvents: 'none'}, {opacity: 1, pointerEvents: 'all'}, 300)
  ]
})
export class StakeholderPersonComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  idWorkpack: number;
  idWorkpackModelLinked: number;
  idPlan: number;
  workpack: IWorkpack;
  idOffice: number;
  idPerson: number;
  personRolesOptions: { label: string; value: string }[];
  person: IPerson;
  cardPerson: ICard;
  cardRoles: ICard;
  cardPermissions: ICard;
  responsive: boolean;
  stakeholder: IStakeholder;
  stakeholderForm: FormGroup;
  stakeholderRoles: IStakeholderRole[];
  stakeholderRolesCardItems: ICardItemRole[];
  stakeholderPermissions: IStakeholderPermission[];
  user = false;
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
  publicServersResult: { name: string; sub: string }[];
  citizenUserNotFoundByCpf = false;
  showMessageNotFoundUserByEmail = false;
  showListBoxPublicServers = false;
  showMessagePublicServerNotFoundByName = false;
  showMessageInvalidEmail = false;
  permissionLevelListOptions = [
    {label: this.translateSrv.instant('read'), value: 'READ'},
    {label: this.translateSrv.instant('edit'), value: 'EDIT'},
    {label: this.translateSrv.instant('none'), value: 'None'}
  ];
  $destroy = new Subject();
  isLoading = false;
  phoneNumberPlaceholder = '';

  constructor(
    private actRouter: ActivatedRoute,
    private responsiveSrv: ResponsiveService,
    private workpackSrv: WorkpackService,
    private stakeholderSrv: StakeholderService,
    private translateSrv: TranslateService,
    private formBuilder: FormBuilder,
    private personSrv: PersonService,
    private messageSrv: MessageService,
    private breadcrumbSrv: BreadcrumbService,
    private router: Router,
    private citizenUserSrv: CitizenUserService,
    private authServerSrv: AuthServerService,
    private planSrv: PlanService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idPlan = queryParams.idPlan && +queryParams.idPlan;
      this.idWorkpack = queryParams.idWorkpack && +queryParams.idWorkpack;
      this.idWorkpackModelLinked = queryParams.idWorkpackModelLinked && +queryParams.idWorkpackModelLinked;
      this.idPerson = queryParams.idPerson && +queryParams.idPerson;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.stakeholderForm = this.formBuilder.group({
      fullName: ['', [Validators.required]],
      address: [''],
      phoneNumber: [''],
      contactEmail: ['', [Validators.email]],
    });
  }

  async ngOnDestroy(): Promise<void> {
    this.$destroy.next();
    this.$destroy.complete();
    if (!this.idPerson) {
      this.citizenUserSrv.unloadCitizenUsers();
    }
  }

  async ngOnInit() {
    await this.loadWorkpack();
    await this.loadStakeholder();
    await this.getAuthServer();
    this.breadcrumbSrv.setMenu([
      ...await this.getBreadcrumbs(this.idWorkpack),
      {
        key: 'stakeholder',
        routerLink: ['/stakeholder/person'],
        queryParams: {idWorkpack: this.idWorkpack, idPerson: this.idPerson},
        info: this.stakeholder?.person?.name,
        tooltip: this.stakeholder?.person.fullName
      }
    ]);
  }

  async getAuthServer() {
    const result = await this.authServerSrv.GetAuthServer();
    if (result.success) {
      this.citizenAuthServer = result.data;
    }
  }

  async getBreadcrumbs(idWorkpack: number) {
    const {success, data} = await this.breadcrumbSrv.getBreadcrumbWorkpack(idWorkpack, {'id-plan': this.idPlan});
    return success
      ? data.map(p => ({
        key: !p.modelName ? p.type.toLowerCase() : p.modelName,
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: {id: p.id},
        modelName: p.modelName
      }))
      : [];
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

  async loadWorkpack() {
    const result = await this.workpackSrv.GetWorkpackById(this.idWorkpack, {'id-plan': this.idPlan});
    if (result.success) {
      this.workpack = result.data;
      this.personRolesOptions = this.workpack?.model?.personRoles?.map(role => ({
        label: role,
        value: role.toLowerCase()
      }));
      const resultPlan = await this.planSrv.GetById(this.idPlan);
      if (resultPlan.success) {
        this.idOffice = resultPlan.data.idOffice;
      }
    }
  }

  setPhoneNumberMask() {
    const valor = this.stakeholderForm.controls.phoneNumber.value;
    if (!valor || valor.length === 0) {
      this.phoneNumberPlaceholder = '';
      return;
    }
    if (valor.length < 10 && valor) {
      this.stakeholderForm.controls.phoneNumber.setValue(null);
      return;
    }
    const retorno = this.formatPhoneNumber(valor);
    this.stakeholderForm.controls.phoneNumber.setValue(retorno);
  }

  formatPhoneNumber(value: string) {
    if (!value) {
      return value;
    }
    let formatedValue = value.replace(/\D/g, '');
    formatedValue = formatedValue.replace(/^0/, '');
    if (formatedValue.length > 10) {
      formatedValue = formatedValue.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (formatedValue.length > 5) {
      formatedValue = formatedValue.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (formatedValue.length > 2) {
      formatedValue = formatedValue.replace(/^(\d\d)(\d{0,5})/, '($1) $2');
    } else {
      if (formatedValue.length != 0) {
        formatedValue = formatedValue.replace(/^(\d*)/, '($1');
      }
    }
    return formatedValue;
  }

  setPhoneNumberPlaceholder() {
    const valor = this.stakeholderForm.controls.phoneNumber.value;
    if (!valor || valor.length === 0) {
      this.phoneNumberPlaceholder = '(99) 99999-9999';
    }
  }

  clearPhoneNumberPlaceholder() {
    this.phoneNumberPlaceholder = '';
  }

  async loadStakeholder() {
    if (this.idPerson) {
      const result = await this.stakeholderSrv.GetStakeholderPerson({
        'id-workpack': this.idWorkpack,
        idPerson: this.idPerson,
        'id-plan': this.idPlan
      });
      if (result.success) {
        this.stakeholder = result.data;
        this.person = this.stakeholder?.person;
        this.loadCardPermissions();
      }
    }
    this.loadCards();
    this.setStakeholderForm();
  }

  // consulta para person que não são users
  async searchPersonByName(event) {
    const result = await this.personSrv.GetPersonByFullName({
      idWorkpack: this.idWorkpack,
      fullName: event.query.toString()
    });
    if (result.success && result.data.length > 0) {
      this.resultPersonsByName = result.data;
    } else {
      this.notFoundPerson = true;
    }
  }

  handlePersonSelected() {
    this.person = this.selectedPerson;
    this.setStakeholderFormFromPerson();
  }

  validateClearSearchPerson(event) {
    if (event && (event.length === 0)) {
      this.person = undefined;
      this.setStakeholderFormFromPerson();
    }
  }

  validateClearSearchUserName(event) {
    if (!event || (event.length === 0)) {
      this.publicServersResult = [];
      this.showListBoxPublicServers = false;
      this.showMessagePublicServerNotFoundByName = false;
    }
  }

  validateClearSearchByCpf(event) {
    if (!event || (event.length === 0)) {
      this.validCpf = true;
      this.citizenUserNotFoundByCpf = false;
      this.person = undefined;
      this.setStakeholderFormFromPerson();
    }
  }

  validateClearSearchUserByEmail(event) {
    if (!event || (event.length === 0)) {
      this.person = undefined;
      this.setStakeholderFormFromPerson();
      this.showMessageInvalidEmail = false;
      this.showMessageNotFoundUserByEmail = false;
    }
  }

  validateClearSearchByUser() {
    this.person = undefined;
    this.setStakeholderFormFromPerson();
    this.publicServersResult = [];
    this.showListBoxPublicServers = false;
    this.showMessagePublicServerNotFoundByName = false;
    this.citizenUserNotFoundByCpf = false;
    this.validCpf = true;
    this.searchedCpfUser = null;
    this.searchedNameUser = null;
  }

  resetPerson() {
    this.person = undefined;
    this.selectedPerson = undefined;
    this.setStakeholderFormFromPerson();
  }

  showFullNamePerson() {
    return !(!this.idPerson && !this.user);
  }

  loadCards() {
    this.cardPerson = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'person',
      collapseble: true,
      initialStateCollapse: false
    };
    this.cardRoles = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'roles',
      collapseble: true,
      initialStateCollapse: false
    };

  }

  loadCardPermissions() {
    if (this.stakeholder && this.stakeholder.person.isUser) {
      this.cardPermissions = {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: 'permissions',
        collapseble: true,
        initialStateCollapse: false
      };
    }
  }

  setStakeholderForm() {
    if (this.stakeholder) {
      this.stakeholderForm.controls.fullName.setValue(this.stakeholder.person.fullName);
      this.stakeholderForm.controls.address.setValue(this.stakeholder.person.address);
      this.stakeholderForm.controls.phoneNumber.setValue(this.formatPhoneNumber(this.stakeholder.person.phoneNumber));
      this.stakeholderForm.controls.contactEmail.setValue(this.stakeholder.person.contactEmail);
      this.stakeholderRoles = this.stakeholder.roles && this.stakeholder.roles.map(role => ({
        id: role.id,
        active: role.active,
        role: role.role,
        from: new Date(role.from + 'T00:00:00'),
        to: role.to ? new Date(role.to + 'T00:00:00') : null
      }));
      this.setStakeholderPermissionsCards();
    }
    this.loadStakeholderRolesCardsItems();
  }

  setStakeholderPermissionsCards() {
    this.stakeholderPermissions = this.stakeholder.permissions;
    const rolesNotPermissions = this.stakeholder.person.roles.filter(r =>
      this.stakeholderPermissions.filter(p => p.role === r.role).length === 0);
    if (rolesNotPermissions && rolesNotPermissions.length > 0) {
      rolesNotPermissions.forEach(r => {
        if (this.stakeholderPermissions && this.stakeholderPermissions.length > 0) {
          this.stakeholderPermissions.push({
            role: r.role,
            level: 'None'
          });
        } else {
          this.stakeholderPermissions = [
            {
              role: r.role,
              level: 'None'
            }
          ];
        }
      });
    }
  }

  async searchUserByEmail() {
    if (this.searchedEmailUser && this.searchedEmailUser.length > 5 && this.searchedEmailUser.split('@').length > 1) {
      const {data} = await this.personSrv.GetByKey(this.searchedEmailUser, {
        idOffice: this.idOffice,
      });
      if (data) {
        this.person = data;
        this.showMessageNotFoundUserByEmail = false;
      } else {
        this.person = {
          name: this.searchedEmailUser.split('@')[0],
          fullName: this.searchedEmailUser.split('@')[0],
          email: this.searchedEmailUser
        };
        this.showMessageNotFoundUserByEmail = true;
      }
      this.setStakeholderFormFromPerson();
      this.stakeholderPermissions = [{
        role: 'Citizen',
        level: 'None'
      }];
    } else {
      this.person = null;
      this.setStakeholderFormFromPerson();
      this.showMessageInvalidEmail = true;
    }
  }

  async searchCitizenUserByName() {
    this.publicServersResult = [];
    if (this.person) {
      this.person = undefined;
      this.setStakeholderFormFromPerson();
    }
    this.isLoading = true;
    const result = await this.citizenUserSrv.GetPublicServersByName({
      name: this.searchedNameUser,
      idOffice: this.idOffice
    });
    this.isLoading = false;
    if (result.success) {
      this.publicServersResult = result.data;
      this.showListBoxPublicServers = this.publicServersResult.length > 0;
    }
    this.showMessagePublicServerNotFoundByName =
      !this.publicServersResult || (this.publicServersResult && this.publicServersResult.length === 0);
  }

  async validateCpf() {
    this.citizenUserNotFoundByCpf = false;
    this.validCpf = cpfValidator(this.searchedCpfUser);
    if (this.validCpf) {
      this.isLoading = true;
      const result = await this.citizenUserSrv.GetCitizenUserByCpf({
        cpf: this.searchedCpfUser,
        idOffice: this.idOffice,
        loadWorkLocation: false
      });
      this.isLoading = false;
      if (result.success) {
        this.person = result.data;
        this.setStakeholderFormFromPerson();
      } else {
        this.citizenUserNotFoundByCpf = true;
      }
    }
  }

  handleToggleUser(event) {
    this.person = undefined;
    this.setStakeholderFormFromPerson();
    this.personSearchBy = null;
    this.citizenSearchBy = null;
    this.searchedNameUser = null;
    this.searchedCpfUser = null;
    this.searchedEmailUser = null;
    this.selectedPerson = null;
    this.resultPersonsByName = [];
    this.notFoundPerson = false;
    this.validCpf = true;
    this.publicServersResult = [];
    this.citizenUserNotFoundByCpf = false;
    this.showMessageNotFoundUserByEmail = false;
    this.showListBoxPublicServers = false;
    this.showMessagePublicServerNotFoundByName = false;
    this.showMessageInvalidEmail = false;
    this.saveButton.hideButton();
    if (event === true) {
      this.cardPermissions = {
        toggleable: false,
        initialStateToggle: false,
        cardTitle: 'permissions',
        collapseble: true,
        initialStateCollapse: false
      };
    } else {
      this.cardPermissions = undefined;
    }
  }

  showFormPerson() {
    if (this.stakeholder || this.person) {
      return true;
    }
    return this.personSearchBy === 'NEW';
  }

  async handleSelectedPublicServer(event) {
    this.isLoading = true;
    const publicServer = event.value;
    const result = await this.citizenUserSrv.GetPublicServer(publicServer.sub, {
      idOffice: this.idOffice,
      loadWorkLocation: false
    });
    this.isLoading = false;
    if (result.success) {
      this.person = result.data;
      this.setStakeholderFormFromPerson();
      this.searchedNameUser = '';
      this.publicServersResult = [];
      this.showListBoxPublicServers = false;
    }
  }

  setStakeholderFormFromPerson() {
    if (this.person) {
      this.stakeholderForm.controls.fullName.setValue(this.person.fullName);
      this.stakeholderForm.controls.address.setValue(this.person.address);
      this.stakeholderForm.controls.phoneNumber.setValue(this.formatPhoneNumber(this.person.phoneNumber));
      this.stakeholderForm.controls.contactEmail.setValue(this.person.contactEmail);
      if (this.person.roles && this.user) {
        this.stakeholderPermissions = this.person.roles.map(r => ({
          role: r.role,
          level: 'None'
        }));
      }
      this.loadStakeholderRolesCardsItems();
    } else {
      this.stakeholderForm.controls.fullName.setValue('');
      this.stakeholderForm.controls.address.setValue('');
      this.stakeholderForm.controls.phoneNumber.setValue('');
      this.stakeholderForm.controls.contactEmail.setValue('');
      this.stakeholderRoles = null;
      this.stakeholderPermissions = [];
    }
  }

  loadStakeholderRolesCardsItems() {
    if (this.stakeholderRoles) {
      this.stakeholderRolesCardItems = this.stakeholderRoles.map(role => ({
        type: 'role-card',
        role,
        personRoleOptions: this.personRolesOptions
      }));
      this.stakeholderRolesCardItems.push({
        type: 'new-role-card'
      });
    } else {
      this.stakeholderRolesCardItems = [{
        type: 'new-role-card'
      }];
    }
  }

  createNewCardItemRole() {
    if (this.stakeholderForm.invalid) {
      setTimeout(() => {
        this.messageSrv.add({
          severity: 'warn',
          summary: 'Erro',
          detail: this.translateSrv.instant('messages.personNotFound')
        });
      }, 500);
      return;
    }
    if (this.stakeholderRoles) {
      this.stakeholderRoles.push({
        role: '',
        active: true,
        from: new Date(),
        to: null
      });
    } else {
      this.stakeholderRoles = [{
        role: '',
        active: true,
        from: new Date(),
        to: null
      }];
    }
    this.loadStakeholderRolesCardsItems();
  }

  handleShowSaveButton() {
    if (this.stakeholderForm.valid) {
      return this.validateStakeholder()
        ? this.saveButton?.showButton()
        : this.saveButton?.hideButton();
    } else {
      this.saveButton?.hideButton();
    }
  }

  async saveStakeholder() {
    if (!this.stakeholderForm.valid) {
      return;
    }
    const validated = this.validateStakeholder();
    if (!validated) {
      return;
    }
    const permissions = this.stakeholderPermissions?.filter(permission =>
      !permission.inheritedFrom && permission.level && permission.level !== 'None');
    const stakeholderModel = ((!this.user && !this.stakeholder) || (this.stakeholder && !this.stakeholder.person.isUser)) ? {
      idWorkpack: this.idWorkpack,
      person: {
        ...this.person,
        fullName: this.selectedPerson ? this.selectedPerson.fullName : this.stakeholderForm.controls.fullName.value,
        address: this.stakeholderForm.controls.address.value,
        contactEmail: this.stakeholderForm.controls.contactEmail.value,
        phoneNumber: this.stakeholderForm.controls.phoneNumber.value
          ? this.stakeholderForm.controls.phoneNumber.value.replace(/\D+/g, '') : null,
        isUser: false
      },
      roles: this.stakeholderRoles && this.stakeholderRoles.map(r => ({
        ...r,
        to: r.to !== null ? formatDateToString(r.to as Date, true) : null,
        from: formatDateToString(r.from as Date, true)
      })),
      idPlan: this.idPlan,
    } : {
      idWorkpack: this.idWorkpack,
      person: {
        ...(this.person ? this.person : this.stakeholder.person),
        fullName: this.person ? this.person.fullName : this.stakeholder.person.fullName,
        email: this.stakeholder ? this.stakeholder.person.email : this.person.email,
        address: this.stakeholderForm.controls.address.value,
        contactEmail: this.stakeholderForm.controls.contactEmail.value,
        phoneNumber: this.stakeholderForm.controls.phoneNumber.value
          ? this.stakeholderForm.controls.phoneNumber.value.replace(/\D+/g, '') : null,
        isUser: true
      },
      roles: this.stakeholderRoles && this.stakeholderRoles.map(r => ({
        ...r,
        to: r.to !== null ? formatDateToString(r.to as Date, true) : null,
        from: formatDateToString(r.from as Date, true)
      })),
      idPlan: this.idPlan,
      permissions
    };
    if (this.idPerson) {
      const result = await this.stakeholderSrv.putStakeholderPerson(stakeholderModel);
      if (result.success) {
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
        await this.router.navigate(
          ['/workpack'],
          {
            queryParams: {
              id: this.idWorkpack,
              idPlan: this.idPlan,
              idWorkpackModelLinked: this.idWorkpackModelLinked
            }
          }
        );
      }
    } else {
      const result = await this.stakeholderSrv.postStakeholderPerson(stakeholderModel);
      if (result.success) {
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
        await this.router.navigate(
          ['/workpack'],
          {
            queryParams: {
              id: this.idWorkpack,
              idPlan: this.idPlan,
              idWorkpackModelLinked: this.idWorkpackModelLinked
            }
          }
        );
      }
    }
  }

  validateStakeholder() {
    // non-user should have roles
    if (((!this.user && !this.stakeholder) || (this.stakeholder && !this.stakeholder.person.isUser)) && !this.stakeholderRoles) {
      return false;
    }
    const roleNotOk = this.stakeholderRoles && this.stakeholderRoles.filter(r => {
      if (!r.role || r.to && (r.from > r.to || r.to < r.from)) {
        return r;
      }
    });
    if (roleNotOk && roleNotOk.length > 0) {
      return false;
    }
    // user should have permissions
    return !(((this.user && !this.stakeholder) || (this.stakeholder && this.stakeholder.person.isUser && !this.idPerson))
      && (!this.stakeholderPermissions || (this.stakeholderPermissions && (this.stakeholderPermissions.length === 0
          || this.stakeholderPermissions.filter(permission => permission.level.toLowerCase() !== 'none').length === 0))
      ));
  }
}
