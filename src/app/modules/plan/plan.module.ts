import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { PlanComponent } from './plan.component';
import { PlanRoutingModule } from './plan-routing.module';
import { CoreModule } from 'src/app/core/core.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PlanPermissionsComponent } from './plan-permissions/plan-permissions.component';
import { PlanPermissionsListComponent } from './plan-permissions-list/plan-permissions-list.component';

@NgModule({
  declarations: [PlanComponent, PlanPermissionsComponent, PlanPermissionsListComponent],
  imports: [
    CommonModule,
    CoreModule,
    PlanRoutingModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class PlanModule { }
