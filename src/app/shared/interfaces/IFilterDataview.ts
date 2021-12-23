import { FilterLogicalOperatorsEnum } from '../enums/FilterLogicalOperatorsEnum';
import { FilterOperatorsEnum } from '../enums/FilterOperatorsEnum';

export interface IFilterDataview {
  id?: number;
  name: string;
  sortBy: string;
  favorite?: boolean;
  sortByDirection: string;
  rules?: {
    id?: number;
    propertyName: string;
    operator: FilterOperatorsEnum
    value: string | number | boolean | string[] | Date | number[];
    logicOperator: FilterLogicalOperatorsEnum
  }[ ]; 
}