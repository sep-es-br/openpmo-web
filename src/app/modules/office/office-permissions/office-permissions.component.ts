import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
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

  idOffice: number;
  cardPersonPermission: ICard;
  personEmail: string;
  responsive: boolean;
  searchedEmailPerson: string;
  permission: IOfficePermission;
  person: IPerson;
  showSearchInputMessage = false;
  cardItemsOfficePermission: ICardItemPermission[];
  debounceSearch = new Subject<string>();
  $destroy = new Subject();
  invalidMailMessage: string;

  constructor(
    private actRouter: ActivatedRoute,
    private responsiveSrv: ResponsiveService,
    private officePermissionsSrv: OfficePermissionService,
    private translateSrv: TranslateService,
    private personSrv: PersonService,
    private location: Location,
    private breadcrumbSrv: BreadcrumbService,
    private messageSrv: MessageService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idOffice = queryParams.idOffice;
      this.personEmail = queryParams.email;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => {
      this.responsive = value;
    });
    this.breadcrumbSrv.setMenu([
      { key: 'offices', routerLink: ['/offices'] },
      { key: 'officePermissions', routerLink: ['/offices', 'permission'], queryParams: { idOffice: this.idOffice }},
      { key: 'permissions', routerLink: ['/offices', 'permission', 'detail'],
        queryParams: { idOffice: this.idOffice, email: this.personEmail }}
    ]);
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
  }

  ngOnInit(): void {
    this.loadPermission();
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

  async loadPermission() {
    this.cardPersonPermission = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'permissions',
      collapseble: true,
      initialStateCollapse: false
    };
    if (this.personEmail) {
      const result = await this.officePermissionsSrv.GetAll({email: this.personEmail, 'id-office': this.idOffice});
      if (result.success) {
        this.permission = result.data[0];
      }
      this.permission.email = this.permission.person.email;
      if (this.permission) {
        this.person = {
          name: this.permission.person.name,
          email: this.permission.person.email,
          roles: this.permission.permissions.map(p => (p.role))
        };
      }
      this.loadCardItemsPersonPermissions();
    }
  }

  loadCardItemsPersonPermissions() {
    if (this.permission) {
      this.cardItemsOfficePermission = this.permission.permissions.map(p => ({
        typeCardItem: 'editItem',
        titleCardItem: p.role,
        levelListOptions: [
          { label: this.translateSrv.instant('read'), value: 'READ' },
          { label: this.translateSrv.instant('edit'), value: 'EDIT' }
        ],
        selectedOption: p.level,
        itemId: p.id
      }));
    } else {
      this.cardItemsOfficePermission = null;
    }
  }

  async searchPerson() {
    this.saveButton?.hideButton();
    if (this.searchedEmailPerson) {
      const { data } = await this.personSrv.GetByEmail(this.searchedEmailPerson);
      if (data) {
        this.showSearchInputMessage = false;
        this.person = data;
      } else  {
        const email = this.searchedEmailPerson.split('@');
        const name = email[0];
        this.person = {
          name,
          email: this.searchedEmailPerson,
          roles: ['user']
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
        ?  this.person.roles.map(p => ({ role: p, level: null }))
        : [{ role: 'User', level: null }];
      this.permission = {
        idOffice: this.idOffice,
        email: this.person.email,
        permissions
      };
    } else {
      this.permission = null;
    }
    this.loadCardItemsPersonPermissions();
  }

  async savePermission() {
    this.saveButton?.hideButton();
    this.permission.permissions = this.cardItemsOfficePermission.map(cardItem => (
      {
        id: cardItem.itemId,
        role: cardItem.titleCardItem,
        level: cardItem.selectedOption
      }
    ));
    const { success } = this.personEmail
      ? await this.officePermissionsSrv.put({
        email: this.permission.person.email,
        idOffice: this.permission.idOffice,
        permissions: this.permission.permissions
      })
      : await this.officePermissionsSrv.post({
        email: this.permission.email,
        idOffice: this.permission.idOffice,
        permissions: this.permission.permissions
      });
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

