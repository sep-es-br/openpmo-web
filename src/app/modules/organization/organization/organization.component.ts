import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Location } from '@angular/common';
import { ActivatedRoute, Router} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

import { ICard } from 'src/app/shared/interfaces/ICard';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { OrganizationService } from 'src/app/shared/services/organization.service';
import { IOrganization } from 'src/app/shared/interfaces/IOrganization';
import { TypeOrganization } from 'src/app/shared/enums/TypeOrganization';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';

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
  idOrganization: number;
  cardProperties: ICard;
  $destroy = new Subject();
  isUserAdmin: boolean;
  editPermission: boolean;
  permissionsOffices: IOffice[];

  constructor(
    private formBuilder: FormBuilder,
    private organizationSvr: OrganizationService,
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private responsiveSvr: ResponsiveService,
    private location: Location,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
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
    this.formOrganization.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formOrganization.dirty))
      .subscribe(() => this.saveButton.showButton());
    this.optionsSector = [
      { name: translateSrv.instant(TypeOrganization.Private), value: TypeOrganization.Private.toLocaleUpperCase() },
      { name: translateSrv.instant(TypeOrganization.Public), value: TypeOrganization.Public.toLocaleUpperCase() },
      { name: translateSrv.instant(TypeOrganization.Third), value: TypeOrganization.Third.toLocaleUpperCase() }
    ];
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.activeRoute.queryParams.subscribe(({ id, idOffice}) => {
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
    await this.loadCard();
    this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
    await this.loadPropertiesOrganization();
    this.breadcrumbSrv.pushMenu({
      key: 'organization',
      info: this.propertiesOrganization?.name,
      tooltip: this.propertiesOrganization?.fullName,
      routerLink: [ '/organizations', 'organization' ],
      queryParams: { id: this.idOrganization }
    });
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
      const { data, success } = await this.organizationSvr.GetById(this.idOrganization);
      if (success) {
        this.propertiesOrganization = data;
        this.formOrganization.setValue(
          Object.keys(this.formOrganization.controls).reduce(( a, key ) => ( a[key] = data[key] || '', a ), { })
        );
        if (!this.editPermission) {
          this.formOrganization.disable();
        }
      }
    }
  }

  async handleOnSubmit() {
    const { success } = this.propertiesOrganization
      ? await this.organizationSvr.put({ ...this.formOrganization.value, id: this.idOrganization })
      : await this.organizationSvr.post({ ...this.formOrganization.value, idOffice: this.idOffice });
    if (success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.location.back();
    }
  }

}
