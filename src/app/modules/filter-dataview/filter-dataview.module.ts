import { WorkpackModule } from './../workpack/workpack.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule } from './../../shared/components/components.module';
import { CoreModule } from './../../core/core.module';
import { FilterRulePropertyComponent } from './components/filter-rule-property/filter-rule-property.component';
import { FilterRuleCardItemComponent } from './components/filter-rule-card-item/filter-rule-card-item.component';
import { FilterDataviewComponent } from './filter-dataview.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FilterDataviewRoutingModule } from './filter-dataview-routing.module';
import { PropertyTextComponent } from './components/types-properties/property-text/property-text.component';
import { PropertyDateComponent } from './components/types-properties/property-date/property-date.component';
import { PropertyIntegerComponent } from './components/types-properties/property-integer/property-integer.component';
import { PropertyOrganizationSelectionComponent } from './components/types-properties/property-organization-selection/property-organization-selection.component';
import { PropertySelectionComponent } from './components/types-properties/property-selection/property-selection.component';
import { PropertyToggleComponent } from './components/types-properties/property-toggle/property-toggle.component';
import { PropertyTreeSelectionComponent } from './components/types-properties/property-tree-selection/property-tree-selection.component';
import { PropertyUnitSelectionComponent } from './components/types-properties/property-unit-selection/property-unit-selection.component';


@NgModule({
  declarations: [
    FilterDataviewComponent,
    FilterRuleCardItemComponent,
    FilterRulePropertyComponent,
    PropertyTextComponent,
    PropertyDateComponent,
    PropertyIntegerComponent,
    PropertyOrganizationSelectionComponent,
    PropertySelectionComponent,
    PropertyToggleComponent,
    PropertyTreeSelectionComponent,
    PropertyUnitSelectionComponent,
  ],
  imports: [
    CommonModule,
    FilterDataviewRoutingModule,
    CoreModule,
    ComponentsModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class FilterDataviewModule { }
