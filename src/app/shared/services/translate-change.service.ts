import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { StoreKeys } from '../constants';
import { TranslateService } from '@ngx-translate/core';
import { PrimeNGConfig } from 'primeng/api';

@Injectable({
  providedIn: 'root'
})
export class TranslateChangeService {

  private supportedLangs = [ 'pt-BR', 'en-US' ];
  private subject = new Subject<any>();

  constructor(
    private translate: TranslateService,
    private config: PrimeNGConfig
  ) {
    this.translate.get('primeng').subscribe(res => this.config.setTranslation(res));
  }


  changeLangDefault(lang: string) {
    if (!this.supportedLangs.includes(lang)) {
      lang = 'en-US';
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
