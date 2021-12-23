import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OficceRoutingModule } from './office-routing.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { CoreModule } from 'src/app/core/core.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { OfficeListComponent } from './office-list/office-list.component';
import { OfficePermissionsComponent } from './office-permissions/office-permissions.component';
import { OfficeComponent } from './office/office.component';
import { OfficePermissionsListComponent } from './office-permissions/office-permissions-list/office-permissions-list.component';
import { CardItemOfficeComponent } from './components/card-item-office/card-item-office.component';



@NgModule({
  declarations: [ OfficeListComponent, OfficePermissionsComponent, OfficeComponent,
    OfficePermissionsListComponent, CardItemOfficeComponent],
  imports: [
    CommonModule,
    OficceRoutingModule,
    ComponentsModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmDialogModule
  ],
  providers: []
})
export class OfficeModule { }
