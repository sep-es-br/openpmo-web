import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from './card/card.component';
import { CardItemComponent } from './card-item/card-item.component';
import { CoreModule } from 'src/app/core/core.module';
import { InputMessageComponent } from './input-message/input-message.component';
import { SaveButtonComponent } from './save-button/save-button.component';
import { CardItemPermissionComponent } from './card-item-permission/card-item-permission.component';
import { PipesModule } from '../pipes/pipes.module';
import { ProgressBarComponent } from './progress-bar/progress-bar.component';
import { InputUnitMeasureComponent } from './input-unit-measure/input-unit-measure.component';
import { ConfigDataViewPanelComponent } from './config-data-view-panel/config-data-view-panel.component';
import { AvatarModule } from 'primeng/avatar';
import { BaselineCardItemComponent } from './baseline-card-item/baseline-card-item.component';
import { CardItemFileComponent } from './card-item-file/card-item-file.component';
import { DoughnutChartComponent } from './dashboards/doughnut-chart/doughnut-chart.component';
import { GaugeChartComponent } from './dashboards/gauge-chart/gauge-chart.component';
import { WorkpackCardItemComponent } from './workpack-card-item/workpack-card-item.component';
import { CostConstraintComponent } from './dashboards/cost-constraint/cost-constraint.component';
import { ScheduleConstraintComponent } from './dashboards/schedule-constraint/schedule-constraint.component';
import { ScopeConstraintComponent } from './dashboards/scope-constraint/scope-constraint.component';
import { TabviewScrolledComponent } from './tabview-scrolled/tabview-scrolled.component';
import { CardLoadingComponent } from './card-loading/card-loading.component';
import { CostAssignmentCardItemComponent } from './cost-assignment-card-item/cost-assignment-card-item.component';
import { CardItemReportModelComponent } from './card-item-report-model/card-item-report-model.component';
import { PropertyModelComponent } from './property-model/property-model.component';
import { PropertyComponent } from './properties/property/property.component';
import { PropertyDateComponent } from './properties/type-property/property-date/property-date.component';
import { PropertyIntegerComponent } from './properties/type-property/property-integer/property-integer.component';
import { PropertyOrganizationSelectionComponent } from './properties/type-property/property-organization-selection/property-organization-selection.component';
import { PropertySelectionComponent } from './properties/type-property/property-selection/property-selection.component';
import { PropertyTextComponent } from './properties/type-property/property-text/property-text.component';
import { PropertyTextareaComponent } from './properties/type-property/property-textarea/property-textarea.component';
import { PropertyToggleComponent } from './properties/type-property/property-toggle/property-toggle.component';
import { PropertyTreeSelectionComponent } from './properties/type-property/property-tree-selection/property-tree-selection.component';
import { PropertyUnitSelectionComponent } from './properties/type-property/property-unit-selection/property-unit-selection.component';
import { PropertyGroupComponent } from './properties/type-property/property-group/property-group.component';
import { ButtonsContainerComponent } from './buttons-container/buttons-container.component';
import { CancelButtonComponent } from './cancel-button/cancel-button.component';
import { CardJournalInformationComponent } from './card-journal-information/card-journal-information.component';
import { CardListComponent } from './card-list/card-list.component';
import { SearchItemCardComponent } from './search-item-card/search-item-card.component';

@NgModule({
  declarations: [
    CardComponent,
    CardItemComponent,
    InputMessageComponent,
    SaveButtonComponent,
    CardItemPermissionComponent,
    ProgressBarComponent,
    InputUnitMeasureComponent,
    ConfigDataViewPanelComponent,
    BaselineCardItemComponent,
    CardItemFileComponent,
    DoughnutChartComponent,
    GaugeChartComponent,
    WorkpackCardItemComponent,
    CostConstraintComponent,
    ScheduleConstraintComponent,
    ScopeConstraintComponent,
    TabviewScrolledComponent,
    CardLoadingComponent,
    CostAssignmentCardItemComponent,
    CardItemReportModelComponent,
    PropertyModelComponent,
    PropertyComponent,
    PropertyDateComponent,
    PropertyIntegerComponent,
    PropertyOrganizationSelectionComponent,
    PropertySelectionComponent,
    PropertyTextComponent,
    PropertyTextareaComponent,
    PropertyToggleComponent,
    PropertyTreeSelectionComponent,
    PropertyUnitSelectionComponent,
    PropertyGroupComponent,
    ButtonsContainerComponent,
    CancelButtonComponent,
    CardJournalInformationComponent,
    CardListComponent,
    SearchItemCardComponent
  ],
  imports: [
    CommonModule,
    CoreModule,
    PipesModule,
    AvatarModule,
  ],
  exports: [
    PipesModule,
    CardComponent,
    CardItemComponent,
    CardItemPermissionComponent,
    CardListComponent,
    InputMessageComponent,
    SaveButtonComponent,
    ProgressBarComponent,
    InputUnitMeasureComponent,
    ConfigDataViewPanelComponent,
    BaselineCardItemComponent,
    CardItemFileComponent,
    DoughnutChartComponent,
    GaugeChartComponent,
    WorkpackCardItemComponent,
    CostConstraintComponent,
    ScheduleConstraintComponent,
    ScopeConstraintComponent,
    TabviewScrolledComponent,
    CardLoadingComponent,
    CostAssignmentCardItemComponent,
    CardItemReportModelComponent,
    PropertyModelComponent,
    PropertyComponent,
    ButtonsContainerComponent,
    CancelButtonComponent,
    CardJournalInformationComponent,
    SearchItemCardComponent
  ]
})
export class ComponentsModule { }
