import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkpackComponent } from './workpack.component';
import { WorkpackRoutingModule } from './workpack-routing.module';
import { CoreModule } from 'src/app/core/core.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ScheduleStepCardItemComponent } from './schedule-step-card-item/schedule-step-card-item.component';
import { ProcessComponent } from './process/process.component';
import { ProgressBarCardStepComponent } from './components/progress-bar-card-step/progress-bar-card-step.component';
import { SharingComponent } from './sharing/sharing.component';
import { BaselineComponent } from './baseline/baseline.component';
import { BaselineCancellingComponent } from './baseline-cancelling/baseline-cancelling.component';
import { JournalViewComponent } from './components/journal-view/journal-view.component';
import { JournalComponent } from './journal/journal.component';
import { TripleConstraintDashboardComponent } from './components/triple-constraint-dashboard/triple-constraint-dashboard.component';
import { EarnedValueAnalysisDashboardComponent } from './components/earned-value-analysis-dashboard/earned-value-analysis-dashboard.component';
import { ProgressBarScheduleYearComponent } from './components/progress-bar-schedule-year/progress-bar-schedule-year.component';
import { WorkpackSectionPropertiesComponent } from './workpack-sections/workpack-section-properties/workpack-section-properties.component';
import { WorkpackSectionCostAccountsComponent } from './workpack-sections/workpack-section-cost-accounts/workpack-section-cost-accounts.component';
import { WorkpackSectionScheduleComponent } from './workpack-sections/workpack-section-schedule/workpack-section-schedule.component';
import { WorkpackSectionStakeholdersComponent } from './workpack-sections/workpack-section-stakeholders/workpack-section-stakeholders.component';
import { WorkpackSectionBaselinesComponent } from './workpack-sections/workpack-section-baselines/workpack-section-baselines.component';
import { WorkpackSectionRisksComponent } from './workpack-sections/workpack-section-risks/workpack-section-risks.component';
import { WorkpackSectionIssuesComponent } from './workpack-sections/workpack-section-issues/workpack-section-issues.component';
import { WorkpackSectionProcessesComponent } from './workpack-sections/workpack-section-processes/workpack-section-processes.component';
import { CostAccountComponent } from './cost-account/cost-account.component';
import { CostAccountCardComponent } from './components/cost-account-card/cost-account-card.component';
import { ProgressBarCostAccountComponent } from './components/progress-bar-cost-account/progress-bar-cost-account.component';
import { WorkpackSectionDashboardComponent } from './workpack-sections/workpack-section-dashboard/workpack-section-dashboard.component';
import { WorkpackSectionJournalComponent } from './workpack-sections/workpack-section-journal/workpack-section-journal.component';
import { WorkpackSectionWBSComponent } from './workpack-sections/workpack-section-wbs/workpack-section-wbs.component';
import { TooltipModule } from 'primeng/tooltip'
import { Tooltip } from 'chart.js';

@NgModule({
  declarations: [
    WorkpackComponent,
    CostAccountComponent,
    ScheduleStepCardItemComponent,
    ProcessComponent,
    ProgressBarCardStepComponent,
    SharingComponent,
    BaselineComponent,
    BaselineCancellingComponent,
    JournalViewComponent,
    JournalComponent,
    TripleConstraintDashboardComponent,
    EarnedValueAnalysisDashboardComponent,
    ProgressBarScheduleYearComponent,
    WorkpackSectionPropertiesComponent,
    WorkpackSectionCostAccountsComponent,
    WorkpackSectionScheduleComponent,
    WorkpackSectionStakeholdersComponent,
    WorkpackSectionBaselinesComponent,
    WorkpackSectionRisksComponent,
    WorkpackSectionIssuesComponent,
    WorkpackSectionProcessesComponent,
    CostAccountCardComponent,
    ProgressBarCostAccountComponent,
    WorkpackSectionDashboardComponent,
    WorkpackSectionJournalComponent,
    WorkpackSectionWBSComponent,
  ],
  imports: [
      CommonModule,
      WorkpackRoutingModule,
      CoreModule,
      ComponentsModule,
      FormsModule,
      ReactiveFormsModule,
      TooltipModule
    ],
})
export class WorkpackModule { }
