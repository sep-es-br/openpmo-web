import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { PreprojectRoutingModule } from './preproject-routing.module';
import { PreprojectComponent } from './preproject.component';
import { PreprojectToolbarComponent } from './preproject-toolbar/preproject-toolbar.component';
import { CoreModule } from 'src/app/core/core.module';
import { PreprojectFormComponent } from './preproject-form/preproject-form.component';
import { PreprojectDeliveryComponent } from './preproject-delivery/preproject-delivery.component';
import { PreprojectCriteriaGuideComponent } from './preproject-criteria-guide/preproject-criteria-guide.component';
import { PreprojectCriteriaGroupComponent } from './preproject-criteria-group/preproject-criteria-group.component';

@NgModule({
  declarations: [
    PreprojectComponent,
    PreprojectToolbarComponent,
    PreprojectFormComponent,
    PreprojectDeliveryComponent,
    PreprojectCriteriaGuideComponent,
    PreprojectCriteriaGroupComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    CoreModule,
    TranslateModule,
    PreprojectRoutingModule
  ]
})
export class PreprojectModule { }
