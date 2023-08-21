export interface IHttpResult<T> {
  success: boolean;
  data: T;
  pagination?: IPagination;
  message?: string;
  erro?: string;
}

interface IPagination {
  size: number;
  page: number;
  totalRecords: number;
  totalPages: number;
}
