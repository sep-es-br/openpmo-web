import { CookieService } from 'ngx-cookie';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { StoreKeys } from '../constants';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNGConfig } from 'primeng/api';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class TranslateChangeService {

  private supportedLangs = [ 'pt-BR', 'en-US' ];
  private subject = new Subject<any>();

  constructor(
    private translate: TranslateService,
    private config: PrimeNGConfig,
    private authSrv: AuthService,
    private cookieSrv: CookieService
  ) {
    this.translate.get('primeng').subscribe(res => this.config.setTranslation(res));
  }


  changeLangDefault(lang: string) {
    if (!this.supportedLangs.includes(lang)) {
      lang = 'en-US';
    }
    const user = this.authSrv.getTokenPayload();
    if (user) {
      const cookiesPermission = this.cookieSrv.get('cookiesPermission'+ user.email);
      if (!!cookiesPermission) {
        const date = moment().add(60, 'days').calendar();
        this.cookieSrv.put('cookiesDefaultLanguateUser' + user.email, lang, { expires: date });
      }
    }
    localStorage.setItem(StoreKeys.defaultLanguage, lang);
    this.translate.setDefaultLang(lang);
    this.translate.use(lang);
    this.translate.get('primeng').subscribe(res => this.config.setTranslation(res));
    this.subject.next({ lang });
  }

  getCurrentLang(): Observable<any> {
    setTimeout(() => {
      const lang = localStorage.getItem(StoreKeys.defaultLanguage) || window.navigator.language;
      this.subject.next({ lang });
    }, 250);
    return this.subject.asObservable();
  }
}
