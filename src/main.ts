import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { IAppConfig } from './app/shared/interfaces/IAppConfig';
import { APP_CONFIG } from './app/shared/tokens/AppConfigToken';
import { environment } from './environments/environment';

const configListener = ({ target }) => {
  try {
    const configuration: IAppConfig = JSON.parse(target.responseText);
    platformBrowserDynamic([{ provide: APP_CONFIG, useValue: configuration }])
      .bootstrapModule(AppModule)
      .catch(err => console.error(err));
  } catch (error) {
    console.error(error);
  }
};

const configFailed = () => console.error('Error: retrieving config.json');

if (environment.production) {
  enableProdMode();
}

const request = new XMLHttpRequest();
request.addEventListener('load', configListener);
request.addEventListener('error', configFailed);
request.open('GET', './assets/config/app-config.json');
request.send();
