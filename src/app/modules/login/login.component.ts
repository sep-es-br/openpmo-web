import { Component } from '@angular/core';
import { AuthService } from 'src/app/shared/services/auth.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  authButtonIcon: string;

  constructor(
    public responsiveSrv: ResponsiveService,
    private authSrv: AuthService
  ) {
    if (environment.authButtonIcon?.length > 0) {
      this.authButtonIcon = environment.authButtonIcon.indexOf('.') !== -1
        ? `assets/${environment.authButtonIcon}`
        : environment.authButtonIcon;
    }
  }

  signIn() {
    this.authSrv.signIn();
  }
}
