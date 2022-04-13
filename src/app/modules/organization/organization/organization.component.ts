import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {Subject} from 'rxjs';
import {filter, takeUntil} from 'rxjs/operators';
import {MessageService} from 'primeng/api';

import {ICard} from 'src/app/shared/interfaces/ICard';
import {ResponsiveService} from 'src/app/shared/services/responsive.service';
import {OrganizationService} from 'src/app/shared/services/organization.service';
import {IOrganization} from 'src/app/shared/interfaces/IOrganization';
import {TypeOrganization} from 'src/app/shared/enums/TypeOrganization';
import {BreadcrumbService} from 'src/app/shared/services/breadcrumb.service';
import {SaveButtonComponent} from 'src/app/shared/components/save-button/save-button.component';
import {AuthService} from 'src/app/shared/services/auth.service';
import {IOffice} from 'src/app/shared/interfaces/IOffice';
import {OfficePermissionService} from 'src/app/shared/services/office-permission.service';
import {OfficeService} from 'src/app/shared/services/office.service';

@Component({
  selector: 'app-organization',
  templateUrl: './organization.component.html',
  styleUrls: ['./organization.component.scss']
})
export class OrganizationComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  propertiesOrganization: IOrganization;
  optionsSector;
  responsive = false;
  formOrganization: FormGroup;
  idOffice: number;
  propertiesOffice: IOffice;
  idOrganization: number;
  cardProperties: ICard;
  $destroy = new Subject();
  isUserAdmin: boolean;
  editPermission: boolean;
  phoneNumberPlaceholder = '';

  constructor(
    private formBuilder: FormBuilder,
    private organizationSvr: OrganizationService,
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private responsiveSvr: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private officeSrv: OfficeService,
    private messageSrv: MessageService
  ) {
    this.formOrganization = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: ['', [Validators.required]],
      address: '',
      contactEmail: ['', Validators.email],
      phoneNumber: '',
      sector: null,
      website: ''
    });
    this.formOrganization.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton.hideButton());
    this.formOrganization.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formOrganization.dirty))
      .subscribe(() => this.saveButton.showButton());
    this.optionsSector = [
      {name: translateSrv.instant(TypeOrganization.Private), value: TypeOrganization.Private.toLocaleUpperCase()},
      {name: translateSrv.instant(TypeOrganization.Public), value: TypeOrganization.Public.toLocaleUpperCase()},
      {name: translateSrv.instant(TypeOrganization.Third), value: TypeOrganization.Third.toLocaleUpperCase()}
    ];
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.activeRoute.queryParams.subscribe(({id, idOffice}) => {
      this.idOrganization = +id;
      this.idOffice = +idOffice;
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    if (!this.isUserAdmin && !this.editPermission) {
      await this.router.navigate(['/offices']);
    }
    this.loadCard();
    await this.loadPropertiesOrganization();
    const resultOffice = await this.officeSrv.GetById(this.idOffice);
    if (resultOffice.success) {
      this.propertiesOffice = resultOffice.data;
    }
    this.breadcrumbSrv.setMenu([
      {
        key: 'administration',
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName,
        routerLink: ['/configuration-office'],
        queryParams: {idOffice: this.idOffice}
      },
      {
        key: 'configuration',
        info: 'organizations',
        tooltip: this.translateSrv.instant('organizations'),
        routerLink: ['/organizations'],
        queryParams: {idOffice: this.idOffice}
      },
      {
        key: 'organization',
        info: this.propertiesOrganization?.name,
        tooltip: this.propertiesOrganization?.fullName,
        routerLink: ['/organizations', 'organization'],
        queryParams: {id: this.idOrganization}
      }
    ]);
  }

  loadCard() {
    this.cardProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false
    };
  }

  async loadPropertiesOrganization() {
    if (this.idOrganization) {
      const {data, success} = await this.organizationSvr.GetById(this.idOrganization);
      if (success) {
        this.propertiesOrganization = data;
        this.formOrganization.reset(
          Object.keys(this.formOrganization.controls).reduce((a, key) => (a[key] = data[key] || '', a), {})
        );
        this.formOrganization.controls.phoneNumber.setValue(this.formatPhoneNumber(this.formOrganization.controls.phoneNumber.value));
        if (!this.editPermission) {
          this.formOrganization.disable();
        }
      }
    }
  }

  setPhoneNumberMask() {
    const valor = this.formOrganization.controls.phoneNumber.value;
    if (valor.length < 10 && valor) {
      this.formOrganization.controls.phoneNumber.setValue(null);
      return;
    }
    const retorno = this.formatPhoneNumber(valor);
    this.formOrganization.controls.phoneNumber.setValue(retorno);
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
    const valor = this.formOrganization.controls.phoneNumber.value;
    if (!valor || valor.length === 0) {
      this.phoneNumberPlaceholder = '(99) 99999-9999';
    }
  }

  clearPhoneNumberPlaceholder() {
    this.phoneNumberPlaceholder = '';
  }

  async handleOnSubmit() {
    let phoneNumber = this.formOrganization.controls.phoneNumber.value;
    if (phoneNumber) {
      phoneNumber = phoneNumber.replace(/\D+/g, '');
    }
    const {success} = this.propertiesOrganization
      ? await this.organizationSvr.put({...this.formOrganization.value, id: this.idOrganization})
      : await this.organizationSvr.post({
        ...this.formOrganization.value,
        phoneNumber,
        idOffice: this.idOffice
      });
    if (success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      await this.router.navigate(['/organizations'], {queryParams: {idOffice: this.idOffice}});
    }
  }

}
