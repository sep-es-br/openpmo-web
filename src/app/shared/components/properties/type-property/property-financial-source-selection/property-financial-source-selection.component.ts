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
  selectedType: SourceOption | undefined = undefined;
  selectedGroup: SourceOption | undefined = undefined;
  selectedSource: SourceOption | undefined = undefined;
  searchTerm = '';

  constructor(private pentahoService: PentahoService) {
  }

  get level(): FinancialSourceSelectionLevel {
    return this.property.selectionLevel || 'DETAIL';
  }

  get selectedValues(): IFinancialSourceSelectionValue[] {
    return (this.property?.selectedValues as IFinancialSourceSelectionValue[])
      || (this.property?.value as IFinancialSourceSelectionValue[])
      || [];
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

  get finalOptions(): SourceOption[] {
    switch (this.level) {
      case 'TYPE': return this.typeOptions;
      case 'GROUP': return this.groupOptions;
      case 'SOURCE': return this.sourceOptions;
      case 'DETAIL': return this.detailOptions;
    }
  }

  get filteredFinalOptions(): SourceOption[] {
    const term = this.normalize(this.searchTerm);
    if (!term) {
      return this.finalOptions;
    }
    return this.finalOptions.filter(option =>
      this.normalize(option.code).includes(term) || this.normalize(option.name).includes(term)
    );
  }

  get canSearch(): boolean {
    switch (this.level) {
      case 'TYPE':
      case 'GROUP':
        return true;
      case 'SOURCE':
        return !!this.selectedGroup;
      case 'DETAIL':
        return !!this.selectedType && !!this.selectedGroup && !!this.selectedSource;
    }
  }

  get searchLabel(): string {
    switch (this.level) {
      case 'TYPE': return 'Buscar tipo de fonte por código ou nome';
      case 'GROUP': return 'Buscar grupo por código ou nome';
      case 'SOURCE': return 'Buscar fonte por código ou nome';
      case 'DETAIL': return 'Buscar detalhamento da fonte por código ou nome';
    }
  }

  get searchPlaceholder(): string {
    switch (this.level) {
      case 'TYPE': return 'Digite o código ou o nome do tipo de fonte';
      case 'GROUP': return 'Digite o código ou o nome do grupo';
      case 'SOURCE': return 'Digite o código ou o nome da fonte';
      case 'DETAIL': return 'Digite o código ou o nome do detalhamento';
    }
  }

  get missingFiltersMessage(): string {
    switch (this.level) {
      case 'SOURCE':
        return 'Selecione um grupo para carregar as fontes disponíveis.';
      case 'DETAIL':
        return 'Selecione um tipo, um grupo e uma fonte para carregar os detalhamentos disponíveis.';
      default:
        return '';
    }
  }

  get noOptionsMessage(): string {
    switch (this.level) {
      case 'TYPE': return 'Nenhum tipo de fonte disponível.';
      case 'GROUP': return 'Nenhum grupo disponível para os filtros informados.';
      case 'SOURCE': return 'Nenhuma fonte disponível para os filtros informados.';
      case 'DETAIL': return 'Nenhum detalhamento disponível para os filtros informados.';
    }
  }

  get noResultsMessage(): string {
    switch (this.level) {
      case 'TYPE': return 'Nenhum tipo de fonte encontrado para a busca informada.';
      case 'GROUP': return 'Nenhum grupo encontrado para a busca informada.';
      case 'SOURCE': return 'Nenhuma fonte encontrada para a busca informada.';
      case 'DETAIL': return 'Nenhum detalhamento encontrado para a busca informada.';
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
    this.selectedGroup = undefined;
    this.selectedSource = undefined;
    this.searchTerm = '';
  }

  onGroupChange(): void {
    this.selectedSource = undefined;
    this.searchTerm = '';
  }

  onSourceChange(): void {
    this.searchTerm = '';
  }

  isSelected(option: SourceOption): boolean {
    if (!this.canSearch) {
      return false;
    }
    const key = this.valueKey(this.currentValue(option));
    return this.draftValues.some(value => this.valueKey(value) === key);
  }

  toggleOption(option: SourceOption): void {
    if (!this.canSearch) {
      return;
    }
    const value = this.currentValue(option);
    const key = this.valueKey(value);
    const existingIndex = this.draftValues.findIndex(item => this.valueKey(item) === key);
    if (existingIndex >= 0) {
      this.draftValues.splice(existingIndex, 1);
      return;
    }
    this.draftValues = this.property.multipleSelection ? [...this.draftValues, value] : [value];
  }

  removeDraft(value: IFinancialSourceSelectionValue): void {
    const key = this.valueKey(value);
    this.draftValues = this.draftValues.filter(item => this.valueKey(item) !== key);
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

  private currentValue(option: SourceOption): IFinancialSourceSelectionValue {
    switch (this.level) {
      case 'TYPE':
        return { typeCode: option.code, typeName: option.name };
      case 'GROUP':
        return {
          sourceGroupCode: option.code,
          sourceGroupName: option.name
        };
      case 'SOURCE':
        return {
          sourceGroupCode: this.selectedGroup.code,
          sourceGroupName: this.selectedGroup.name,
          sourceCode: option.code,
          sourceName: option.name
        };
      case 'DETAIL':
        return {
          typeCode: this.selectedType.code,
          typeName: this.selectedType.name,
          sourceGroupCode: this.selectedGroup.code,
          sourceGroupName: this.selectedGroup.name,
          sourceCode: this.selectedSource.code,
          sourceName: this.selectedSource.name,
          detailedSourceCode: option.code,
          detailedSourceName: option.name
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
    this.selectedType = undefined;
    this.selectedGroup = undefined;
    this.selectedSource = undefined;
    this.searchTerm = '';
  }

  private normalize(value: string): string {
    return (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
}
