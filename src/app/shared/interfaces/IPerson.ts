export interface IPerson {
  id?: number;
  name: string;
  fullName?: string;
  email: string;
  contactEmail?: string;
  address?: string;
  administrator?: boolean;
  phoneNumber?: string;
  roles?: string[];
}
