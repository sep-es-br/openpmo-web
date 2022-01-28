import { StatusJournalEnum } from "../enums/StatusJournalEnum"
import { TypeJournalEnum } from "../enums/TypeJournalEnum"
import { IFile } from "./IFile"

export interface IJournal {
  id?: number;
  type: string, // typeJournalEnum
  date: string,
  person: { id: number, name: string },
  workpack: { id: number, name: string, workpackModelName: string },
  status?: string, // StatusJournalEnum,
  information?: IInformation,
  evidences?: IFile[],
  icon?: string,
}

export interface IInformation {
  title?: string,
  description?: string
}
