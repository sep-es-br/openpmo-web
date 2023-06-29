import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { PersonService } from 'src/app/shared/services/person.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MessageService, SelectItem } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';

@Component({
  selector: 'app-person-profile',
  templateUrl: './person-profile.component.html',
  styleUrls: ['./person-profile.component.scss']
})
export class PersonProfileComponent implements OnInit, OnDestroy {
  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    collapseble: false,
    initialStateCollapse: false
  };
  cardsPlans: ICard[] = [];
  idOffice: number;
  idPerson: number;
  responsive: boolean;
  $destroy = new Subject();
  isUserAdmin: boolean;
  optionsOffices: SelectItem[] = [];
  propertiesPerson: IPerson;
  formPerson: FormGroup;
  phoneNumberPlaceholder = '';
  changedAvatar = false;
  deletedAvatar = false;
  avatarData;

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
  ) {
    this.formPerson = this.formBuilder.group({
      name: ['', Validators.required],
      email: [''],
      contactEmail: ['', Validators.email],
      phoneNumber: [''],
      address: [''],
      unify: [false]
    });
    this.formPerson.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton?.hideButton());
    this.formPerson.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formPerson.dirty && this.formPerson.valid))
      .subscribe(() => this.saveButton.showButton());
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  async ngOnInit() {
    await this.loads();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async loads() {
    this.loadIdPerson();
    await this.loadUserAdmin();
    await this.loadOptionsOffices();
    await this.loadPerson();
    this.setBreadcrumb();
  }

  loadIdPerson() {
    this.idPerson = this.authSrv.getIdPerson();
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
    const valor = this.formPerson.controls.phoneNumber.value;
    if (!valor || valor.length === 0) {
      this.phoneNumberPlaceholder = '(99) 99999-9999';
    }
  }

  clearPhoneNumberPlaceholder() {
    this.phoneNumberPlaceholder = '';
  }

  async loadOptionsOffices() {
    const { success, data } = await this.personSrv.getOfficesByPerson(this.idPerson);
    if (success && data) {
      this.optionsOffices = data.map(office => ({ label: office.name, value: office.id }));
      this.idOffice = this.optionsOffices[0]?.value;
    }
  }

  async loadPerson() {
    if (this.idOffice && !this.isUserAdmin) {
      const { success, data } = await this.personSrv.GetByIdAndOffice(this.idPerson, this.idOffice);
      if (success) {
        this.propertiesPerson = data;
        this.setFormPerson(data);
        this.setCardsPlans(data);
      }
    } else {
      if (this.isUserAdmin) {
        const infoPersonByOffice = this.idOffice ? await this.personSrv.GetByIdAndOffice(this.idPerson, this.idOffice) : {
          success: false,
          data: null
        };
        if (!infoPersonByOffice.success || !infoPersonByOffice.data) {
          this.propertiesPerson = await this.authSrv.getInfoPerson();
          if (this.propertiesPerson) {
            this.propertiesPerson.email = this.authSrv.getTokenPayload()?.email;
          }
        } else {
          this.propertiesPerson = infoPersonByOffice.data;
        }
        this.setFormPerson(this.propertiesPerson);
      }
    }
  }

  async loadUserAdmin() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
  }

  setBreadcrumb() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'profile',
        routerLink: ['/persons/profile'],
        queryParams: { idOffice: this.idOffice, idPerson: this.idPerson }
      },
    ]);
  }

  setFormPerson(person: IPerson) {
    this.formPerson.reset({
      name: person?.name,
      email: person?.email,
      contactEmail: person?.contactEmail,
      phoneNumber: this.formatPhoneNumber(person.phoneNumber),
      address: person?.address,
      unify: false
    });
  }

  setCardsPlans(person: IPerson) {
    this.cardsPlans = person?.officePermission?.planPermissions?.map(plan => ({
      toggleable: false,
      initialStateToggle: false,
      collapseble: true,
      initialStateCollapse: false,
      cardTitle: plan.name,
      cardItems: plan.workpacksPermission.map(workpack => {
        const cardItem: ICardItem = {
          icon: workpack.icon,
          typeCardItem: 'listItemPermissionWorkpack',
          itemId: workpack.id,
          urlCard: `/stakeholder/person`,
          paramsUrlCard: [
            { name: 'idWorkpack', value: workpack.id },
            { name: 'idPerson', value: this.propertiesPerson.id },
            { name: 'idPlan', value: plan.id }
          ],
          nameCardItem: workpack.name,
          subtitleCardItem: workpack?.roles?.join(', '),
          statusItem: workpack.ccbMember ? 'ccbMember' : workpack.accessLevel,
          profileView: true
        };
        return cardItem;
      }),
    }));
  }

  async navigateToPage(url: string, email?: string, idOffice?: number, idPlan?: number) {
    await this.router.navigate([`${url}`]);
    await this.router.navigate([url], { queryParams: { idPlan, email, idOffice } });
  }

  async handleChangeOffice(event) {
    this.idOffice = event.value;
    await this.loadPerson();
  }

  handleUnifyOfficesContacts(_event) {
    this.formPerson.patchValue({ unify: true });
    this.saveButton.showButton();
    this.messageSrv.add({
      severity: 'success',
      summary: this.translateSrv.instant('success'),
      detail: this.translateSrv.instant('messages.saveToConfirm')
    });
  }

  handleChangeAvatar(event) {
    this.avatarData = event;
    this.changedAvatar = true;
    if (this.formPerson.valid) {
      this.saveButton.showButton();
    }
  }

  async handleDeleteAvatar() {
    this.deletedAvatar = true;
    if (this.formPerson.valid) {
      this.saveButton.showButton();
    }
  }

  async savePerson() {
    if (this.changedAvatar) {
      await this.updateAvatar();
    }
    if (this.deletedAvatar) {
      await this.personSrv.deleteAvatar(this.idPerson);
      this.deletedAvatar = false;
      this.personSrv.avatarChangedNext(true);
    }
    let phoneNumber = this.formPerson.controls.phoneNumber.value;
    if (phoneNumber) {
      phoneNumber = phoneNumber.replace(/\D+/g, '');
    }
    const sender = this.idOffice ? {
      ...this.propertiesPerson,
      ...this.formPerson.value,
      phoneNumber,
      idOffice: this.idOffice,
      email: null
    } : {
      name: this.formPerson.controls.name.value
    };
    if (this.idOffice) {
      const { success } = await this.personSrv.PutWithContactOffice({
        ...sender
      });
      if (success) {
        await this.loadPerson();
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
      }
    } else {
      const { success } = await this.personSrv.updateNameAdministradorPerson(this.idPerson, sender.name);
      if (success) {
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
      }
    }
  }

  async updateAvatar() {
    const {
      formData,
      hasAvatar
    } = this.avatarData;
    let result;
    if (hasAvatar) {
      result = await this.personSrv.putAvatar(formData, this.idPerson);
    } else {
      result = await this.personSrv.postAvatar(formData, this.idPerson);
    }
    if (result.success) {
      this.changedAvatar = false;
      this.personSrv.avatarChangedNext(true);
    }
  }
}
