export interface IWorkpackShared {
  id?: number;
  level: string;
  office?: {
    id: number;
    name: string;
    fullName?: string;
  }
}