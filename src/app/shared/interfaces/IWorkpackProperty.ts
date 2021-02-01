export interface IWorkpackProperty {
  id?: number;
  type: string;
  idPropertyModel: number;
  value?: string | number | boolean | string[] | number[] | Date;
  selectedValues?: number[];
  selectedValue?: number;
}
