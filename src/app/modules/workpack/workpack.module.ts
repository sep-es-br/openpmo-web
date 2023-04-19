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
import { DashboardComponent } from './dashboard/dashboard.component';
import { TripleConstraintDashboardComponent } from './components/triple-constraint-dashboard/triple-constraint-dashboard.component';
import { EarnedValueAnalysisDashboardComponent } from './components/earned-value-analysis-dashboard/earned-value-analysis-dashboard.component';
import { ProgressBarScheduleYearComponent } from './components/progress-bar-schedule-year/progress-bar-schedule-year.component';
import { BreakdownStructureComponent } from './components/breakdown-structure/breakdown-structure.component';
import { WorkpackSectionPropertiesComponent } from './workpack-sections/workpack-section-properties/workpack-section-properties.component';
import { WorkpackSectionCostAccountsComponent } from './workpack-sections/workpack-section-cost-accounts/workpack-section-cost-accounts.component';
import { WorkpackSectionScheduleComponent } from './workpack-sections/workpack-section-schedule/workpack-section-schedule.component';
import { WorkpackSectionStakeholdersComponent } from './workpack-sections/workpack-section-stakeholders/workpack-section-stakeholders.component';
import { WorkpackSectionBaselinesComponent } from './workpack-sections/workpack-section-baselines/workpack-section-baselines.component';
import { WorkpackSectionRisksComponent } from './workpack-sections/workpack-section-risks/workpack-section-risks.component';
import { WorkpackSectionIssuesComponent } from './workpack-sections/workpack-section-issues/workpack-section-issues.component';
import { WorkpackSectionProcessesComponent } from './workpack-sections/workpack-section-processes/workpack-section-processes.component';

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
    JournalComponent,
    DashboardComponent,
    TripleConstraintDashboardComponent,
    EarnedValueAnalysisDashboardComponent,
    ProgressBarScheduleYearComponent,
    BreakdownStructureComponent,
    WorkpackSectionPropertiesComponent,
    WorkpackSectionCostAccountsComponent,
    WorkpackSectionScheduleComponent,
    WorkpackSectionStakeholdersComponent,
    WorkpackSectionBaselinesComponent,
    WorkpackSectionRisksComponent,
    WorkpackSectionIssuesComponent,
    WorkpackSectionProcessesComponent,
  ],
  imports: [
      CommonModule,
      WorkpackRoutingModule,
      CoreModule,
      ComponentsModule,
      FormsModule,
      ReactiveFormsModule,
    ],
})
export class WorkpackModule { }
