import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { PlanComponent } from './plan.component';
import { PlanRoutingModule } from './plan-routing.module';
import { CoreModule } from 'src/app/core/core.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PlanPermissionsComponent } from './plan-permissions/plan-permissions.component';
import { PlanPermissionsListComponent } from './plan-permissions-list/plan-permissions-list.component';
import { PlanSectionDashboardComponent } from './plan-sections/plan-section-dashboard/plan-section-dashboard.component';
import { PlanSectionPropertiesComponent } from './plan-sections/plan-section-properties/plan-section-properties.component';
import { PlanSectionWBSComponent } from './plan-sections/plan-section-wbs/plan-section-wbs.component';
import { WorkpackDashboardComponentsModule } from '../workpack/components/workpack-dashboard-components.module';

@NgModule({
  declarations: [
    PlanComponent,
    PlanPermissionsComponent,
    PlanPermissionsListComponent,
    PlanSectionDashboardComponent,
    PlanSectionPropertiesComponent,
    PlanSectionWBSComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    PlanRoutingModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
    WorkpackDashboardComponentsModule,
  ]
})
export class PlanModule { }
