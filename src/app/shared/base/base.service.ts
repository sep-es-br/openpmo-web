
import { Inject, Injector } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { ConfirmationService, MessageService } from 'primeng/api';

import { APP_CONFIG } from '../tokens/AppConfigToken';
import { IHttpResult } from '../interfaces/IHttpResult';
import { PrepareHttpParams } from '../utils/query.util';

export abstract class BaseService<T> {

  urlBase = '';
  http: HttpClient;
  confirmationSrv: ConfirmationService;
  messageSrv: MessageService;
  translateSrv: TranslateService;
  private urlBaseOriginal: string;

  constructor(
    public url: string,
    @Inject(Injector) injector: Injector
  ) {
    const appConfig = injector.get(APP_CONFIG);
    this.urlBase = `${appConfig.API}/${this.url}`;
    this.urlBaseOriginal = `${appConfig.API}/${this.url}`;
    this.http = injector.get(HttpClient);
    this.confirmationSrv = injector.get(ConfirmationService);
    this.messageSrv = injector.get(MessageService);
    this.translateSrv = injector.get(TranslateService);
  }

  public async GetAll(options?): Promise<IHttpResult<T[]>> {
    const result = await this.http.get<IHttpResult<T[]>>(`${this.urlBase}`,
      {
        params: PrepareHttpParams(options)
      }
    ).toPromise();
    if (!result.data?.length) {
      result.data = [];
    }
    return result;
  }

  public async GetById(id: number, noLoading?: boolean): Promise<IHttpResult<T>> {
    return this.http.get<IHttpResult<T>>(`${this.urlBase}/${id}`).toPromise();
  }

  public post(model: T): Promise<IHttpResult<T>> {
    return this.http.post<IHttpResult<T>>(this.urlBase, model).toPromise();
  }

  public put(model: T): Promise<IHttpResult<T>> {
    return this.http.put<IHttpResult<T>>(`${this.urlBase}`, model).toPromise();
  }

  /* eslint-disable @typescript-eslint/dot-notation */
  public async delete(model: T, options?: { message?: string; field?: string; useConfirm?: boolean }): Promise<IHttpResult<T>> {
    const message = options?.message;
    const field: string = options?.field;
    const useConfirm: boolean = options?.useConfirm || true;

    return new Promise(async(resolve, reject) => {
      if (useConfirm) {
        this.confirmationSrv.confirm({
          message: message || `${this.translateSrv.instant('messages.deleteConfirmation')} ${model[field ? field : 'name'] || ''}?`,
          key: 'deleteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async() => {
            const result = await this.http.delete<IHttpResult<T>>(`${this.urlBase}/${model['id']}`).toPromise();
            if (result.success) {
              setTimeout(() => {
                this.messageSrv.add({
                  severity: 'success',
                  summary: this.translateSrv.instant('success'),
                  detail: this.translateSrv.instant('messages.deleteSuccessful')
                });
              }, 300);
            }
            resolve(result);
          },
          reject: () => {
            resolve({ success: false, data: undefined });
          }
        });
      } else {
        const result = await this.http.delete<IHttpResult<T>>(`${this.urlBase}/${model['id']}`).toPromise();
        resolve(result);
      }
    });
  }
  /* eslint-enable @typescript-eslint/dot-notation */
}
