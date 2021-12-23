import { IWorkpackProperty } from './../../../../shared/interfaces/IWorkpackProperty';
import { FilterDataviewOperators, FilterDataviewLogicalOperators } from './../../../../shared/constants/filterDataviewOperators';
import { SelectItem } from 'primeng/api';
import { IconsEnum } from './../../../../shared/enums/IconsEnum';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from './../../../../shared/services/responsive.service';
import { Subject } from 'rxjs';
import { ICardItemFilterRules } from './../../../../shared/interfaces/ICardItemFilterRules';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';

@Component({
  selector: 'app-filter-rule-card-item',
  templateUrl: './filter-rule-card-item.component.html',
  styleUrls: ['./filter-rule-card-item.component.scss']
})
export class FilterRuleCardItemComponent implements OnInit {

  @Input() filterRuleCard: ICardItemFilterRules;
  @Input() idWorkpackModel: number;
  @Input() indexCard: number;
  @Input() entityName: string;
  @Output() ruleChanged = new EventEmitter();
  @Output() newCardCreated = new EventEmitter();
  @Output() deleteCardItem = new EventEmitter();

  responsive: boolean;
  iconsEnum = IconsEnum;
  cardIdItem: string;
  currentLang: string;
  $destroy = new Subject();
  operatorsList: SelectItem[];
  propertySelected: PropertyTemplateModel;
  logicalOperatorsOptions: SelectItem[];
  workpackModelEntitiesOptions = ['stakeholders', 'risks', 'issues', 'processes'];

  constructor(
    private responsiveSrv: ResponsiveService,
    private translateSrv: TranslateService,
  ) {
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.responsive = value);
    this.currentLang = this.translateSrv.getDefaultLang();
    this.translateSrv.onDefaultLangChange.pipe(takeUntil(this.$destroy)).subscribe(({ lang }) => {
      this.currentLang = lang;
      setTimeout(() => {
        this.loadLogicalOperatorsOptions();
        if ((!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName))) && this.filterRuleCard.typeCard !== 'new-card'
          && this.filterRuleCard && this.filterRuleCard.propertiesList) {
          this.translatePropertiesListOptions()
        };
        if (this.propertySelected && this.propertySelected.possibleValues &&
          (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName)))) {
          this.propertySelected.possibleValues = this.filterRuleCard.propertySelected.possibleValues.map(item => ({
            ...item,
            label: this.translateSrv.instant(item.value)
          }));
        }
      }, 250)
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  ngOnInit(): void {
    this.loadLogicalOperatorsOptions();
    if ((!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName)))
      && this.filterRuleCard.typeCard !== 'new-card' && this.filterRuleCard && this.filterRuleCard.propertiesList) {
      this.translatePropertiesListOptions()
    };
    this.filterRuleCard.menuItems = [{
      label: this.translateSrv.instant('delete'),
      icon: 'fas fa-trash-alt',
      command: (event) => this.deleteCardItem.emit()
    }];
    const operators = FilterDataviewOperators;
    this.operatorsList = operators;
    this.propertySelected = new PropertyTemplateModel();
    if (this.filterRuleCard.propertySelected) {
      this.propertySelected = this.filterRuleCard.propertySelected;
    } else {
      this.filterRuleCard.propertySelected = new PropertyTemplateModel();
    }
  }

  loadLogicalOperatorsOptions() {
    this.logicalOperatorsOptions = Array.from(FilterDataviewLogicalOperators.map(op => ({ label: this.translateSrv.instant(op), value: op })));
  }

  handleChangeRoleCard() {
    if (this.validatedCard()) {
      this.ruleChanged.emit();
    }
  }

  handlePropertySelected(event) {
    this.propertySelected = this.filterRuleCard.propertySelected;
    if (this.filterRuleCard.propertySelected.possibleValues) {
      this.propertySelected.possibleValues = (!this.idWorkpackModel || (!!this.idWorkpackModel && this.workpackModelEntitiesOptions.includes(this.entityName))) ?
        this.filterRuleCard.propertySelected.possibleValues.map(item => ({
          ...item,
          label: this.translateSrv.instant(item.value)
        })) : this.filterRuleCard.propertySelected.possibleValues;
    }

    if (this.validatedCard()) {
      this.ruleChanged.emit();
    }
  }

  handleSetPropertyValue() {
    const property: IWorkpackProperty = this.propertySelected.getValues();
    this.filterRuleCard.propertySelected.value = property.value ? property.value : (property.selectedValue ? property.selectedValue : property.selectedValues);
    if (this.validatedCard()) {
      this.ruleChanged.emit();
    }
  }

  validatedCard() {
    if (!this.propertySelected) {
      return false;
    }
    if (!this.filterRuleCard.operator) {
      return false;
    }
    if (!this.filterRuleCard.logicalOperator) {
      return false;
    }
    const property: IWorkpackProperty = this.propertySelected.getValues();
    if (!property || (!property.value && !property.selectedValue && (!property.selectedValues || property.selectedValues.length === 0))) {
      return false;
    }
    return true;
  }

  translatePropertiesListOptions() {
    this.filterRuleCard.propertiesList.forEach(prop => prop.label = this.translateSrv.instant(prop.name));
  }

}