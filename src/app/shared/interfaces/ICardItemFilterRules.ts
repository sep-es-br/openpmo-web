import { IFilterProperty } from './IFilterProperty';
import { PropertyTemplateModel } from './../models/PropertyTemplateModel';
import { MenuItem, TreeNode } from 'primeng/api';
import { FilterLogicalOperatorsEnum } from './../enums/FilterLogicalOperatorsEnum';
import { FilterOperatorsEnum } from './../enums/FilterOperatorsEnum';
export interface ICardItemFilterRules {
	id?: number;
	typeCard: string;
  propertySelected?: IFilterProperty;
	propertiesList?: IFilterProperty[];
	operator?: FilterOperatorsEnum;
	value?: string | number | boolean | string[] | Date | number[] | TreeNode | TreeNode[];
	logicalOperator?: FilterLogicalOperatorsEnum;
	menuItems?: MenuItem[];
	deleted?: boolean;
}

