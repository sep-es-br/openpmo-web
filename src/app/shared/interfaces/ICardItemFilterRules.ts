import { PropertyTemplateModel } from './../models/PropertyTemplateModel';
import { MenuItem } from 'primeng/api';
import { FilterLogicalOperatorsEnum } from './../enums/FilterLogicalOperatorsEnum';
import { FilterOperatorsEnum } from './../enums/FilterOperatorsEnum';
export interface ICardItemFilterRules {
	id?: number;
	typeCard: string;
  propertySelected?: PropertyTemplateModel;
	propertiesList?: PropertyTemplateModel[];
	operator?: FilterOperatorsEnum;
	value?: string | number | boolean | string[] | Date | number[];
	logicalOperator?: FilterLogicalOperatorsEnum;
	menuItems?: MenuItem[];
	deleted?: boolean;
}

