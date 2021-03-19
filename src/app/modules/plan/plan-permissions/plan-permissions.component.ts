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

  idPlan: number;
  propertiesPlan: IPlan;
  idOffice: number;
  propertiesOffice: IOffice;
  cardPersonPermission: ICard;
  personEmail: string;
  responsive: boolean;
  searchedEmailPerson: string;
  permission: IPlanPermission;
  person: IPerson;
  showSearchInputMessage = false;
  cardItemsPlanPermission: ICardItemPermission[];
  debounceSearch = new Subject();
  $destroy = new Subject();
  invalidMailMessage: string;

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
    private officeSrv: OfficeService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idPlan = queryParams.idPlan;
      this.personEmail = queryParams.email;
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
    this.planSrv.nextIDPlan(this.idPlan);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    await this.loadPermission();
    await this.loadPropertiesPlan();
    await this.loadPropertiesOffice();
  }

  async loadPropertiesPlan() {
    const { success, data } = await this.planSrv.GetById(this.idPlan);
    if (success) {
      this.propertiesPlan = data;
    }
  }

  async loadPropertiesOffice() {
    this.idOffice = this.propertiesPlan?.idOffice;
    const { success, data } = await this.officeSrv.GetById(this.idOffice);
    if (success) {
      this.propertiesOffice = data;
    }
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
        queryParams: { idPlan: this.idPlan, email: this.personEmail },
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

  async loadPermission() {
    this.cardPersonPermission = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'permissions',
      collapseble: true,
      initialStateCollapse: false
    };
    if (this.personEmail) {
      const result = await this.planPermissionSrv.GetAll({email: this.personEmail, 'id-plan': this.idPlan});
      if (result.success) {
        this.permission = result.data[0];
      }
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
      this.cardItemsPlanPermission = this.permission.permissions.map(p => ({
        typeCardItem: 'editItem',
        titleCardItem: p.role,
        levelListOptions: [
          { label: this.translateSrv.instant('read'), value: 'READ' },
          { label: this.translateSrv.instant('edit'), value: 'EDIT' }
        ],
        selectedOption: p.level
      }));
    } else {
      this.cardItemsPlanPermission = null;
    }
  }

  async searchPerson() {
    this.saveButton?.hideButton();
    if (this.searchedEmailPerson) {
      const { data } = await this.personSrv.GetByEmail(this.searchedEmailPerson);
      if (data) {
        this.showSearchInputMessage = false;
        this.person = data;
      } else {
        const email = this.searchedEmailPerson.split('@');
        const name = email[0];
        this.person = {
          name,
          email: this.searchedEmailPerson,
          roles: [ 'user' ]
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
        idPlan: this.idPlan,
        email: this.person.email,
        permissions
      };
    } else {
      this.permission = null;
    }
    this.loadCardItemsPersonPermissions();
  }

  async savePermission() {
    this.permission.permissions = this.cardItemsPlanPermission.map(cardItem => (
      {
        id: cardItem.itemId,
        role: cardItem.titleCardItem,
        level: cardItem.selectedOption
      }
    ));
    const { success } = this.personEmail
      ? await this.planPermissionSrv.put({
          email: this.permission.person.email,
          idPlan: this.permission.idPlan,
          permissions: this.permission.permissions
        })
      : await this.planPermissionSrv.post({
          email: this.permission.email,
          idPlan: this.permission.idPlan,
          permissions: this.permission.permissions
        });
    if (success) {
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.router.navigate([ '/plan', 'permission' ], { queryParams: { idPlan: this.idPlan }});
    }
  }
}
