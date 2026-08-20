import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CoreModule } from 'src/app/core/core.module';
import { ComponentsModule } from 'src/app/shared/components/components.module';
import { EarnedValueAnalysisDashboardComponent } from './earned-value-analysis-dashboard/earned-value-analysis-dashboard.component';
import { TripleConstraintDashboardComponent } from './triple-constraint-dashboard/triple-constraint-dashboard.component';

@NgModule({
  declarations: [
    TripleConstraintDashboardComponent,
    EarnedValueAnalysisDashboardComponent,
  ],
  imports: [
    CommonModule,
    CoreModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  exports: [
    TripleConstraintDashboardComponent,
    EarnedValueAnalysisDashboardComponent,
  ],
})
export class WorkpackDashboardComponentsModule {}
