import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CoreModule } from 'src/app/core/core.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { WorkpackModelRoutingModule } from './workpack-model-routing.module';
import { WorkpackModelComponent } from './workpack-model.component';
import { WorkpackModelPropertyComponent } from './workpack-model-property/workpack-model-property.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [
    WorkpackModelComponent,
    WorkpackModelPropertyComponent
  ],
  imports: [
    CommonModule,
    WorkpackModelRoutingModule,
    CoreModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule
  ]
})
export class WorkpackModelModule { }
