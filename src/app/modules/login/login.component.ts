import { Component, Inject } from '@angular/core';

import { APP_CONFIG } from 'src/app/shared/tokens/AppConfigToken';
import { IAppConfig } from 'src/app/shared/interfaces/IAppConfig';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  authButtonIcon: string;
  appConfig: IAppConfig;

  constructor(
    public responsiveSrv: ResponsiveService,
    private authSrv: AuthService,
    @Inject(APP_CONFIG) appConfig: IAppConfig
  ) {
    this.appConfig = appConfig;
    if (this.appConfig.authButtonIcon?.length > 0) {
      this.authButtonIcon = this.appConfig.authButtonIcon.indexOf('.') !== -1
        ? `assets/${this.appConfig.authButtonIcon}`
        : this.appConfig.authButtonIcon;
    }
  }

  signIn() {
    this.authSrv.signIn();
  }
}
