import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { APP_INITIALIZER, Injector, NgModule } from '@angular/core';
import { TranslateLoader, TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { JWT_OPTIONS, JwtHelperService } from '@auth0/angular-jwt';
import { ConfirmationService, MessageService } from 'primeng/api';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LoginComponent } from './modules/login/login.component';
import { CoreModule } from './core/core.module';
import { httpLoaderFactory } from './translation/HttpLoaderFactory';
import { HomeComponent } from './modules/home/home.component';
import { HttpRequestInterceptorModule } from './shared/interceptor/http-request.interceptor.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { appInitializerFactory } from './translation/appInitializerFactory';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    HttpRequestInterceptorModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (httpLoaderFactory),
        deps: [HttpClient]
      }
    }),
    CoreModule,
    FontAwesomeModule
  ],
  providers: [
    {
      provide: JWT_OPTIONS,
      useValue: JWT_OPTIONS
    },
    JwtHelperService,
    {
      provide: APP_INITIALIZER,
      useFactory: appInitializerFactory,
      deps: [ TranslateService, Injector ],
      multi: true
    },
    MessageService,
    ConfirmationService
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
