export interface IBudgetUnitSelectionOption {
  code: string;
  acronym: string;
  name: string;
}

export interface IBudgetPlanSelectionValue {
  id?: number;
  budgetUnitCode: string;
  budgetUnitName: string;
  budgetUnitAcronym: string;
  budgetPlanCode: string;
  budgetPlanName: string;
}

export interface IBudgetPlanSelectionOption {
  uo: string;
  code: string;
  name: string;
}
