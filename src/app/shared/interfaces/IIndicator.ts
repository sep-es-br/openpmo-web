export interface IIndicator {
    id?: number;
    idWorkpack?: number;
    name?: string;
    description?: string;
    source?: string;
    measure?: string;
    finalGoal?: number;
    periodicity?: string;
    startDate?: Date;
    endDate?: Date;
    expectedGoals?: Array<{lastUpdate: any; period: string; value: number; justification: string}>;
    achievedGoals?: Array<{lastUpdate: any; period: string; value: number; justification: string}>;
    lastUpdate: string;
}