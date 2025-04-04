export interface IIndicator {
    id?: number;
    idWorkpack?: number;
    name?: string;
    description?: string;
    source?: string;
    measure?: string;
    periodicity?: string;
    startDate?: Date;
    endDate?: Date;
    periodGoals?: Array<{lastUpdate: any; period: string; expectedValue: number; achievedValue: number; justification: string}>;
    lastUpdate: string;
}