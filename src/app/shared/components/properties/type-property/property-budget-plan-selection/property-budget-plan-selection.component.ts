import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  IBudgetPlanSelectionOption,
  IBudgetPlanSelectionValue,
  IBudgetUnitSelectionOption
} from 'src/app/shared/interfaces/IBudgetPlanSelection';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { PentahoService } from 'src/app/shared/services/pentaho.service';

@Component({
  selector: 'app-property-budget-plan-selection',
  templateUrl: './property-budget-plan-selection.component.html',
  styleUrls: ['./property-budget-plan-selection.component.scss']
})
export class PropertyBudgetPlanSelectionComponent {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();

  visible = false;
  loadingUnits = false;
  loadingPlans = false;
  budgetUnits: IBudgetUnitSelectionOption[] = [];
  budgetPlans: IBudgetPlanSelectionOption[] = [];
  selectedBudgetUnit: IBudgetUnitSelectionOption | undefined = undefined;
  draftValues: IBudgetPlanSelectionValue[] = [];
  searchTerm = '';

  constructor(private pentahoService: PentahoService) {
  }

  get selectedValues(): IBudgetPlanSelectionValue[] {
    return (this.property?.selectedValues as IBudgetPlanSelectionValue[])
      || (this.property?.value as IBudgetPlanSelectionValue[])
      || [];
  }

  get displayValue(): string {
    return this.selectedValues
      .map(value => `${value.budgetPlanCode} - ${value.budgetPlanName}`)
      .join('; ');
  }

  get filteredBudgetPlans(): IBudgetPlanSelectionOption[] {
    const term = this.normalize(this.searchTerm);
    if (!term) {
      return this.budgetPlans;
    }
    return this.budgetPlans.filter(plan =>
      this.normalize(plan.code).includes(term) || this.normalize(plan.name).includes(term)
    );
  }

  planDisplayName(plan: IBudgetPlanSelectionOption): string {
    const name = plan && plan.name ? plan.name : '';
    const namePart = name.split('-', 2)[1];
    return namePart && namePart.trim() ? namePart.trim() : name;
  }

  planSelectionDisplayName(plan: IBudgetPlanSelectionValue): string {
    const name = plan && plan.budgetPlanName ? plan.budgetPlanName : '';
    const namePart = name.split('-', 2)[1];
    return namePart && namePart.trim() ? namePart.trim() : name;
  }

  open(): void {
    if (this.property.disabled) {
      return;
    }
    this.draftValues = this.selectedValues.map(value => ({ ...value }));
    this.visible = true;
    if (!this.budgetUnits.length) {
      this.loadBudgetUnits();
    }
  }

  loadBudgetUnits(): void {
    this.loadingUnits = true;
    this.pentahoService.getBudgetUnitsForProperty().subscribe(units => {
      this.budgetUnits = units.sort((a, b) =>
        `${a.code} ${a.acronym} ${a.name}`.localeCompare(`${b.code} ${b.acronym} ${b.name}`)
      );
      this.loadingUnits = false;
    });
  }

  onBudgetUnitChange(budgetUnit: IBudgetUnitSelectionOption | undefined): void {
    this.selectedBudgetUnit = budgetUnit;
    this.budgetPlans = [];
    this.searchTerm = '';
    this.loadingPlans = false;

    if (!budgetUnit?.code) {
      return;
    }

    this.loadingPlans = true;
    this.pentahoService.getBudgetPlansForProperty(budgetUnit.code).subscribe(plans => {
      if (this.selectedBudgetUnit?.code !== budgetUnit.code) {
        return;
      }
      this.budgetPlans = plans.sort((a, b) =>
        `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`)
      );
      this.loadingPlans = false;
    });
  }

  isSelected(plan: IBudgetPlanSelectionOption): boolean {
    return this.draftValues.some(value =>
      value.budgetUnitCode === this.selectedBudgetUnit?.code && value.budgetPlanCode === plan.code
    );
  }

  togglePlan(plan: IBudgetPlanSelectionOption): void {
    if (!this.selectedBudgetUnit) {
      return;
    }
    const index = this.draftValues.findIndex(value =>
      value.budgetUnitCode === this.selectedBudgetUnit.code && value.budgetPlanCode === plan.code
    );
    if (index >= 0) {
      this.draftValues.splice(index, 1);
      return;
    }
    const value: IBudgetPlanSelectionValue = {
      budgetUnitCode: this.selectedBudgetUnit.code,
      budgetUnitName: this.selectedBudgetUnit.name,
      budgetUnitAcronym: this.selectedBudgetUnit.acronym,
      budgetPlanCode: plan.code,
      budgetPlanName: plan.name
    };
    this.draftValues = this.property.multipleSelection ? [...this.draftValues, value] : [value];
  }

  removeDraft(value: IBudgetPlanSelectionValue): void {
    this.draftValues = this.draftValues.filter(item =>
      item.budgetUnitCode !== value.budgetUnitCode || item.budgetPlanCode !== value.budgetPlanCode
    );
  }

  confirm(): void {
    this.property.selectedValues = this.draftValues.map(value => ({ ...value }));
    this.property.invalid = false;
    this.visible = false;
    this.changed.emit(this.property.selectedValues);
  }

  clear(): void {
    this.property.selectedValues = [];
    this.draftValues = [];
    this.changed.emit(this.property.selectedValues);
  }

  private normalize(value: string): string {
    return (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}
