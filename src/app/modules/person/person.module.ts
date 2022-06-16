import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PersonListComponent } from './person-list/person-list.component';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { CoreModule } from 'src/app/core/core.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { PersonRoutingModule } from './person-routing.module';
import {ScrollTopModule} from 'primeng/scrolltop';
import { PersonComponent } from './person/person.component';
import { PersonProfileComponent } from './person-profile/person-profile.component';


@NgModule({
  declarations: [PersonListComponent, PersonComponent, PersonProfileComponent],
  imports: [
    CommonModule,
    PersonRoutingModule,
    ComponentsModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
    ConfirmDialogModule,
    ScrollTopModule
  ]
})
export class PersonModule { }
