export interface IIndicator {
    id?: number;
    idWorkpack?: number;
    name?: string;
    description?: string;
    source?: string;
    measure?: string;
    finalGoal?: number;
    periodicity?: string;
    expectedGoals?: Array<{ period: string; value: number }>;
    achievedGoals?: Array<{ period: string; value: number}>;
    lastUpdate: string;
}