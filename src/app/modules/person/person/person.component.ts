import { OfficePermissionService } from './../../../shared/services/office-permission.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { OfficeService } from './../../../shared/services/office.service';
import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { PersonService } from 'src/app/shared/services/person.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { Location } from '@angular/common';
import { MinLengthTextCustomValidator } from 'src/app/shared/utils/minLengthTextValidator';
import { SetConfigWorkpackService } from 'src/app/shared/services/set-config-workpack.service';
import { CancelButtonComponent } from 'src/app/shared/components/cancel-button/cancel-button.component';

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent implements OnInit, OnDestroy {
  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChild(CancelButtonComponent) cancelButton: CancelButtonComponent;

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    collapseble: true,
    initialStateCollapse: false
  };
  cardsPlans: ICard[] = [];
  isListEmpty = false;
  office: IOffice;
  idOffice: number;
  idPerson: number;
  responsive: boolean;
  $destroy = new Subject();
  isUserAdmin: boolean;
  propertiesPerson: IPerson;
  formPerson: FormGroup;
  phoneNumberPlaceholder = '';
  loading = false;
  changedAvatar = false;
  deletedAvatar = false;
  avatarData;
  oldAvatar;
  isLoading = false;
  formIsSaving = false;

  constructor(
    private personSrv: PersonService,
    private router: Router,
    private authSrv: AuthService,
    private activeRoute: ActivatedRoute,
    private responsiveSvr: ResponsiveService,
    private formBuilder: FormBuilder,
    private translateSrv: TranslateService,
    private messageSrv: MessageService,
    private breadcrumbSrv: BreadcrumbService,
    private officeSrv: OfficeService,
    private location: Location,
    private officePermissionSrv: OfficePermissionService,
    private setConfigWorkpackSrv: SetConfigWorkpackService
  ) {
    this.activeRoute.queryParams.subscribe(async({ idOffice, idPerson }) => {
      this.idOffice = +idOffice;
      this.idPerson = +idPerson;
      await this.loads();
    });
    this.formPerson = this.formBuilder.group({
      name: ['', [Validators.required, MinLengthTextCustomValidator.minLengthText]],
      fullName: ['', [Validators.required, MinLengthTextCustomValidator.minLengthText]],
      email: [''],
      contactEmail: ['', [Validators.email]],
      phoneNumber: [''],
      address: ['']
    });
    this.formPerson.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formPerson.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formPerson.dirty && this.formPerson.valid))
      .subscribe(() => { this.saveButton.showButton(); });
    this.formPerson.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formPerson.dirty))
      .subscribe(() => { this.cancelButton.showButton(); });
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  async ngOnInit() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    const editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    if (!isUserAdmin && !editPermission) {
      this.router.navigate(['/offices']);
    }
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  setPhoneNumberMask() {
    const valor = this.formPerson.controls.phoneNumber.value;
    if (!valor || valor.length === 0) {
      this.phoneNumberPlaceholder = '';
      return;
    }
    if (valor.length < 10 && valor) {
      this.formPerson.controls.phoneNumber.setValue(null);
      return;
    }
    const retorno = this.formatPhoneNumber(valor);
    this.formPerson.controls.phoneNumber.setValue(retorno);
  }

  formatPhoneNumber(value: string) {
    if(!value) {return value;}
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
    const valor = this.formPerson.controls.phoneNumber.value;
    if (!valor || valor.length === 0) {
      this.phoneNumberPlaceholder = '(99) 99999-9999';
    }
  }


  async loads() {
    this.isLoading = true;
    await this.loadOffice();
    await this.loadPerson();
    await this.loadUserAdmin();
    this.isLoading = false;
    this.setBreadcrumb();
  }

  async loadOffice() {
    this.office = await this.officeSrv.getCurrentOffice(this.idOffice);
  }

  async loadPerson() {
    this.loading = this.formIsSaving ? false : true;
    const { success, data } = await this.personSrv.GetByIdAndOffice(this.idPerson, this.idOffice);
    if (success) {
      this.propertiesPerson = data;
      this.setFormPerson(data);
      this.setCardsPlans(data);
    }
  }

  async loadUserAdmin() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
  }

  setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'administration',
        info: this.office?.name,
        tooltip: this.office?.fullName,
        routerLink: ['/configuration-office'],
        admin: true,
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'configuration',
        info: 'persons',
        tooltip: this.translateSrv.instant('measureUnits'),
        routerLink: ['/persons'],
        admin: true,
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'profile',
        admin: true,
        routerLink: ['/configuration-office/persons/person'],
        queryParams: { idOffice: this.idOffice, idPerson: this.idPerson }
      },
    ]);
  }

  setFormPerson(person: IPerson) {
    this.formPerson.reset({
      name: person?.name,
      fullName: person?.fullName,
      email: person?.email,
      contactEmail: person?.contactEmail,
      phoneNumber: this.formatPhoneNumber(person.phoneNumber),
      address: person?.address
    });
  }

  setCardsPlans(person: IPerson) {
    this.cardsPlans = person?.officePermission?.planPermissions?.filter(planPermission =>
      planPermission.accessLevel !== 'NONE' || (planPermission.accessLevel === 'NONE'
        && planPermission.workpacksPermission && planPermission.workpacksPermission.length > 0))
      .map(plan => ({
        toggleable: false,
        initialStateToggle: false,
        collapseble: true,
        initialStateCollapse: false,
        cardTitle: plan.name,
        cardItems: plan.workpacksPermission.map(workpack => {
          const urlCard = workpack.ccbMember === true ? `/workpack/change-control-board/member` : `/stakeholder/person`;
          const queryParams = workpack.ccbMember ?
            {
              idProject: workpack.id,
              idPerson: this.propertiesPerson.id,
              idMember: this.propertiesPerson.id,
              idOffice: this.idOffice,
              idPlan: plan.id
            } :
            {
              idWorkpack: workpack.id,
              idPerson: this.propertiesPerson.id,
              idPlan: plan.id
            };
          const cardItem: ICardItem = {
            icon: workpack.icon,
            typeCardItem: 'listItemPermissionWorkpack',
            itemId: workpack.id,
            nameCardItem: workpack.name,
            subtitleCardItem: workpack?.roles?.map(role => this.translateSrv.instant(role)).join(', '),
            statusItem: workpack.ccbMember === true ? 'ccbMember' : workpack.accessLevel !== 'NONE' ? workpack.accessLevel : null,
            onClick: async() => await this.loadWorkpackConfig(plan.id, workpack.id, urlCard, queryParams)
          };
          return cardItem;
        }),
      }));
    this.loading = false;
  }

  async loadWorkpackConfig(idPlan, idWorkpack, url, queryParams) {
    this.router.navigate([url], {
      queryParams
    });
  }

  navigateToPage(url: string, key: string, idOffice?: number, idPlan?: number) {
    this.router.navigate([`${url}`]);
    this.router.navigate([url], { queryParams: { idPlan, key, idOffice } });
  }

  async handleDeleteAllPermissions(event) {
    this.isLoading = true;
    const result = await this.personSrv.DeleteAllPermissions({
      ...this.propertiesPerson,
      ...this.formPerson.value,
    }, this.propertiesPerson.id, this.idOffice);
    if (result) {
      this.isLoading = false;
      this.location.back();
    }
  }

  handleChangeAvatar(event) {
    this.oldAvatar = this.propertiesPerson.avatar;
    this.propertiesPerson.avatar = event;
    this.avatarData = event;
    this.changedAvatar = true;
    this.cancelButton.showButton();
    if (this.formPerson.valid) {
      this.saveButton.showButton();
    }
  }

  async handleDeleteAvatar() {
    this.deletedAvatar = true;
    this.cancelButton.showButton();
    if (this.formPerson.valid) {
      this.saveButton.showButton();
    }
  }

  async savePerson() {
    this.cancelButton.hideButton();
    this.formIsSaving = true;
    if (this.changedAvatar) {
      await this.updateAvatar();
    }
    if (this.deletedAvatar) {
      await this.personSrv.deleteAvatar(this.idPerson, { 'id-office': this.idOffice });
      this.deletedAvatar = false;
    }
    let phoneNumber = this.formPerson.controls.phoneNumber.value;
    if (phoneNumber) {
      phoneNumber = phoneNumber.replace(/[^0-9]+/g, '');
    }
    const { success, data } = await this.personSrv.PutWithContactOffice({
      ...this.propertiesPerson,
      ...this.formPerson.value,
      phoneNumber,
      email: null,
      idOffice: this.idOffice
    });
    if (success) {
      await this.loadPerson();
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.formIsSaving = false;
    }
  }

  async updateAvatar() {
    const {
      formData,
      hasAvatar
    } = this.avatarData;
    let result;
    if (hasAvatar) {
      result = await this.personSrv.putAvatar(formData, this.idPerson, { 'id-office': this.idOffice });
    } else {
      result = await this.personSrv.postAvatar(formData, this.idPerson, { 'id-office': this.idOffice });
    }
    if (result.success) {
      this.changedAvatar = false;
    }
  }

  handleOnCancel() {
    this.saveButton.hideButton();
    if (this.changedAvatar) {
      this.propertiesPerson.avatar = this.oldAvatar ? {...this.oldAvatar} : undefined;
      this.changedAvatar = false;
    }
    if (this.deletedAvatar) {
      this.propertiesPerson.avatar = {
        ...this.propertiesPerson.avatar
      };
      this.deletedAvatar = false;
    }
    this.setFormPerson(this.propertiesPerson);
  }


}
