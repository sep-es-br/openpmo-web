import { Inject, Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpHeaders,
  HttpInterceptor,
  HttpRequest,
  HttpResponse,
  HttpClient,
} from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, finalize, map, retryWhen, switchMap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { MessageService } from 'primeng/api';
import * as _ from 'lodash';

import { AuthService } from '../services/auth.service';
import { IAppConfig } from '../interfaces/IAppConfig';
import { APP_CONFIG } from '../tokens/AppConfigToken';
import { Router } from '@angular/router';

@Injectable()
export class HttpRequestInterceptor implements HttpInterceptor {

  appConfig: IAppConfig;
  http: HttpClient;
  isRefreshingToken = false;

  constructor(
    private authService: AuthService,
    private messageSrv: MessageService,
    private translateSrv: TranslateService,
    private route: Router,
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
              pagination: body?.pagination,
              message: body?.message || body?.error || ''
            }
          });
        }
        return event;
      }),
      catchError((error: HttpErrorResponse, restart) => {
        this.messageSrv.clear();
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
        }
        else if (error.status === 403) {
          this.messageSrv.add({
            summary: this.translateSrv.instant('error'),
            severity: 'warn',
            detail: this.translateSrv.instant('messages.error.unauthorized')
          });
        }
        else if (error.status === 401) {
          return this.handleUnauthorized(req, next);
        }
        else if (error.status === 500 && error.message.startsWith('JWT expired ')) {
          this.messageSrv.add({
            summary: this.translateSrv.instant('error'),
            severity: 'warn',
            detail: this.translateSrv.instant('messages.error.expired')
          });
          this.route.navigate(['/login']);
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

  handleUnauthorized(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    if (!this.isRefreshingToken) {
        this.isRefreshingToken = true;

        // get a new token via userService.refreshToken
        return from(this.authService.refresh())
            .pipe(switchMap((newToken: boolean) => {
                // did we get a new token retry previous request
                if (newToken) {
                  const accessToken = this.authService.getAccessToken();
                  const headers = new HttpHeaders(accessToken ? { Authorization: `Bearer ${accessToken}` } : { }) ;
                  req = req.clone({ headers });
                  return next.handle(req);
                }

                // If we don't get a new token, we are in trouble so logout.
                this.route.navigate(['/login']);
                this.messageSrv.add({
                  summary: this.translateSrv.instant('error'),
                  severity: 'warn',
                  detail: this.translateSrv.instant('messages.error.expired')
                });
                return of(new HttpResponse({
                  body: {
                    success: false,
                    data: null,
                    message: this.translateSrv.instant('messages.error.expired'),
                  }
                }));
            }),
            catchError(error => {
              this.messageSrv.add({
                summary: this.translateSrv.instant('error'),
                severity: 'warn',
                detail: this.translateSrv.instant('messages.error.unauthorized')
              });
              return of(new HttpResponse({
                body: {
                  success: false,
                  data: error?.error,
                  message: error?.error?.error || error?.message,
                }
              }));
            }),
            finalize(() => {
              this.isRefreshingToken = false;
            })
        );
    } else {
      return next.handle(req);
    }
  }

}
