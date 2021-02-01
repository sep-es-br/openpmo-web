import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrganizationListComponent } from './organization-list/organization-list.component';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { CoreModule } from 'src/app/core/core.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { OrganizationRoutingModule } from './organization-routing.module';
import { OrganizationComponent } from './organization/organization.component';



@NgModule({
  declarations: [OrganizationListComponent, OrganizationComponent],
  imports: [
    CommonModule,
    OrganizationRoutingModule,
    ComponentsModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class OrganizationModule { }
