import { InjectionToken } from '@angular/core';
import { IAppConfig } from '../interfaces/IAppConfig';

export const APP_CONFIG = new InjectionToken<IAppConfig>('app-config');
