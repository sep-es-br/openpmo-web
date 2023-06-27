import { CitizenUserService } from './../../../shared/services/citizen-user.service';
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

@Component({
  selector: 'app-person',
  templateUrl: './person.component.html',
  styleUrls: ['./person.component.scss']
})
export class PersonComponent implements OnInit, OnDestroy {
  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

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
    private citizenUserSrv: CitizenUserService
  ) {
    this.activeRoute.queryParams.subscribe(async ({ idOffice, idPerson }) => {
      this.idOffice = +idOffice;
      this.idPerson = +idPerson;
      await this.loads();
    });
    this.formPerson = this.formBuilder.group({
      name: ['', Validators.required],
      fullname: ['', Validators.required],
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
      .subscribe(() => this.saveButton.showButton());
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
    this.citizenUserSrv.unloadCitizenUsers();
  }

  setPhoneNumberMask(){
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
    if (!value) return value;
    let formatedValue = value.replace(/\D/g, "");
    formatedValue = formatedValue.replace(/^0/, "");
    if (formatedValue.length > 10) {
      formatedValue = formatedValue.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
    } else if (formatedValue.length > 5) {
      formatedValue = formatedValue.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    } else if (formatedValue.length > 2) {
      formatedValue = formatedValue.replace(/^(\d\d)(\d{0,5})/, "($1) $2");
    } else {
      if (formatedValue.length != 0) {
        formatedValue = formatedValue.replace(/^(\d*)/, "($1");
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
    await this.loadOffice();
    await this.loadPerson();
    await this.loadUserAdmin();
    this.setBreadcrumb();
  }

  async loadOffice() {
    const result = await this.officeSrv.GetById(this.idOffice);
    if (result.success) {
      this.office = result.data;
    }
  }

  async loadPerson() {
    this.loading = true;
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
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'configuration',
        info: 'persons',
        tooltip: this.translateSrv.instant('measureUnits'),
        routerLink: ['/persons'],
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'profile',
        routerLink: ['/configuration-office/persons/person'],
        queryParams: { idOffice: this.idOffice, idPerson: this.idPerson }
      },
    ]);
  }

  setFormPerson(person: IPerson) {
    this.formPerson.reset({
      name: person?.name,
      fullname: person?.fullName,
      email: person?.email,
      contactEmail: person?.contactEmail,
      phoneNumber: this.formatPhoneNumber(person.phoneNumber),
      address: person?.address
    });
  }

  setCardsPlans(person: IPerson) {
    this.cardsPlans = person?.officePermission?.planPermissions?.filter( planPermission =>
      planPermission.accessLevel !== 'NONE' || (planPermission.accessLevel === 'NONE' && planPermission.workpacksPermission && planPermission.workpacksPermission.length > 0))
      .map(plan => ({
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
          urlCard: workpack.ccbMember ? `/workpack/change-control-board/member` : `/stakeholder/person`,
          paramsUrlCard: workpack.ccbMember ?
          [
            { name: 'idProject',  value: workpack.id },
            { name: 'idPerson', value: this.propertiesPerson.id },
          ]
            : [
            { name: 'idWorkpack', value: workpack.id },
            { name: 'idPerson', value: this.propertiesPerson.id },
            { name: 'idPlan', value: plan.id}
          ],
          nameCardItem: workpack.name,
          subtitleCardItem: workpack?.roles?.map( role => this.translateSrv.instant(role)).join(', '),
          statusItem: workpack.ccbMember ? 'ccbMember' : workpack.accessLevel !== 'NONE' ? workpack.accessLevel : null,
        };
        return cardItem;
      }),
    }));
    this.loading = false;
  }

  navigateToPage(url: string, key: string, idOffice?: number, idPlan?: number) {
    this.router.navigate([`${url}`]);
    this.router.navigate([url], { queryParams: { idPlan, key, idOffice } });
  }

  async handleDeleteAllPermissions(event) {
    const result = await this.personSrv.DeleteAllPermissions({
      ...this.propertiesPerson,
      ...this.formPerson.value,
    }, this.propertiesPerson.id, this.idOffice);
    if (result) {
      this.location.back();
    }
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
      await this.personSrv.deleteAvatar(this.idPerson, {'id-office': this.idOffice});
    }
    let phoneNumber = this.formPerson.controls.phoneNumber.value;
    if (phoneNumber) {
      phoneNumber = phoneNumber.replace(/[^0-9]+/g,'');
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
    }
  }

  async updateAvatar() {
    const {
      formData,
      hasAvatar
    } = this.avatarData;
     if (hasAvatar) {
      const result = await this.personSrv.putAvatar(formData, this.idPerson, {'id-office': this.idOffice});
    } else {
      const result = await this.personSrv.postAvatar(formData, this.idPerson, {'id-office': this.idOffice});
    }
  }

}
