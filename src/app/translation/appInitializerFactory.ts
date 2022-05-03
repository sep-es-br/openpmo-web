import { LOCATION_INITIALIZED } from '@angular/common';
import { Injector } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { StoreKeys } from '../shared/constants';

export const appInitializerFactory = (translate: TranslateService, 
    injector: Injector
    ) =>
  () => new Promise<any>((resolve: any) => {
  const locationInitialized = injector.get(LOCATION_INITIALIZED, Promise.resolve(null));
  locationInitialized.then(() => {
    
    const defaultLang = localStorage.getItem(StoreKeys.defaultLanguage) || window.navigator.language;
    console.log('defaultLang', defaultLang);
    translate.setDefaultLang(defaultLang);
    translate.use(defaultLang).subscribe(() => {
      console.log(`Successfully initialized '${defaultLang}' language.'`);
    }, err => {
      console.error(`Problem with '${defaultLang}' language initialization.'`);
    }, () => {
      resolve(null);
    });
  });
});

