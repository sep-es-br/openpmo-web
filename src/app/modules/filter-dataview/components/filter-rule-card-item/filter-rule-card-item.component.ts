import { TypePropertyModelEnum } from './../../../../shared/enums/TypePropertyModelEnum';
import { IFilterProperty } from 'src/app/shared/interfaces/IFilterProperty';
import { IWorkpackProperty } from './../../../../shared/interfaces/IWorkpackProperty';
import { FilterDataviewOperators, FilterDataviewLogicalOperators } from './../../../../shared/constants/filterDataviewOperators';
import { SelectItem, TreeNode } from 'primeng/api';
import { IconsEnum } from './../../../../shared/enums/IconsEnum';
import { takeUntil, filter } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { ResponsiveService } from './../../../../shared/services/responsive.service';
import { Subject } from 'rxjs';
import { ICardItemFilterRules } from './../../../../shared/interfaces/ICardItemFilterRules';
import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { PropertyTemplateModel } from 'src/app/shared/models/PropertyTemplateModel';
import * as moment from 'moment';

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
  propertySelected: IFilterProperty;
  logicalOperatorsOptions: SelectItem[];
  workpackModelEntitiesOptions = ['stakeholders', 'risks', 'issues', 'processes'];
  typePropertyModel = TypePropertyModelEnum;

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
    if (this.filterRuleCard.propertySelected) {
      this.propertySelected = this.filterRuleCard.propertySelected;
    }
  }

  loadLogicalOperatorsOptions() {
    this.logicalOperatorsOptions = Array.from(FilterDataviewLogicalOperators.map(op => ({ label: this.translateSrv.instant(op), value: op })));
  }

  handleChangeRoleCard(event) {
    this.filterRuleCard.operator = event.value;
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
    this.setDefaultValue();
    if (this.validatedCard()) {
      this.ruleChanged.emit();
    }
  }

  setDefaultValue() {
    if (this.typePropertyModel[this.propertySelected.type] === TypePropertyModelEnum.DateModel) {
      const dateValue = (this.propertySelected.defaultValue && this.propertySelected.defaultValue.toLocaleString());
      this.filterRuleCard.value = dateValue ? new Date(dateValue) : null;
    }
    if (this.typePropertyModel[this.propertySelected.type] === TypePropertyModelEnum.SelectionModel && this.propertySelected.multipleSelection) {
      const listValues = this.propertySelected.defaultValue as string;
      this.filterRuleCard.value = listValues.split(',');
    }
    if (this.propertySelected.localitiesSelected ) {
      this.filterRuleCard.value = this.propertySelected.multipleSelection ? this.propertySelected.localitiesSelected as TreeNode[]
      : this.propertySelected.localitiesSelected[0] as TreeNode;
    }
    if (this.typePropertyModel[this.propertySelected.type] === TypePropertyModelEnum.OrganizationSelectionModel) {
      
      if (this.propertySelected.multipleSelection) {
        this.filterRuleCard.value = this.propertySelected.defaults as number[];
      }
      if (!this.propertySelected.multipleSelection) {
        const defaults = this.propertySelected.defaults && this.propertySelected.defaults as number[];
        const defaultsValue = defaults && defaults[0];
        this.filterRuleCard.value = defaultsValue && defaultsValue;
      }
    } 
    if (this.typePropertyModel[this.propertySelected.type] === TypePropertyModelEnum.UnitSelectionModel) {
      this.filterRuleCard.value = this.propertySelected.defaults as number;
    }
  }

  handleSetPropertyValue(event) {
    this.filterRuleCard.propertySelected = this.propertySelected;
    switch (this.propertySelected.type) {
      case 'Date': 
        const date = event.value as Date;
        this.filterRuleCard.value = moment(date).toDate();
        break;
      case 'LocalitySelection':
        if (!!this.propertySelected.multipleSelection) {
          const selection = event.value as TreeNode[];
          this.filterRuleCard.value = selection;
        } else {
          const selection = event.value as TreeNode;
          this.filterRuleCard.value = selection;
        }
        break;
      default:
        this.filterRuleCard.value = event.value;
        break;
    }
    if (this.validatedCard()) {
      this.ruleChanged.emit(event);
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
    if (!this.propertySelected || (this.propertySelected.type !== 'Toggle' && !this.filterRuleCard.value)) {
      return false;
    }
    return true;
  }

  translatePropertiesListOptions() {
    this.filterRuleCard.propertiesList.forEach(prop => prop.label = this.translateSrv.instant(prop.name));
  }

}