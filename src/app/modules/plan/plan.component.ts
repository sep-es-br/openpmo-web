import { Component, OnDestroy, OnInit, ViewChild, ViewChildren } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Calendar } from 'primeng/calendar';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { PlanService } from 'src/app/shared/services/plan.service';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackModelService } from 'src/app/shared/services/workpack-model.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IWorkpack } from 'src/app/shared/interfaces/IWorkpack';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MenuItem, MessageService } from 'primeng/api';
import { OfficeService } from 'src/app/shared/services/office.service';
import { PlanPermissionService } from 'src/app/shared/services/plan-permissions.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { MenuService } from 'src/app/shared/services/menu.service';


interface IWorkpackModelCard {
  idWorkpackModel: number;
  propertiesCard: ICard;
  workPackItemCardList: ICardItem[];
}

@Component({
  selector: 'app-plan',
  templateUrl: './plan.component.html',
  styleUrls: ['./plan.component.scss']
})
export class PlanComponent implements OnInit, OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;
  @ViewChildren(Calendar) calendarComponents: Calendar[];

  responsive: boolean;
  idPlanModel: number;
  idOffice: number;
  idPlan: number;
  cardPlanProperties: ICard;
  cardsPlanWorkPackModels: IWorkpackModelCard[];
  formPlan: FormGroup;
  planData: IPlan;
  $destroy = new Subject();
  editPermission = false;
  calendarFormat: string;

  constructor(
    private actRouter: ActivatedRoute,
    private planSrv: PlanService,
    private workpackModelSrv: WorkpackModelService,
    private workpackSrv: WorkpackService,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officeSrv: OfficeService,
    private planPermissionSrv: PlanPermissionService,
    private messageSrv: MessageService,
    private menuSrv: MenuService
  ) {
    this.actRouter.queryParams.subscribe(({ id, idOffice, idPlanModel }) => {
      this.idOffice = +idOffice;
      this.idPlanModel = +idPlanModel;
      this.idPlan = +id;
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
        setTimeout(() => this.calendarComponents?.map(calendar => {
          calendar.ngOnInit();
          calendar.dateFormat = this.translateSrv.instant('dateFormat');
          calendar.updateInputfield();
        }, 150));
      }
    );
    this.formPlan = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      fullName: ['', Validators.required],
      start: [null, Validators.required],
      finish: [null, Validators.required],
    });
    this.formPlan.statusChanges
      .pipe(takeUntil(this.$destroy), filter(status => status === 'INVALID'))
      .subscribe(() => this.saveButton.hideButton());
    this.formPlan.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formPlan.dirty && this.formPlan.valid))
      .subscribe(() => this.saveButton.showButton());
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.calendarFormat = this.translateSrv.instant('dateFormat');
    await this.loadPropertiesPlan();
    this.breadcrumbSrv.pushMenu({
      key: 'plan',
      routerLink: ['/plan'],
      queryParams: { id: this.idPlan },
      info: this.planData?.name,
      tooltip: this.planData?.fullName
    });
  }

  async loadPropertiesPlan() {
    this.cardPlanProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: !!this.idPlan
    };
    if (this.idPlan) {
      const result = await this.planSrv.GetById(this.idPlan);
      this.planData = result.data;
      if (this.planData) {
        this.officeSrv.nextIDOffice(this.planData.idOffice);
        this.idOffice = this.planData.idOffice;
        this.idPlanModel = this.planData.idPlanModel;
        this.formPlan.controls.name.setValue(this.planData.name);
        this.formPlan.controls.fullName.setValue(this.planData.fullName);
        this.formPlan.controls.start.setValue(new Date(this.planData.start + 'T00:00:00'));
        this.formPlan.controls.finish.setValue(new Date(this.planData.finish + 'T00:00:00'));
        this.editPermission = await this.planPermissionSrv.getPermissions(this.idPlan);
        if (!this.editPermission) {
          this.formPlan.disable();
        }
        this.loadWorkPackModels();
      }
    }
  }

  async savePlan() {
    this.planData = {
      id: this.idPlan,
      idOffice: this.idOffice,
      idPlanModel: this.idPlanModel,
      name: this.formPlan.controls.name.value,
      fullName: this.formPlan.controls.fullName.value,
      start: this.formPlan.controls.start.value,
      finish: this.formPlan.controls.finish.value,
    };
    const isPut = !!this.planData.id;
    const { success, data } = isPut
      ? await this.planSrv.put({
        id: this.planData.id,
        name: this.planData.name,
        fullName: this.planData.fullName,
        start: this.planData.start,
        finish: this.planData.finish
      })
      : await this.planSrv.post({
        idOffice: this.planData.idOffice,
        idPlanModel: this.planData.idPlanModel,
        name: this.planData.name,
        fullName: this.planData.fullName,
        start: this.planData.start,
        finish: this.planData.finish
      });
    if (success) {
      if (!isPut) {
        this.idPlan = data.id;
        const isUserAdmin = await this.authSrv.isUserAdmin();
        if (!isUserAdmin) {
          await this.createPlanPermission(data.id);
        }
        await this.loadPropertiesPlan();
      }
      this.messageSrv.add({
        severity: 'success',
        summary: this.translateSrv.instant('success'),
        detail: this.translateSrv.instant('messages.savedSuccessfully')
      });
      this.breadcrumbSrv.updateLastCrumb({
        key: 'plan',
        routerLink: ['/plan'],
        queryParams: { id: this.idPlan },
        info: this.planData.name,
        tooltip: this.planData?.fullName
      });
      this.menuSrv.reloadMenuOffice();
      return;
    };
  }

  async createPlanPermission(idPlan: number) {
    const payload = this.authSrv.getTokenPayload();
    if (payload) {
      const result = await this.planPermissionSrv.post({
        email: payload.email,
        idPlan,
        permissions: [{
          level: 'EDIT',
          role: 'User'
        }]
      });
      if (result.success) {
        return;
      }
    }
  }

  async loadWorkPackModels() {
    const result = await this.workpackModelSrv.GetAll({ 'id-plan-model': this.idPlanModel });
    const workpackModels = result.success && result.data;
    if (workpackModels) {
      this.cardsPlanWorkPackModels = await Promise.all(workpackModels.map(async(workpackModel) => {
        const propertiesCard = {
          toggleable: false,
          initialStateToggle: false,
          cardTitle: workpackModel.modelNameInPlural,
          collapseble: true,
          initialStateCollapse: false
        };
        const workPackItemCardList = await this.loadWorkpacksFromWorkpackModel(this.planData.id, workpackModel.id);

        return {
          idWorkpackModel: workpackModel.id,
          propertiesCard,
          workPackItemCardList
        };
      }));
    }
  }

  async loadWorkpacksFromWorkpackModel(idPlan: number, workpackModelId: number) {

    const result = await this.workpackSrv.GetAll({
      'id-plan': idPlan,
      'id-plan-model': this.idPlanModel,
      'id-workpack-model': workpackModelId,
      noLoading: true
    });
    const workpacks = result.success && result.data;
    const workPackItemCardList: ICardItem[] = workpacks.map(workpack => {
      const propertyNameWorkpackModel = workpack.model?.properties?.find(p => p.name === 'name');
      const propertyNameWorkpack = workpack.properties.find(p => p.idPropertyModel === propertyNameWorkpackModel?.id);
      const propertyfullnameWorkpackModel = workpack.model?.properties?.find(p => p.name === 'fullname');
      const propertyFullnameWorkpack = workpack.properties.find(p => p.idPropertyModel === propertyfullnameWorkpackModel?.id);
      const workpackPermissions = workpack.permissions && workpack.permissions.find(p => p.level === 'EDIT');
      const workpackEditPermission = workpackPermissions ? true : this.editPermission;
      return {
        typeCardItem: 'listItem',
        icon: workpack.model.fontIcon,
        iconSvg: false,
        nameCardItem: propertyNameWorkpack?.value as string,
        fullNameCardItem: propertyFullnameWorkpack?.value as string,
        itemId: workpack.id,
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deleteWorkpack(workpack),
          disabled: !workpackEditPermission
        }] as MenuItem[],
        urlCard: '/workpack',
        editPermission: workpackEditPermission
      };
    });

    if (this.editPermission) {
      workPackItemCardList.push(
        {
          typeCardItem: 'newCardItem',
          icon: IconsEnum.Plus,
          iconSvg: true,
          urlCard: '/workpack',
          paramsUrlCard: [
            { name: 'idPlan', value: idPlan },
            { name: 'idWorkpackModel', value: workpackModelId }
          ]
        }
      );
    }
    return workPackItemCardList;

  }

  async deleteWorkpack(workpack: IWorkpack) {
    const result = await this.workpackSrv.delete(workpack, { useConfirm: true });
    if (result.success) {
      const workpackModelIndex = this.cardsPlanWorkPackModels
        .findIndex(workpackModel => workpackModel.idWorkpackModel === workpack.model.id);
      if (workpackModelIndex > -1) {
        const workpackIndex = this.cardsPlanWorkPackModels[workpackModelIndex].workPackItemCardList
          .findIndex(w => w.itemId === workpack.id);
        if (workpackIndex > -1) {
          this.cardsPlanWorkPackModels[workpackModelIndex].workPackItemCardList.splice(workpackIndex, 1);
          this.cardsPlanWorkPackModels[workpackModelIndex].workPackItemCardList =
            Array.from(this.cardsPlanWorkPackModels[workpackModelIndex].workPackItemCardList);
        }
      }
    }
  }

}
