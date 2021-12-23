import { IBaseline } from './IBaseline';

export interface IWorkpackBaselines {
    idWorkpack: number;
    nameWorkpack: string;
    baselines: IBaseline[];
}
