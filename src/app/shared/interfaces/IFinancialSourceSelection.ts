export type FinancialSourceSelectionLevel = 'TYPE' | 'GROUP' | 'SOURCE' | 'DETAIL';

export interface IFinancialSourceSelectionValue {
  id?: number;
  typeCode?: string;
  typeName?: string;
  sourceGroupCode?: string;
  sourceGroupName?: string;
  sourceCode?: string;
  sourceName?: string;
  detailedSourceCode?: string;
  detailedSourceName?: string;
}
