import { Component, Inject, OnDestroy } from '@angular/core';

import { APP_CONFIG } from 'src/app/shared/tokens/AppConfigToken';
import { IAppConfig } from 'src/app/shared/interfaces/IAppConfig';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnDestroy {

  authButtonIcon: string;
  appConfig: IAppConfig;
  currentLanguage: string;
  subTranslateSrv: Subscription;

  constructor(
    public responsiveSrv: ResponsiveService,
    private authSrv: AuthService,
    private translateSrv: TranslateService,
    @Inject(APP_CONFIG) appConfig: IAppConfig
  ) {
    this.appConfig = appConfig;
    if (this.appConfig.authButtonIcon?.length > 0) {
      this.authButtonIcon = this.appConfig.authButtonIcon.indexOf('.') !== -1
        ? `assets/${this.appConfig.authButtonIcon}`
        : this.appConfig.authButtonIcon;
    }
    this.currentLanguage = this.translateSrv.getDefaultLang();
    this.subTranslateSrv = this.translateSrv.onDefaultLangChange.subscribe(lang => this.currentLanguage = lang);
  }

  ngOnDestroy(): void {
    this.subTranslateSrv?.unsubscribe();
  }

  signIn() {
    this.authSrv.signIn();
  }
}
