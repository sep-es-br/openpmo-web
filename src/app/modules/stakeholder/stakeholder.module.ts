import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StakeholderRoutingModule } from './stakeholder-routing.module';
import { CoreModule } from 'src/app/core/core.module';
import { PlanRoutingModule } from '../plan/plan-routing.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StakeholderRoleCardItemComponent } from './stakeholder-role-card-item/stakeholder-role-card-item.component';
import { StakeholderPersonComponent } from './stakeholder-person/stakeholder-person.component';
import { StakeholderOrganizationComponent } from './stakeholder-organization/stakeholder-organization.component';


@NgModule({
  declarations: [StakeholderRoleCardItemComponent, StakeholderPersonComponent, StakeholderOrganizationComponent],
  imports: [
    CommonModule,
    StakeholderRoutingModule,
    CoreModule,
    PlanRoutingModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class StakeholderModule { }
