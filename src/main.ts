import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { IAppConfig } from './app/shared/interfaces/IAppConfig';
import { ITheme } from './app/shared/interfaces/ITheme';
import { resolveTheme } from './app/shared/themes/themes';
import { APP_CONFIG } from './app/shared/tokens/AppConfigToken';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

const applyTheme = (theme: ITheme) => {
  document.documentElement.setAttribute('data-theme', theme.name);
  document.title = theme.documentTitle;

  const favicon: HTMLLinkElement = document.querySelector('link[rel="icon"]');
  if (favicon) {
    favicon.href = theme.favicon;
    favicon.type = theme.favicon.endsWith('.svg') ? 'image/svg+xml' : 'image/png';
  }
};

const showFatalError = () => {
  document.body.innerHTML =
    '<div style="font-family: sans-serif; padding: 32px; color: #333333;">' +
    '<h1>Open PMO</h1>' +
    '<p>Não foi possível carregar a configuração da aplicação.</p>' +
    '<p>Tente novamente em alguns instantes ou contate o suporte.</p>' +
    '</div>';
};

const fetchThemeName = (appConfig: IAppConfig): Promise<string | undefined> =>
  new Promise(resolve => {
    const request = new XMLHttpRequest();

    request.addEventListener('load', ({ target }: any) => {
      if (target.status !== 200) {
        console.error(`Error: retrieving theme from API (HTTP ${target.status})`);
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(target.responseText)?.data?.theme);
      } catch (error) {
        console.error(error);
        resolve(undefined);
      }
    });

    request.addEventListener('error', () => {
      console.error('Error: retrieving theme from API');
      resolve(undefined);
    });

    request.open('GET', `${appConfig.API}/configuration`);
    request.send();
  });

const bootstrap = (appConfig: IAppConfig, themeName?: string) => {
  const theme = resolveTheme(themeName || appConfig.theme);
  applyTheme(theme);

  const configuration: IAppConfig = { ...appConfig, theme: theme.name };

  platformBrowserDynamic([{ provide: APP_CONFIG, useValue: configuration }])
    .bootstrapModule(AppModule)
    .catch(err => console.error(err));
};

const configListener = ({ target }) => {
  let appConfig: IAppConfig;

  try {
    appConfig = JSON.parse(target.responseText);
  } catch (error) {
    console.error(error);
    showFatalError();
    return;
  }

  fetchThemeName(appConfig).then(themeName => bootstrap(appConfig, themeName));
};

const configFailed = () => {
  console.error('Error: retrieving app-config.json');
  showFatalError();
};

const request = new XMLHttpRequest();
request.addEventListener('load', configListener);
request.addEventListener('error', configFailed);
request.open('GET', './assets/config/app-config.json');
request.send();
