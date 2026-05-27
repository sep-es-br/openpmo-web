import { Injectable, Inject, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IOrganization } from '../interfaces/IOrganization';

@Injectable({ providedIn: 'root' })
export class OrganizationService extends BaseService<IOrganization> {

constructor(
  @Inject(Injector) injector: Injector
) {
  super('organizations', injector);
  }

  async existsIntegratedOrganizationByName(
    name: string
  ) {
    const params: any = { name };

    return this.http.get(
      `${this.urlBase}/exists-integrated-name`,
      { params }
    ).toPromise();
  }
}
