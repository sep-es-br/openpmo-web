import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { StakeholderService } from 'src/app/shared/services/stakeholder.service';
import { IStakeholder, IStakeholderRole, IStakeholderPermission } from 'src/app/shared/interfaces/IStakeholder';
import { IWorkpack } from 'src/app/shared/interfaces/IWorkpack';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { PersonService } from 'src/app/shared/services/person.service';
import { enterLeave } from '../../../shared/animations/enterLeave.animation';
import { formatDateToString } from 'src/app/shared/utils/formatDateToString';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';

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
    enterLeave({ opacity: 0, pointerEvents: 'none' }, { opacity: 1, pointerEvents: 'all' }, 300)
  ]
})
export class StakeholderPersonComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  idWorkpack: number;
  workpack: IWorkpack;
  personRolesOptions: { label: string; value: string }[];
  person: IPerson;
  cardPerson: ICard;
  cardRoles: ICard;
  cardPermissions: ICard;
  emailPerson: string;
  responsive: boolean;
  searchedEmailPerson: string;
  stakeholder: IStakeholder;
  stakeholderForm: FormGroup;
  stakeholderRoles: IStakeholderRole[];
  stakeholderRolesCardItems: ICardItemRole[];
  stakeholderPermissions: IStakeholderPermission[];
  showSearchInputMessage = false;
  permissionLevelListOptions = [
    { label: this.translateSrv.instant('read'), value: 'READ' },
    { label: this.translateSrv.instant('edit'), value: 'EDIT' },
    { label: this.translateSrv.instant('none'), value: 'None' }
  ];
  debounceSearch = new Subject<string>();
  $destroy = new Subject();

  constructor(
    private actRouter: ActivatedRoute,
    private responsiveSrv: ResponsiveService,
    private workpackSrv: WorkpackService,
    private stakeholderSrv: StakeholderService,
    private translateSrv: TranslateService,
    private location: Location,
    private formBuilder: FormBuilder,
    private personSrv: PersonService,
    private messageSrv: MessageService,
    private breadcrumbSrv: BreadcrumbService,
    private router: Router
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idWorkpack = queryParams.idWorkpack;
      this.emailPerson = queryParams.emailPerson;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.stakeholderForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: [''],
      address: [''],
      phoneNumber: [''],
      contactEmail: ['', Validators.email],
      id: ''
    });
    this.debounceSearch.pipe(debounceTime(500), takeUntil(this.$destroy)).subscribe(() => this.searchPerson());
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    await this.loadWorkpack();
    await this.loadStakeholder();
    const propertyNameWorkpackModel = this.workpack.model.properties.find(p => p.name === 'name' && p.session === 'PROPERTIES');
    const propertyNameWorkpack = this.workpack.properties.find(p => p.idPropertyModel === propertyNameWorkpackModel.id);
    const workpackName = propertyNameWorkpack.value as string;
    const propertyFullNameWorkpackModel = this.workpack.model.properties.find(p => p.name === 'fullName' && p.session === 'PROPERTIES');
    const propertyFullNameWorkpack = this.workpack.properties.find(p => p.idPropertyModel === propertyFullNameWorkpackModel.id);
    const workpackFullName = propertyFullNameWorkpack.value as string;
    this.breadcrumbSrv.setMenu([
      {
        key: this.workpack.type,
        info: workpackName,
        tooltip: workpackFullName,
        routerLink: [ '/workpack' ],
        queryParams: { id: this.idWorkpack }
      },
      {
        key: 'stakeholder',
        routerLink: ['/stakeholder/person'],
        queryParams: { idWorkpack: this.idWorkpack, emailPerson: this.emailPerson },
        info: this.stakeholder?.person?.name,
        tooltip: this.stakeholder?.person.fullName
      }
    ]);
  }

  async loadWorkpack() {
    const result = await this.workpackSrv.GetById(this.idWorkpack);
    if (result.success) {
      this.workpack = result.data;
      this.personRolesOptions = this.workpack?.model?.personRoles?.map(role => ({ label: role, value: role }));
    }
  }

  async loadStakeholder() {
    this.loadCards();
    if (this.emailPerson) {
      const result = await this.stakeholderSrv.GetStakeholderPerson({'id-workpack': this.idWorkpack, email: this.emailPerson});
      if (result.success) {
        this.stakeholder = result.data;
      }
    }
    this.setStakeholderForm();
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
    this.cardPermissions = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'permissions',
      collapseble: true,
      initialStateCollapse: false
    };
  }

  setStakeholderForm() {
    if (this.stakeholder) {
      this.stakeholderForm.controls.name.setValue(this.stakeholder.person.name);
      this.stakeholderForm.controls.fullName.setValue(this.stakeholder.person.fullName);
      this.stakeholderForm.controls.email.setValue(this.stakeholder.person.email);
      this.stakeholderForm.controls.address.setValue(this.stakeholder.person.address);
      this.stakeholderForm.controls.phoneNumber.setValue(this.stakeholder.person.phoneNumber);
      this.stakeholderForm.controls.contactEmail.setValue(this.stakeholder.person.contactEmail);
      this.stakeholderRoles = this.stakeholder.roles && this.stakeholder.roles.map( role => ({
        id: role.id,
        active: role.active,
        role: role.role,
        from: new Date(role.from + 'T00:00:00'),
        to: role.to ? new Date(role.to + 'T00:00:00') : null
      }));
      this.stakeholderPermissions = this.stakeholder.permissions;
    }
    if (!this.stakeholderPermissions) {
      this.stakeholderPermissions = [{
        role: 'User',
        level: 'None'
      }];
    }
    this.loadStakeholderRolesCardsItems();
  }

  async searchPerson() {
    if (this.searchedEmailPerson) {
      const { data} = await this.personSrv.GetByEmail(this.searchedEmailPerson);
      if (data) {
        this.showSearchInputMessage = false;
        this.person = data;
      } else {
        this.showSearchInputMessage = true;
        this.person = null;
      }
      this.setStakeholderFormFromPerson();
    } else {
      this.person = null;
      this.setStakeholderFormFromPerson();
      this.showSearchInputMessage = false;
    }
  }

  setStakeholderFormFromPerson() {
    if (this.person) {
      this.stakeholderForm.controls.name.setValue(this.person.name);
      this.stakeholderForm.controls.fullName.setValue(this.person.fullName);
      this.stakeholderForm.controls.email.setValue(this.person.email);
      this.stakeholderForm.controls.address.setValue(this.person.address);
      this.stakeholderForm.controls.phoneNumber.setValue(this.person.phoneNumber);
      this.stakeholderForm.controls.contactEmail.setValue(this.person.contactEmail);
    } else {
      this.stakeholderForm.controls.name.setValue('');
      this.stakeholderForm.controls.fullName.setValue('');
      this.stakeholderForm.controls.email.setValue('');
      this.stakeholderForm.controls.address.setValue('');
      this.stakeholderForm.controls.phoneNumber.setValue('');
      this.stakeholderForm.controls.contactEmail.setValue('');
      this.stakeholderRoles = null;
      this.stakeholderPermissions = [{
        role: 'User',
        level: 'None'
      }];
      this.loadStakeholderRolesCardsItems();
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
        this.messageSrv.add({ severity: 'warn', summary: 'Erro', detail: this.translateSrv.instant('messages.personNotFound') });
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
    }
    return;
  }

  async saveStakeholder() {
    if (!this.stakeholderForm.valid) {
      return;
    }
    const validated = this.validateStakeholder();
    if (!validated) {
      return;
    }
    const permissions = this.stakeholderPermissions.filter( p => p.level !== 'None' );
    const stakeholderModel = {
      idWorkpack: this.idWorkpack,
      name: this.stakeholderForm.controls.name.value,
      fullName: this.stakeholderForm.controls.fullName.value,
      address: this.stakeholderForm.controls.address.value,
      contactEmail: this.stakeholderForm.controls.contactEmail.value,
      email: this.stakeholderForm.controls.email.value,
      phoneNumber: this.stakeholderForm.controls.phoneNumber.value,
      roles: this.stakeholderRoles.map( r => ({
        ...r,
        to: r.to !== null ? formatDateToString(r.to as Date, true) : null,
        from: formatDateToString(r.from as Date, true)
      })),
      permissions
    };

    if (this.emailPerson) {
      const result = await this.stakeholderSrv.putStakeholderPerson(stakeholderModel);
      if (result.success) {
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
        this.router.navigate(
          ['/workpack'],
          {
            queryParams: {
              id: this.idWorkpack
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
        this.router.navigate(
          ['/workpack'],
          {
            queryParams: {
              id: this.idWorkpack
            }
          }
        );
      }
    }
  }

  validateStakeholder() {
    if(!this.stakeholderRoles) {
      return false;
    }
    const roleNotOk = this.stakeholderRoles.filter( r => {
      if( !r.role) {
        return r;
      }
      if (r.to) {
        if (r.from > r.to || r.to < r.from) {
          return r;
        }
      }
    });
    if(roleNotOk && roleNotOk.length > 0) {
      return false;
    }
    return true;
  }
}
