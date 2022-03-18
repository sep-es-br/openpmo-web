import {Component, Inject, OnDestroy, OnInit} from '@angular/core';

import {APP_CONFIG} from 'src/app/shared/tokens/AppConfigToken';
import {IAppConfig} from 'src/app/shared/interfaces/IAppConfig';
import {AuthService} from 'src/app/shared/services/auth.service';
import {ResponsiveService} from 'src/app/shared/services/responsive.service';
import {TranslateService} from '@ngx-translate/core';
import {Subject, Subscription} from 'rxjs';
import {MenuItem} from 'primeng/api';
import {TranslateChangeService} from 'src/app/shared/services/translate-change.service';
import {takeUntil} from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  authButtonIcon: string;
  appConfig: IAppConfig;
  currentLanguage: string;
  subTranslateSrv: Subscription;
  isLoginDenied = false;
  itemsLanguages: MenuItem[] = [];

  $destroy = new Subject();

  constructor(
    public responsiveSrv: ResponsiveService,
    private authSrv: AuthService,
    private translateSrv: TranslateService,
    private translateChangeSrv: TranslateChangeService,
    @Inject(APP_CONFIG) appConfig: IAppConfig
  ) {

    this.translateChangeSrv.getCurrentLang()
      .pipe(takeUntil(this.$destroy))
      .subscribe(() => this.handleChangeLanguage());
    this.appConfig = appConfig;
    if (this.appConfig.authButtonIcon?.length > 0) {
      this.authButtonIcon = this.appConfig.authButtonIcon.indexOf('.') !== -1
        ? `assets/${this.appConfig.authButtonIcon}`
        : this.appConfig.authButtonIcon;
    }
    this.currentLanguage = this.translateSrv.getDefaultLang();
    this.subTranslateSrv = this.translateSrv.onDefaultLangChange
      .pipe(takeUntil(this.$destroy))
      .subscribe(lang => {
        this.currentLanguage = lang.lang;
      });
    this.authSrv.obsIsLoginDenied
      .pipe(takeUntil(this.$destroy))
      .subscribe((value) => this.isLoginDenied = value);
  }

  ngOnInit(): void {
    this.changeLanguage(this.currentLanguage);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  signIn() {
    this.authSrv.signIn();
  }

  async handleClickLogout() {
    await this.authSrv.signOutCitizenAccess();
  }

  handleChangeLanguage() {
    setTimeout(() => this.itemsLanguages = [
      {
        label: 'Português',
        command: () => this.changeLanguage('pt-BR'),
        icon: this.currentLanguage === 'pt-BR' && 'fas fa-check'
      },
      {
        label: 'English',
        command: () => this.changeLanguage('en-US'),
        icon: this.currentLanguage === 'en-US' && 'fas fa-check'
      }
    ], 0);
  }

  changeLanguage(language: string) {
    this.translateChangeSrv.changeLangDefault(language);
  }
}
