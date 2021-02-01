import { IPerson } from './IPerson';

export interface ISocialLoginResult {
  person: IPerson;
  completed: boolean;
  type: string;
  token: string;
  refreshToken: string;
}
