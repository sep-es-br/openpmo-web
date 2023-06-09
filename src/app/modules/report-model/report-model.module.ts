import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReportModelRoutingModule } from './report-model-routing.module';
import { ReportModelComponent } from './report-model/report-model.component';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { CoreModule } from 'src/app/core/core.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CardItemSourceFileComponent } from './card-item-source-file/card-item-source-file.component';


@NgModule({
  declarations: [ReportModelComponent, CardItemSourceFileComponent],
  imports: [
    CommonModule,
    ReportModelRoutingModule,
    ComponentsModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class ReportModelModule { }
