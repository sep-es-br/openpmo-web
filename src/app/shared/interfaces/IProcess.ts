export interface IProcess {
  id?: number;
  idWorkpack?: number;
  processNumber: string;
  name?: string;
  subject?: string;
  currentOrganization: string;
  lengthOfStayOn?: number;
  note?: string;
  priority?: boolean;
  status?: string;
  history?: IProcessHistoryItem[];
}


export interface IProcessHistoryItem {
  updateDate: string;
  daysDuration: number;
  organizationName: string;
  sector: string;

  date?: Date;
  left?: boolean; // screen
  right?: boolean; //screen
}