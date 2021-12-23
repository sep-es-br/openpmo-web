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
  collapsePanelsStatus = true;
  displayModeAll = 'grid';
  pageSize = 5;
  totalRecords: number;

  idOffice: number;
  idPerson: number;
  responsive: boolean;
  $destroy = new Subject();
  isUserAdmin: boolean;

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
    private breadcrumbSrv: BreadcrumbService
  ) {
    this.activeRoute.queryParams.subscribe(async({ idOffice, idPerson }) => {
      this.idOffice = +idOffice;
      this.idPerson = +idPerson;
      await this.loads();
    });
    this.formPerson = this.formBuilder.group({
      name: ['', Validators.required],
      fullname: ['', Validators.required],
      email: [''],
      contactEmail: ['', [Validators.email, Validators.required]],
      phoneNumber: ['', Validators.required],
      address: ['', Validators.required]
    });
    this.formPerson.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() =>  this.saveButton.hideButton());
    this.formPerson.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formPerson.dirty && this.formPerson.valid))
      .subscribe(() => this.saveButton.showButton());
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

   ngOnInit() {
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async loads() {
    await this.loadPerson();
    await this.loadUserAdmin();
    this.setBreadcrumb();
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
        key: 'administration',
        routerLink: ['/configuration-office'],
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'configuration',
        routerLink: ['/persons'],
        queryParams: { idOffice: this.idOffice }
      },
      {
        key: 'people',
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
      phoneNumber: person?.phoneNumber,
      address: person?.address
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
          subtitleCardItem: workpack?.roles?.join(', '),
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

 async handleDeleteAllPermissions(event) {
  await this.personSrv.DeleteAllPermissions({
    ...this.propertiesPerson,
    ...this.formPerson.value,
  }, this.propertiesPerson.id, this.idOffice);

  await this.loads();
}

 async savePerson() {
   const { success, data } = await this.personSrv.Put({
     ...this.propertiesPerson,
     ...this.formPerson.value,
     email: null,
     idOffice: this.idOffice
   });
   if(success) {
    await this.loadPerson();
    this.messageSrv.add({
      severity: 'success',
      summary: this.translateSrv.instant('success'),
      detail: this.translateSrv.instant('messages.savedSuccessfully')
    });
   }
 }

}
