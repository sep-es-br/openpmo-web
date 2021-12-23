export interface ITreeViewScopeOffice {
  id: number;
  name: string;
  plans: ITreeViewScopePlan[];
}

export interface ITreeViewScopePlan {
  id: number;
  name: string;
  workpacks: ITreeViewScopeWorkpack[];
}

export interface ITreeViewScopeWorkpack {
  id: number;
  name: string;
  icon: string;
  children: ITreeViewScopeWorkpack[];
}
