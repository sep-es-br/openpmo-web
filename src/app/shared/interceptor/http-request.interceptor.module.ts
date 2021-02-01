import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpRequestInterceptor } from './http-request.interceptor';
import { NgModule } from '@angular/core';

@NgModule({
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpRequestInterceptor,
      multi: true,
    },
  ],
})

export class HttpRequestInterceptorModule {}
