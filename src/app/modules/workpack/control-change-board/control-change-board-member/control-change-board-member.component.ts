import { cpfValidator } from 'src/app/shared/utils/cpfValidator';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

import { IOfficePermission } from 'src/app/shared/interfaces/IOfficePermission';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICardItemPermission } from 'src/app/shared/interfaces/ICardItemPermission';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { PersonService } from 'src/app/shared/services/person.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { AuthService } from 'src/app/shared/services/auth.service';
import { enterLeave } from 'src/app/shared/animations/enterLeave.animation';
import { CitizenUserService } from 'src/app/shared/services/citizen-user.service';
import { AuthServerService } from 'src/app/shared/services/auth-server.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IControlChangeBoard } from 'src/app/shared/interfaces/IControlChangeBoard';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { PlanService } from 'src/app/shared/services/plan.service';
import { ControlChangeBoardService } from 'src/app/shared/services/control-change-board.service';

@Component({
  selector: 'app-control-change-board-member',
  templateUrl: './control-change-board-member.component.html',
  styleUrls: ['./control-change-board-member.component.scss'],
  animations: [
    enterLeave({ opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'all' }, 300)
  ]
})
export class ControlChangeBoardMemberComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  idOffice: number;
  idPerson: number;
  idProject: number;
  idPlan: number;
  plan: IPlan;
  propertiesOffice: IOffice;
  cardPerson: ICard;
  cardMemberAs: ICard;
  responsive: boolean;
  searchedEmailPerson: string;
  permission: IOfficePermission;
  currentUserInfo: IPerson;
  showSearchInputMessage = false;
  cardItemsOfficePermission: ICardItemPermission[];
  debounceSearch = new Subject<string>();
  $destroy = new Subject();
  invalidMailMessage: string;
  isReadOnly: boolean;
  citizenAuthServer: boolean;
  citizenSearchBy: string; //CPF | NAME
  searchedNameUser: string;
  searchedCpfUser: string;
  selectedPerson: IPerson;
  validCpf = true;
  publicServersResult: IPerson[];
  citizenUserNotFoundByCpf = false;
  showMessageNotFoundUserByEmail = false;
  showListBoxPublicServers = false;
  showMessagePublicServerNotFoundByName = false;
  showMessageInvalidEmail = false;
  isLoading = false;
  formPerson: FormGroup;
  ccbMember: IControlChangeBoard = {} as IControlChangeBoard;
  isUser = true;

  constructor(
    private actRouter: ActivatedRoute,
    private authSrv: AuthService,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private personSrv: PersonService,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService,
    private router: Router,
    private citizenUserSrv: CitizenUserService,
    private authServerSrv: AuthServerService,
    private formBuilder: FormBuilder,
    private planSrv: PlanService,
    private ccbMemberSrv: ControlChangeBoardService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idPerson = +queryParams.idPerson;
      this.idProject = +queryParams.idProject;
      await this.loadCcbMember();
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.debounceSearch.pipe(debounceTime(500), takeUntil(this.$destroy)).subscribe(() => {
      if (this.searchedEmailPerson.length > 5 && this.validateEmail()) {
        this.searchPerson();
        this.invalidMailMessage = undefined;
      } else {
        this.invalidMailMessage = this.searchedEmailPerson.length > 0 ? this.translateSrv.instant('messages.invalidEmail') : '';
        this.ccbMember.person = null;
      }
    });
    this.ccbMember.person = this.ccbMember.person || {} as IPerson;
    this.ccbMember.person.isUser = true;
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
    this.citizenUserSrv.unloadCitizenUsers();
  }

  async ngOnInit() {
    await this.getAuthServer();
    await this.loadCurrentUserInfo();
    this.loadCards();
    await this.loadPropertiesPlan();
    await this.loadBreadcrumb();
  }

  async loadBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      ...await this.getBreadcrumbs(this.idProject),
      ...[
        {
          key: 'changeControlBoard',
          routerLink: ['/workpack/change-control-board'],
          queryParams: {
            idProject: this.idProject,
          },
        },
        {
          key: 'ccbMember',
          routerLink: ['/workpack/change-control-board/member'],
          queryParams: {
            idProject: this.idProject,
            idPerson: this.idPerson
          },
        }
      ]
    ]);
  }

  loadCards() {
    this.cardPerson = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'person',
      collapseble: true,
      initialStateCollapse: false
    };
    this.cardMemberAs = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'memberAs',
      collapseble: true,
      initialStateCollapse: false
    } as ICard;
  }

  async loadPropertiesPlan() {
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    const { data, success } = await this.planSrv.GetById(this.idPlan);
    if (success) {
      this.plan = data;
    }
  }

  async loadCcbMember() {
    if (this.idPerson && this.idProject) {
      this.idPlan = Number(localStorage.getItem('@currentPlan'));
      const { data, success } = await this.ccbMemberSrv.getCcbMember(
        {
          'id-person': this.idPerson,
          'id-workpack': this.idProject,
          'id-plan': this.idPlan
        });
      if (success) {
        this.ccbMember = data;
        this.setFormPerson(this.ccbMember.person);
        if (!this.ccbMember.memberAs) {
          this.setMemberAsCcbMember(this.ccbMember.person);
        }
        this.saveButton.showButton();
      }
    }
  }

  async getBreadcrumbs(idWorkpack: number) {
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(idWorkpack, { 'id-plan': this.idPlan });
    return success
      ? data.map(p => ({
        key: !p.modelName ? p.type.toLowerCase() : p.modelName,
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: { id: p.id },
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

  setFormPerson(person: IPerson) {
    this.formPerson = this.formBuilder.group({
      address: [person ? person.address : ''],
      phoneNumber: [person ? person.phoneNumber : ''],
      contactEmail: [person ? person.contactEmail : '', Validators.email],
    });
  }

  setMemberAsCcbMember(person: IPerson) {
    this.ccbMember.memberAs = person && person.roles ? person.roles.map(role => ({
      active: false,
      role: role.role,
      workLocation: role.workLocation
    })) : [];
  }

  async getAuthServer() {
    const result = await this.authServerSrv.GetAuthServer();
    if (result.success) {
      this.citizenAuthServer = result.data;
    }
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

  async loadCurrentUserInfo() {
    this.currentUserInfo = await this.authSrv.getInfoPerson();
  }

  async searchPerson() {
    this.saveButton?.hideButton();
    if (this.searchedEmailPerson) {
      const { data } = await this.personSrv.GetByEmail(this.searchedEmailPerson);
      if (data) {
        this.showSearchInputMessage = false;
        this.ccbMember.person = data;
        this.ccbMember.person.email = this.searchedEmailPerson;
        this.showSaveButton();
      } else {
        const email = this.searchedEmailPerson.split('@');
        const name = email[0];
        this.ccbMember.person = {
          name,
          email: this.searchedEmailPerson,
          roles: [{ role: 'citizen' }]
        };
        this.showSaveButton();
      }
    } else {
      this.ccbMember.person = null;
    }
    this.setFormPerson(this.ccbMember.person);
    this.setMemberAsCcbMember(this.ccbMember.person);
  }

  validateClearSearchUserName(event) {
    if (!event || (event.length === 0)) {
      this.publicServersResult = [];
      this.showListBoxPublicServers = false;
      this.showMessagePublicServerNotFoundByName = false;
    }
  }

  validateClearSearchByUser() {
    this.ccbMember.person = undefined;
    this.publicServersResult = [];
    this.showListBoxPublicServers = false;
    this.showMessagePublicServerNotFoundByName = false;
    this.citizenUserNotFoundByCpf = false;
    this.validCpf = true;
    this.searchedCpfUser = null;
    this.searchedNameUser = null;
    this.setFormPerson(this.ccbMember.person);
    this.setMemberAsCcbMember(this.ccbMember.person);
  }

  async searchCitizenUserByName() {
    this.saveButton.hideButton();
    this.publicServersResult = [];
    if (this.ccbMember.person) {
      this.ccbMember.person = undefined;
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
    this.showMessagePublicServerNotFoundByName = !this.publicServersResult ||
      (this.publicServersResult && this.publicServersResult.length === 0);
    this.setFormPerson(this.ccbMember.person);
    this.setMemberAsCcbMember(this.ccbMember.person);
  }

  validateClearSearchByCpf(event) {
    if (!event || (event.length === 0)) {
      this.ccbMember.person = undefined;
      this.validCpf = true;
      this.citizenUserNotFoundByCpf = false;
      this.setFormPerson(this.ccbMember.person);
      this.setMemberAsCcbMember(this.ccbMember.person);
    }
  }

  async validateCpf() {
    this.saveButton.hideButton();
    this.citizenUserNotFoundByCpf = false;
    this.validCpf = cpfValidator(this.searchedCpfUser);
    if (this.validCpf) {
      this.isLoading = true;
      const result = await this.citizenUserSrv.GetCitizenUserByCpf({
        cpf: this.searchedCpfUser,
        idOffice: this.idOffice,
        loadWorkLocation: true
      });
      this.isLoading = false;
      if (result.success) {
        this.ccbMember.person = result.data;
        this.setFormPerson(this.ccbMember.person);
        this.setMemberAsCcbMember(this.ccbMember.person);
        this.showSaveButton();
      } else {
        this.citizenUserNotFoundByCpf = true;
      }
    }
  }

  async handleSelectedPublicServer(event) {
    this.showListBoxPublicServers = false;
    this.isLoading = true;
    const publicServer = event.value;
    const result = await this.citizenUserSrv.GetPublicServer(publicServer.sub, { idOffice: this.idOffice, loadWorkLocation: false });
    this.isLoading = false;
    if (result.success) {
      this.ccbMember.person = result.data;
      this.setFormPerson(this.ccbMember.person);
      this.setMemberAsCcbMember(this.ccbMember.person);
      this.showSaveButton();
      this.searchedNameUser = '';
      this.publicServersResult = [];
      this.showListBoxPublicServers = false;
    }
  }

  showSaveButton() {
    this.saveButton.showButton();
  }

  async saveCcbMember() {
    const sender = {
      ...this.ccbMember,
      idOffice: this.plan.idOffice,
      idWorkpack: this.idProject,
      person: {
        ...this.ccbMember.person,
        ...this.formPerson.value,
        isUser: this.isUser
      }
    } as IControlChangeBoard;
    if (this.idPerson) {
      await this.ccbMemberSrv.Put(sender);
    } else {
      await this.ccbMemberSrv.post(sender);
    }
    this.messageSrv.add({
      severity: 'success',
      summary: this.translateSrv.instant('success'),
      detail: this.translateSrv.instant('messages.savedSuccessfully')
    });
    this.router.navigate(['/workpack/change-control-board'], { queryParams: { idProject: this.idProject } });
  }
}