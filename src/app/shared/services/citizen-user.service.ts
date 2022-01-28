import {IHttpResult} from '../interfaces/IHttpResult';
import {PrepareHttpParams} from '../utils/query.util';
import {IPerson} from 'src/app/shared/interfaces/IPerson';
import {Inject, Injectable, Injector} from '@angular/core';
import {BaseService} from '../base/base.service';

@Injectable({providedIn: 'root'})
export class CitizenUserService extends BaseService<IPerson> {

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('citizen-users', injector);
  }

  public async GetPublicServersByName(options) {
    const result = await this.http.get<IHttpResult<{ name: string; sub: string }[]>>(`${this.urlBase}/name`,
      {
        params: PrepareHttpParams(options)
      }
    ).toPromise();
    if (!result.data?.length) {
      result.data = [];
    }
    return result;
  }

  public async GetPublicServer(sub: string, options?) {
    return await this.http.get<IHttpResult<IPerson>>(`${this.urlBase}/${sub}`,
      {
        params: PrepareHttpParams(options)
      }
    ).toPromise();
  }

  public async GetCitizenUserByCpf(options) {
    return await this.http.get<IHttpResult<IPerson>>(`${this.urlBase}/cpf`,
      {
        params: PrepareHttpParams(options)
      }
    ).toPromise();
  }

  public async loadCitizenUsers() {
    return await this.http.get(`${this.urlBase}/load`).toPromise();
  }

  public async unloadCitizenUsers() {
    return await this.http.get(`${this.urlBase}/unload`).toPromise();
  }

}
