export interface IWorkpackProperty {
  id?: number;
  type: string;
  name?: string;
  session?: string;
  idPropertyModel: number;
  value?: string | number | boolean | string[] | number[] | Date;
  selectedValues?: number[];
  selectedValuesDetails?: {id: number; name: string; fullName: string}[];
  selectedValue?: number;
  reason?: string;
  groupedProperties?: IWorkpackProperty[];
}
