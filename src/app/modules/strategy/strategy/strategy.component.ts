import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router} from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { MenuItem, MessageService } from 'primeng/api';

import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IPlanModel } from 'src/app/shared/interfaces/IPlanModel';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { PlanModelService } from 'src/app/shared/services/plan-model.service';
import { WorkpackModelService } from 'src/app/shared/services/workpack-model.service';
import { IWorkpackModel } from 'src/app/shared/interfaces/IWorkpackModel';
import { TypeWorkpackModelEnum } from 'src/app/shared/enums/TypeWorkpackModelEnum';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { OfficeService } from 'src/app/shared/services/office.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';

@Component({
  selector: 'app-strategy',
  templateUrl: './strategy.component.html',
  styleUrls: ['./strategy.component.scss']
})
export class StrategyComponent implements OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  propertiesStrategy: IPlanModel;
  responsive = false;
  formStrategy: FormGroup;
  idStrategy: number;
  idOffice: number;
  cardProperties: ICard;
  cardModels: ICard;
  models: IWorkpackModel[];
  cardItemsModels: ICardItem[];
  cardItemPlanMenu: MenuItem[];
  $destroy = new Subject();
  isUserAdmin: boolean;
  editPermission: boolean;
  permissionsOffices: IOffice[];

  constructor(
    private formBuilder: FormBuilder,
    private planModelSvr: PlanModelService,
    private workpackModelSvr: WorkpackModelService,
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private responsiveSvr: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private officeSrv: OfficeService,
    private officePermissionSrv: OfficePermissionService,
    private authSrv: AuthService,
    private messageSrv: MessageService
  ) {
    this.formStrategy = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: ['', [Validators.required]]
    });
    this.formStrategy.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formStrategy.dirty))
      .subscribe(() => this.saveButton.showButton());
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.activeRoute.queryParams.subscribe(async({ id, idOffice }) => {
      this.idStrategy = +id;
      this.idOffice = +idOffice;
      this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
      this.loadCards();
      if (this.isUserAdmin === undefined) {
        this.isUserAdmin = await this.authSrv.isUserAdmin();
      }
      if (this.idStrategy) {
        await this.loadModels();
      }
      await this.loadPropertiesStrategy();
      this.breadcrumbSrv.pushMenu({
        key: 'strategy',
        info: this.propertiesStrategy?.name,
        tooltip: this.propertiesStrategy?.fullName,
        routerLink: [ '/strategies', 'strategy' ],
        queryParams: { id: this.idStrategy, idOffice: this.idOffice }
      });
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  loadCards() {
    this.cardProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: this.idStrategy ? true : false
    };
    this.cardModels = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'models',
      collapseble: true,
      initialStateCollapse: false
    };
  }

  async loadPropertiesStrategy() {
    if (this.idStrategy) {
      const { data, success } = await this.planModelSvr.GetById(this.idStrategy);
      if (success) {
        this.propertiesStrategy = data;
        this.formStrategy.setValue({
          name: this.propertiesStrategy?.name,
          fullName: this.propertiesStrategy?.fullName
        });
        if (!this.editPermission) {
          this.formStrategy.disable();
        }
      }
    }
  }

  async loadModels() {
    const result = await this.workpackModelSvr.GetAll({ 'id-plan-model': this.idStrategy });
    if (result.success) {
      this.models = result.data;
    }
    this.loadCardItemsModels();
  }

  navigateToWorkpackModel(type: string){
    this.router.navigate(['/workpack-model'], {
      queryParams: {
        type,
        idStrategy: this.idStrategy,
        idOffice: this.idOffice
      }
    });
  }

  loadCardItemsModels() {
    const itemsModels: ICardItem[] = this.editPermission ? [
      {
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        iconMenuItems: [
          {
            label: this.translateSrv.instant(`labels.${TypeWorkpackModelEnum.PortfolioModel}`),
            command: () => this.navigateToWorkpackModel(TypeWorkpackModelEnum.PortfolioModel),
            icon: 'fas fa-briefcase'
          },
          {
            label: this.translateSrv.instant(`labels.${TypeWorkpackModelEnum.ProgramModel}`),
            command: () => this.navigateToWorkpackModel(TypeWorkpackModelEnum.ProgramModel),
            icon: 'fas fa-cogs'
          },
          {
            label: this.translateSrv.instant(`labels.${TypeWorkpackModelEnum.ProjectModel}`),
            command: () => this.navigateToWorkpackModel(TypeWorkpackModelEnum.ProjectModel),
            icon: 'fas fa-cog'
          },
          {
            label: this.translateSrv.instant(`labels.${TypeWorkpackModelEnum.OrganizerModel}`),
            command: () => this.navigateToWorkpackModel(TypeWorkpackModelEnum.OrganizerModel),
            icon: 'fas fa-folder-open'
          },
        ],
        paramsUrlCard: [{name: 'idStrategy', value: this.idStrategy}]
      }
    ] : [];
    if (this.models) {
      itemsModels.unshift(...this.models.map(workpackModel => (
        {
          typeCardItem: 'listItem',
          icon: workpackModel.fontIcon,
          nameCardItem: workpackModel.modelName,
          itemId: workpackModel.id,
          menuItems: [
            {
              label: this.translateSrv.instant('delete'),
              icon: 'fas fa-trash-alt',
              command: () => this.deleteWorkpackModel(workpackModel),
              disabled: !this.editPermission
            },
          ] as MenuItem[],
          urlCard: '/workpack-model',
          paramsUrlCard: [
            { name: 'id', value: workpackModel.id },
            { name: 'type', value: TypeWorkpackModelEnum[workpackModel.type] },
            { name: 'idStrategy', value: this.idStrategy },
            { name: 'idOffice', value: this.idOffice }
          ]
        }
      )));
    }
    this.cardItemsModels = itemsModels;
  }

  async deleteWorkpackModel(worckpackModel: IWorkpackModel){
    const result = await this.workpackModelSvr.delete(worckpackModel, { field: 'modelName' });
    if (result.success) {
      await this.loadModels();
      // Check
    }
  }

  async handleOnSubmit() {
    const isPut = !!this.propertiesStrategy;
    const { success, data } = isPut
      ? await this.planModelSvr.put({ ...this.formStrategy.value, id: this.idStrategy, idOffice: this.propertiesStrategy.idOffice })
      : await this.planModelSvr.post({...this.formStrategy.value, idOffice: this.idOffice});

    if (success) {
      this.idStrategy = data.id;
      this.breadcrumbSrv.updateLastCrumb({
        key: 'strategy',
        routerLink: ['/strategies', 'strategy' ],
        queryParams: { id: this.idStrategy, idOffice: this.idOffice },
        info: this.propertiesStrategy?.name,
        tooltip: this.propertiesStrategy?.fullName,
      });
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      if (!isPut) {
        this.router.navigate([], {
          queryParams: {
            id: this.idStrategy,
            idOffice: this.idOffice
          }
        });
      } else {
        await this.loadPropertiesStrategy();
      }
    }
  }

}
