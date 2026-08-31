import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';

export interface IPluginAvailability {
  agreements: boolean;
  procurements: boolean;
  obligations: boolean;
  edocs: boolean;
  budgetPlans: boolean;
  financialSources: boolean;
}

@Injectable({ providedIn: 'root' })
export class PluginAvailabilityService extends BaseService<IPluginAvailability> {
  constructor(@Inject(Injector) injector: Injector) {
    super('plugins', injector);
  }

  getAvailability(): Promise<IHttpResult<IPluginAvailability>> {
    return this.http.get<IHttpResult<IPluginAvailability>>(
      `${this.urlBase}/availability`
    ).toPromise();
  }
}
