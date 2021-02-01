export interface IHttpResult<T> {
  success: boolean;
  data: T;
  message?: string;
  erro?: string;
}
