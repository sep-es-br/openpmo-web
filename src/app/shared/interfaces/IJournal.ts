import { StatusJournalEnum } from "../enums/StatusJournalEnum"
import { TypeJournalEnum } from "../enums/TypeJournalEnum"
import { IFile } from "./IFile"

export interface IJournal {
  id?: number;
  type: string; // typeJournalEnum
  date: string;
  author: { id: number, name: string };
  workpack: { id: number, name: string, workpackModelName: string };
  status?: string; // StatusJournalEnum
  information?: IInformation;
  evidences?: IFile[];
  icon?: string;
}

export interface IInformation {
  title?: string;
  description?: string;
  reason?: string;
  newDate?: string;
  previousDate?: string;
}

export interface IWorkpackJournalInformation {
  date: string;
  id: number;
  actual?: boolean;
  information?: IInformation;
  evidences?: IFile[];
  author?: {
    id: number;
    name: string;
  };
  dateInformation?: string;
  workpack?: {
    id: number;
    name: string;
    workpackModelName: string;
  }
  loading?: boolean;
};
