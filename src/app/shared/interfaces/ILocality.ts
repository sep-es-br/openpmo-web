export interface ILocality {
  id?: number;
  idDomain: number;
  idParent?: number;
  name: string;
  fullName: string;
  latitude: string;
  longitude: string;
  type: string;
}

export interface ILocalityList {
  id: number;
  domain?: {
    fullName: string;
    id: number;
    name: string;
  };
  name: string;
  fullName: string;
  latitude?: string;
  longitude?: string;
  type?: string;
  children?: ILocalityList[];
}


