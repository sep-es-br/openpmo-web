import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkpackComponent } from './workpack.component';
import { WorkpackRoutingModule } from './workpack-routing.module';
import { CoreModule } from 'src/app/core/core.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { WorkpackPropertyComponent } from './workpack-property/workpack-property.component';
import { PropertyTextComponent } from './workpack-property/type-property/property-text/property-text.component';
import { PropertyDateComponent } from './workpack-property/type-property/property-date/property-date.component';
import { PropertyToggleComponent } from './workpack-property/type-property/property-toggle/property-toggle.component';
import { PropertySelectionComponent } from './workpack-property/type-property/property-selection/property-selection.component';
import { PropertyTextareaComponent } from './workpack-property/type-property/property-textarea/property-textarea.component';
import {
  PropertyTreeSelectionComponent
  } from './workpack-property/type-property/property-tree-selection/property-tree-selection.component';
import { PropertyIntegerComponent } from './workpack-property/type-property/property-integer/property-integer.component';
import { CostAccountComponent } from './cost-account/cost-account.component';
import {
  PropertyUnitSelectionComponent
  } from './workpack-property/type-property/property-unit-selection/property-unit-selection.component';
import {
  PropertyOrganizationSelectionComponent
} from './workpack-property/type-property/property-organization-selection/property-organization-selection.component';
import { ScheduleStepCardItemComponent } from './schedule-step-card-item/schedule-step-card-item.component';
import { PropertyGroupComponent } from './workpack-property/type-property/property-group/property-group.component';
import { ProcessComponent } from './process/process.component';
import { ProgressBarCardStepComponent } from './components/progress-bar-card-step/progress-bar-card-step.component';
import { SharingComponent } from './sharing/sharing.component';
import { BaselineComponent } from './baseline/baseline.component';
import { BaselineCancellingComponent } from './baseline-cancelling/baseline-cancelling.component';
import { JournalViewComponent } from './components/journal-view/journal-view.component';
import { JournalComponent } from './journal/journal.component';

@NgModule({
  declarations: [
    WorkpackComponent,
    WorkpackPropertyComponent,
    PropertyIntegerComponent,
    PropertyTextComponent,
    PropertyDateComponent,
    PropertyToggleComponent,
    PropertySelectionComponent,
    PropertyTextareaComponent,
    PropertyTreeSelectionComponent,
    CostAccountComponent,
    PropertyUnitSelectionComponent,
    PropertyOrganizationSelectionComponent,
    ScheduleStepCardItemComponent,
    PropertyGroupComponent,
    ProcessComponent,
    ProgressBarCardStepComponent,
    SharingComponent,
    BaselineComponent,
    BaselineCancellingComponent,
    JournalViewComponent,
    JournalComponent],
  imports: [
    CommonModule,
    WorkpackRoutingModule,
    CoreModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class WorkpackModule { }
