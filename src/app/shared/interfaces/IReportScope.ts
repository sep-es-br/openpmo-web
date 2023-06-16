export interface IReportScope {
  idPlan: number;
  name: string;
  fullName: string;
  hasPermission: boolean;
  children: ITreeViewScope[];
}
export interface ITreeViewScope {
  id: number;
  name: string;
  fullName: string;
  hasPermission: boolean;
  icon: string;
  children?: ITreeViewScope[];
}