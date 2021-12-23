import { IHttpResult } from './../interfaces/IHttpResult';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';


@Injectable({ providedIn: 'root' })
export class AuthServerService extends BaseService<boolean> {

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('auth-server-citizen', injector);
  }

  public async GetAuthServer() {
    return  await this.http.get<IHttpResult<boolean>>(`${this.urlBase}`).toPromise();
  }

}