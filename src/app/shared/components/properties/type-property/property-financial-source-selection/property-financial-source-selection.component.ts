import { Component, EventEmitter, Input, Output } from '@angular/core';
import {
  FinancialSourceSelectionLevel,
  IFinancialSourceSelectionValue
} from 'src/app/shared/interfaces/IFinancialSourceSelection';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import { PentahoService } from 'src/app/shared/services/pentaho.service';

interface SourceOption {
  code: string;
  name: string;
}

@Component({
  selector: 'app-property-financial-source-selection',
  templateUrl: './property-financial-source-selection.component.html',
  styleUrls: ['./property-financial-source-selection.component.scss']
})
export class PropertyFinancialSourceSelectionComponent {

  @Input() property: PropertyTemplateModel;
  @Output() changed = new EventEmitter();

  visible = false;
  loading = false;
  rows: IFinancialSourceSelectionValue[] = [];
  draftValues: IFinancialSourceSelectionValue[] = [];
  selectedType: SourceOption;
  selectedGroup: SourceOption;
  selectedSource: SourceOption;
  selectedDetail: SourceOption;

  constructor(private pentahoService: PentahoService) {
  }

  get level(): FinancialSourceSelectionLevel {
    return this.property.selectionLevel || 'DETAIL';
  }

  get selectedValues(): IFinancialSourceSelectionValue[] {
    return (this.property?.value as IFinancialSourceSelectionValue[]) || [];
  }

  get displayValue(): string {
    return this.selectedValues.map(value => this.valueLabel(value)).join('; ');
  }

  get typeOptions(): SourceOption[] {
    return this.distinct(this.rows.map(row => ({ code: row.typeCode, name: row.typeName })));
  }

  get groupOptions(): SourceOption[] {
    return this.distinct(this.filteredRows('TYPE').map(row => ({
      code: row.sourceGroupCode,
      name: row.sourceGroupName
    })));
  }

  get sourceOptions(): SourceOption[] {
    return this.distinct(this.filteredRows('GROUP').map(row => ({
      code: row.sourceCode,
      name: row.sourceName
    })));
  }

  get detailOptions(): SourceOption[] {
    return this.distinct(this.filteredRows('SOURCE').map(row => ({
      code: row.detailedSourceCode,
      name: row.detailedSourceName
    })));
  }

  get canSelect(): boolean {
    switch (this.level) {
      case 'TYPE': return !!this.selectedType;
      case 'GROUP': return !!this.selectedGroup;
      case 'SOURCE': return !!this.selectedGroup && !!this.selectedSource;
      case 'DETAIL': return !!this.selectedType && !!this.selectedGroup && !!this.selectedSource && !!this.selectedDetail;
    }
  }

  open(): void {
    if (this.property.disabled) {
      return;
    }
    this.draftValues = this.selectedValues.map(value => ({ ...value }));
    this.resetFilters();
    this.visible = true;
    if (!this.rows.length) {
      this.loading = true;
      this.pentahoService.getFinancialSourcesForProperty().subscribe(rows => {
        this.rows = rows;
        this.loading = false;
      });
    }
  }

  onTypeChange(): void {
    this.selectedGroup = null;
    this.selectedSource = null;
    this.selectedDetail = null;
  }

  onGroupChange(): void {
    this.selectedSource = null;
    this.selectedDetail = null;
  }

  onSourceChange(): void {
    this.selectedDetail = null;
  }

  addSelection(): void {
    if (!this.canSelect) {
      return;
    }
    const value = this.currentValue();
    const key = this.valueKey(value);
    if (!this.draftValues.some(item => this.valueKey(item) === key)) {
      this.draftValues = this.property.multipleSelection ? [...this.draftValues, value] : [value];
    }
    if (!this.property.multipleSelection) {
      this.confirm();
    }
  }

  removeDraft(value: IFinancialSourceSelectionValue): void {
    const key = this.valueKey(value);
    this.draftValues = this.draftValues.filter(item => this.valueKey(item) !== key);
  }

  confirm(): void {
    this.property.value = this.draftValues.map(value => ({ ...value }));
    this.property.invalid = false;
    this.visible = false;
    this.changed.emit(this.property.value);
  }

  clear(): void {
    this.property.value = [];
    this.draftValues = [];
    this.changed.emit(this.property.value);
  }

  valueLabel(value: IFinancialSourceSelectionValue): string {
    if (value.detailedSourceCode) {
      return `${value.detailedSourceCode} - ${value.detailedSourceName}`;
    }
    if (value.sourceCode) {
      return `${value.sourceCode} - ${value.sourceName}`;
    }
    if (value.sourceGroupCode) {
      return `${value.sourceGroupCode} - ${value.sourceGroupName}`;
    }
    return `${value.typeCode} - ${value.typeName}`;
  }

  private currentValue(): IFinancialSourceSelectionValue {
    switch (this.level) {
      case 'TYPE':
        return { typeCode: this.selectedType.code, typeName: this.selectedType.name };
      case 'GROUP':
        return {
          sourceGroupCode: this.selectedGroup.code,
          sourceGroupName: this.selectedGroup.name
        };
      case 'SOURCE':
        return {
          sourceGroupCode: this.selectedGroup.code,
          sourceGroupName: this.selectedGroup.name,
          sourceCode: this.selectedSource.code,
          sourceName: this.selectedSource.name
        };
      case 'DETAIL':
        return {
          typeCode: this.selectedType.code,
          typeName: this.selectedType.name,
          sourceGroupCode: this.selectedGroup.code,
          sourceGroupName: this.selectedGroup.name,
          sourceCode: this.selectedSource.code,
          sourceName: this.selectedSource.name,
          detailedSourceCode: this.selectedDetail.code,
          detailedSourceName: this.selectedDetail.name
        };
    }
  }

  private filteredRows(level: 'TYPE' | 'GROUP' | 'SOURCE'): IFinancialSourceSelectionValue[] {
    return this.rows.filter(row => {
      const typeMatches = !this.selectedType || row.typeCode === this.selectedType.code;
      const groupMatches = level === 'TYPE' || !this.selectedGroup || row.sourceGroupCode === this.selectedGroup.code;
      const sourceMatches = level !== 'SOURCE' || !this.selectedSource || row.sourceCode === this.selectedSource.code;
      return typeMatches && groupMatches && sourceMatches;
    });
  }

  private distinct(options: SourceOption[]): SourceOption[] {
    const mapped = new Map<string, SourceOption>();
    options.filter(option => option.code).forEach(option => mapped.set(`${option.code}|${option.name}`, option));
    return Array.from(mapped.values()).sort((a, b) => `${a.code} ${a.name}`.localeCompare(`${b.code} ${b.name}`));
  }

  private valueKey(value: IFinancialSourceSelectionValue): string {
    return [value.typeCode, value.sourceGroupCode, value.sourceCode, value.detailedSourceCode].join('|');
  }

  private resetFilters(): void {
    this.selectedType = null;
    this.selectedGroup = null;
    this.selectedSource = null;
    this.selectedDetail = null;
  }
}
