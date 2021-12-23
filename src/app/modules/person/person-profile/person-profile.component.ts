import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { PersonService } from 'src/app/shared/services/person.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { MessageService, SelectItem, TreeNode } from 'primeng/api';
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
    collapseble: true,
    initialStateCollapse: false
  };
  cardsPlans: ICard[] = [];
  isListEmpty = false;
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;

  idOffice: number;
  idPerson: number;
  responsive: boolean;
  $destroy = new Subject();
  isUserAdmin: boolean;
  optionsOffices: SelectItem[] = [];

  propertiesPerson: IPerson;
  formPerson: FormGroup;

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
      phoneNumber: ['', Validators.required],
      address: ['', Validators.required],
      unify: [false, Validators.required]
    });
    this.formPerson.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton.hideButton());
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
    await this.loadOptionsOffices();
    await this.loadPerson();
    await this.loadUserAdmin();
    this.setBreadcrumb();
  }

  loadIdPerson() {
    this.idPerson = this.authSrv.getIdPerson();
  }

  async loadOptionsOffices() {
    const { success, data } = await this.personSrv.getOfficesByPerson(this.idPerson);
    if (success) {
      this.optionsOffices = data.map(office => ({ label: office.name, value: office.id }));
      this.idOffice = this.optionsOffices[0].value;
    }
  }

  async loadPerson() {
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
      phoneNumber: person?.phoneNumber,
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
            { name: 'emailPerson', value: this.propertiesPerson.email }
          ],
          nameCardItem: workpack.name,
          subtitleCardItem: workpack?.roles?.map( r => r.role).join(', '),
          statusItem: this.translateSrv.instant(workpack.accessLevel),
        };
        return cardItem;
      }),
    }));
  }

  navigateToPage(url: string, email?: string, idOffice?: number, idPlan?: number) {
    this.router.navigate([`${url}`]);
    this.router.navigate([url], { queryParams: { idPlan, email, idOffice } });
  }

  async handleChangeOffice(event) {
    this.idOffice = event.value.value;
    await this.loadPerson();
  }

  handleUnifyOfficesContacts(event) {
    this.formPerson.patchValue({ unify: true });
    this.saveButton.showButton();
    this.messageSrv.add({
      severity: 'success',
      summary: this.translateSrv.instant('success'),
      detail: this.translateSrv.instant('messages.saveToConfirm')
    });
  }

  handleChangeCollapseExpandPanel(event) {
    this.collapsePanelsStatus = event.mode === 'collapse' ? true : false;
    this.cardProperties = Object.assign({}, {
      ...this.cardProperties,
      initialStateCollapse: this.collapsePanelsStatus
    });
  }

  handleChangeDisplayMode(event) {
    this.displayModeAll = event.displayMode;
  }

  handleChangePageSize(event) {
    this.pageSize = event.pageSize;
  }

  async savePerson() {
    const { success, data } = await this.personSrv.Put({
      ...this.propertiesPerson,
      ...this.formPerson.value,
      idOffice: this.idOffice,
      email: null
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


}
