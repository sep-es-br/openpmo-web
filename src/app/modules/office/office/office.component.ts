import { Component, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { MenuItem, MessageService } from 'primeng/api';

import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { OfficeService } from 'src/app/shared/services/office.service';
import { PlanService } from 'src/app/shared/services/plan.service';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { IPlanModel } from 'src/app/shared/interfaces/IPlanModel';
import { PlanModelService } from 'src/app/shared/services/plan-model.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { SaveButtonComponent } from 'src/app/shared/components/save-button/save-button.component';
import { AuthService } from 'src/app/shared/services/auth.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';

@Component({
  selector: 'app-office',
  templateUrl: './office.component.html',
  styleUrls: ['./office.component.scss']
})
export class OfficeComponent implements OnDestroy {

  @ViewChild(SaveButtonComponent) saveButton: SaveButtonComponent;

  propertiesOffice: IOffice;
  responsive = false;
  formOffice: FormGroup;
  idOffice: number;
  planModelsOfficeList: IPlanModel[];
  menuItemsNewPlan: MenuItem[];
  cardProperties: ICard;
  cardPlans: ICard;
  plans: IPlan[];
  cardItemsPlans: ICardItem[];
  cardItemPlanMenu: MenuItem[];
  $destroy = new Subject();
  isUserAdmin: boolean;
  editPermission: boolean;

  constructor(
    private formBuilder: FormBuilder,
    private officeSrv: OfficeService,
    private planModelSrv: PlanModelService,
    private planSrv: PlanService,
    private translateSrv: TranslateService,
    private activeRoute: ActivatedRoute,
    private router: Router,
    private responsiveSvr: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private officePermissionSrv: OfficePermissionService,
    private messageSrv: MessageService
  ) {
    this.activeRoute.queryParams.subscribe(async({ id }) => {
      this.idOffice = +id;
      this.editPermission = await this.officePermissionSrv.getPermissions(this.idOffice);
      this.load();
    });
    this.formOffice = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(25)]],
      fullName: ['', [Validators.required]]
    });
    this.formOffice.valueChanges
      .pipe(takeUntil(this.$destroy), filter(() => this.formOffice.dirty))
      .subscribe(() => this.saveButton.showButton());
    this.responsiveSvr.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async load() {
    this.loadCards();
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    await this.loadPropertiesOffice();
    this.breadcrumbSrv.pushMenu({
      key: 'office',
      routerLink: [ '/offices', 'office' ],
      queryParams: { id: this.idOffice },
      info: this.propertiesOffice?.name
    });
    if (this.idOffice) {
      this.loadPlans();
    }
  }

  loadCards() {
    this.cardProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: this.idOffice ? true : false
    };
    this.cardPlans = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'plans',
      collapseble: true,
      initialStateCollapse: false
    };
  }

  async loadPropertiesOffice() {
    if (this.idOffice) {
      const { data, success } = await this.officeSrv.GetById(this.idOffice);
      if (success) {
        this.propertiesOffice = data;
        this.formOffice.reset({ name: data.name, fullName: data.fullName });
        if (!this.editPermission) {
          this.formOffice.disable();
        }
      }
    }
  }

  async loadPlanModelsOfficeList() {
    const { success, data } = await this.planModelSrv.GetAll({ 'id-office': this.idOffice });
    if (success) {
      this.planModelsOfficeList = data;
      this.loadMenuItemsNewPlan();
    }
  }

  loadMenuItemsNewPlan() {
    this.menuItemsNewPlan = this.planModelsOfficeList.map(planModel =>
      ({
        label: planModel.name,
        icon: 'fas fa-chess-knight',
        command: () => this.navigateToNewPlan(planModel.id)
      })
    );
  }

  async loadPlans() {
    this.loadPlanModelsOfficeList();
    const result = await this.planSrv.GetAll({ 'id-office': this.idOffice });
    if (result.success) {
      this.plans = result.data;
    }
    this.loadCardItemsPlans();
  }

  loadCardItemsPlans() {
    const itemsPlans: ICardItem[] = (this.editPermission && this.menuItemsNewPlan?.length > 0) ? [
      {
        typeCardItem: 'newCardItem',
        iconSvg: true,
        icon: IconsEnum.Plus,
        iconMenuItems: this.menuItemsNewPlan,
      }
    ] : [];
    if (this.plans) {
      itemsPlans.unshift(... this.plans.map(plan => {
        const editPermissions = !this.authSrv.isUserAdmin() && plan.permissions.filter( p => p.level === 'EDIT');
        const planEditPermission =  this.authSrv.isUserAdmin() ? true : (editPermissions.length > 0 ? true : false);
        return {
          typeCardItem: 'listItem',
          iconSvg: true,
          icon: IconsEnum.Plan,
          nameCardItem: plan.name,
          fullNameCardItem: plan.fullName,
          itemId: plan.id,
          menuItems: [
            {
              label: this.translateSrv.instant('permissions'),
              icon: 'icon: fas fa-user-lock',
              command: () => this.navigateToPlanPermissions(plan.id),
              disabled: !this.editPermission
            },
            {
              label: this.translateSrv.instant('delete'),
              icon: 'fas fa-trash-alt',
              command: () => this.deletePlan(plan),
              disabled: !planEditPermission
            },
          ],
          urlCard: '/plan'
        };
      }));
    }
    this.cardItemsPlans = itemsPlans;
  }

  navigateToNewPlan(idPlanModel: number) {
    this.router.navigate([ '/plan' ],
      {
        queryParams: {
          idOffice: this.idOffice,
          idPlanModel
        }
      }
    );
  }

  navigateToPlanPermissions(idPlan: number) {
    this.router.navigate([ '/plan', 'permission' ],
      {
        queryParams: {
          idPlan
        }
      }
    );
  }

  async deletePlan(plan: IPlan) {
    const result = await this.planSrv.delete(plan, { useConfirm: true });
    if (result.success) {
      this.cardItemsPlans = Array.from(this.cardItemsPlans.filter(p => p.itemId !== plan.id));
    }
  }

  async handleOnSubmit() {
    if (this.propertiesOffice) {
      const { success } = await this.officeSrv.put({ ...this.formOffice.value, id: this.idOffice });
      if (success) {
        await this.loadPropertiesOffice();
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
      }
    } else {
      const { data, success } = await this.officeSrv.post(this.formOffice.value);
      if (success) {
        this.idOffice = data.id;
        if (!this.isUserAdmin) {
          await this.createOfficePermission(data.id);
        }
        await this.loadPropertiesOffice();
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully')
        });
        this.breadcrumbSrv.updateLastCrumb({
          key: 'office',
          routerLink: [ '/offices', 'office' ],
          queryParams: { id: this.idOffice },
          info: this.propertiesOffice?.name
        });
        this.loadPlans();
      }
    }
  }

  async createOfficePermission(idOffice: number) {
    const payload = this.authSrv.getTokenPayload();
    if (payload) {
      await this.officePermissionSrv.post({
        email: payload.email,
        idOffice,
        permissions: [{
          level: 'EDIT',
          role: 'User'
        }]
      });
    }
  }

}
