import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoreModule } from './../../core/core.module';
import { ComponentsModule } from './../../shared/components/components.module';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AdministratorRoutingModule } from './administrator-routing.module';
import { AdministratorListComponent } from './administrator-list/administrator-list.component';
import { AdministratorComponent } from './administrator/administrator.component';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ScrollTopModule } from 'primeng/scrolltop';


@NgModule({
  declarations: [AdministratorListComponent, AdministratorComponent],
  imports: [
    CommonModule,
    AdministratorRoutingModule,
    ComponentsModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmDialogModule,
    ScrollTopModule
  ]
})
export class AdministratorModule { }
