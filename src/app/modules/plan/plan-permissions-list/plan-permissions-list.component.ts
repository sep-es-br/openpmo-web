import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { IPlanPermission } from 'src/app/shared/interfaces/IPlanPermission';
import { PlanService } from 'src/app/shared/services/plan.service';
import { PlanPermissionService } from 'src/app/shared/services/plan-permissions.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICardItemPermission } from 'src/app/shared/interfaces/ICardItemPermission';
import { TranslateService } from '@ngx-translate/core';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';

@Component({
  selector: 'app-plan-permissions-list',
  templateUrl: './plan-permissions-list.component.html',
  styleUrls: ['./plan-permissions-list.component.scss']
})
export class PlanPermissionsListComponent implements OnInit {

  idPlan: number;
  responsive: boolean;
  propertiesPlan: IPlan;
  planPermissions: IPlanPermission[];
  cardItemsPlanPermissions: ICardItemPermission[];
  cardPlanPermissions: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'permissions',
    collapseble: true,
    initialStateCollapse: false
  };

  constructor(
    private actRouter: ActivatedRoute,
    private responsiveSrv: ResponsiveService,
    private planSrv: PlanService,
    private planPermissionSrv: PlanPermissionService,
    private translateSrv: TranslateService,
    private breadcrumbSrv: BreadcrumbService
  ) {
    this.actRouter.queryParams.subscribe(async queryParams => {
      this.idPlan = queryParams.idPlan;
    });
    this.responsiveSrv.observable.subscribe(value => {
      this.responsive = value;
    });
  }

  async ngOnInit() {
    await this.loadPropertiesPlan();
    this.breadcrumbSrv.pushMenu({
      key: 'planPermissions',
      routerLink: [ '/plan', 'permission' ],
      queryParams: { idPlan: this.idPlan },
      info: this.propertiesPlan?.name
    });
  }

  async loadPropertiesPlan() {
    if (this.idPlan) {
      const result = await this.planSrv.GetById(this.idPlan);
      this.propertiesPlan = result.data;
      this.loadPlanPermissions();
    }
  }

  async loadPlanPermissions() {
    const result = await this.planPermissionSrv.GetAll({'id-plan': this.idPlan});
    if (result.success) {
      this.planPermissions = result.data;
      this.loadCardItemsPlanPermissions();
    }
  }

  loadCardItemsPlanPermissions() {
    this.cardItemsPlanPermissions = this.planPermissions.map(p => {
      const fullName = p.person.name.split(' ');
      const name = fullName.length > 1 ? fullName[0] + ' ' + fullName[1] : fullName[0];
      return {
        typeCardItem: 'listItem',
        titleCardItem: name,
        roleDescription: (p.permissions.filter( r => r.level === 'EDIT').length > 0
          ? this.translateSrv.instant('edit')
          : this.translateSrv.instant('read')),
        menuItems: [{
          label: this.translateSrv.instant('delete'),
          icon: 'fas fa-trash-alt',
          command: (event) => this.deletePlanPermission(p)
        }],
        itemId: p.person.id,
        urlCard: 'plan/permission/detail',
        paramsUrlCard: [
          {name: 'idPlan', value: this.idPlan},
          {name: 'email', value: p.person.email}
        ]
      };
    });
    this.cardItemsPlanPermissions.push(
      {
        typeCardItem: 'newCardItem',
        urlCard: '/plan/permission/detail',
        paramsUrlCard: [
          { name: 'idPlan', value: this.idPlan }
        ]
      }
    );
  }

  async deletePlanPermission(permission: IPlanPermission) {
    const result = await this.planPermissionSrv.deletePermission({ email: permission.person.email, 'id-plan': permission.idPlan });
    if (result.success) {
      this.cardItemsPlanPermissions = Array.from(this.cardItemsPlanPermissions.filter(p => p.itemId !== permission.person.id));
    }
  }
}
