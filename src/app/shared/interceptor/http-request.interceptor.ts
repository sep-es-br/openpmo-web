import { Inject, Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import * as _ from 'lodash';

import { AuthService } from '../services/auth.service';
import { IAppConfig } from '../interfaces/IAppConfig';
import { APP_CONFIG } from '../tokens/AppConfigToken';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {

  appConfig: IAppConfig;

  constructor(
    private authService: AuthService,
    private messageSrv: MessageService,
    private translateSrv: TranslateService,
    @Inject(APP_CONFIG) appConfig: IAppConfig
  ) {
    this.appConfig = appConfig;
  }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ) {
    const accessToken = this.authService.getAccessToken();
    const headers = new HttpHeaders(accessToken ? { Authorization: `Bearer ${accessToken}` } : { }) ;
    req = req.clone({ headers });
    return next.handle(req).pipe(
      map((event: HttpEvent<any>) => {
        if (event instanceof HttpResponse && req.url.startsWith(this.appConfig.API)) {
          const body = event.body;
          return event.clone({
            body: {
              success: true,
              data: body?.data === undefined ? body : body?.data,
              message: body?.message || body?.error || ''
            }
          });
        }
        return event;
      }),
      catchError((error: HttpErrorResponse) => {
        if ([422, 404, 400].includes(error.status)) {
          const message = error?.error?.message || error?.error?.erro
            || error?.message || this.translateSrv.instant('messages.error.generic');
          if (error?.error instanceof Array) {
            const field = this.translateSrv.instant('field');
            this.messageSrv.add({
              summary: this.translateSrv.instant('error'),
              severity: 'warn',
              detail: error.error.map(err => `${field} ${err.field} ${this.translateSrv.instant(`messages.error.${err.error}`)}`).join('. ')
            });
          } else {
            this.messageSrv.add({
              summary: this.translateSrv.instant('error'),
              severity: 'warn',
              detail: this.translateSrv.instant(`messages.error.${message}`)
            });
          }
        } else if (error.status === 403 || error.status === 401) {
          this.messageSrv.add({
            summary: this.translateSrv.instant('error'),
            severity: 'warn',
            detail: this.translateSrv.instant('messages.error.unauthorized')
          });
        }
        return of(new HttpResponse({
          body: {
            success: false,
            data: error?.error,
            message: error?.error?.error || error?.message,
          }
        }));
      })
    );
  }
}
