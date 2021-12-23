export interface IPersonProfile {
  id?: number;
  avatar: string;
  name: string;
  fullName?: string;
  email: string;
  contactEmail?: string;
  address?: string;
  administrator?: boolean;
  phoneNumber?: string;
  roles?: string[];
  unifiqueOffice: boolean;
}
