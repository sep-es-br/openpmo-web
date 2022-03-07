import { IBaseline } from "./IBaseline";
import { IDashboard } from "./IDashboard";

export interface IDashboardData {
 idWorkpack: number;
 dashboardShowStakeholders: string[];
 dashboardShowRisks: boolean;
 dashboardShowMilestones: boolean;
 dashboardShowEVA: boolean;
 workpackFullName: string;
 workpackType: string;
 dashboard: IDashboard;
 baselines: IBaseline[];
 referenceMonth: Date;
 yearRange: string;
 startDate: Date;
 endDate: Date;
}
