import { MenuItem } from "primeng/api";

export interface ICartItemCostAssignment {
  type: string;
  unitMeasureName?: string;
  unitMeasurePrecision?: number;
  idCost?: number;
  idCostAssignment?: number;
  costAccountName?: string;
  plannedWork?: number;
  actualWork?: number;
  menuItemsCost?: MenuItem[];
  menuItemsNewCost?: MenuItem[];
  readonly?: boolean;
  showReplicateButton?: boolean;
  costAccountAllocation?: {
    actual: number;
    limit: number;
    planed: number;
  },
  endStep?: boolean;
}