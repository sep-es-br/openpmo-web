import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { ILocality, ILocalityList } from '../interfaces/ILocality';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({
  providedIn: 'root'
})
export class LocalityService extends BaseService<ILocality | ILocalityList> {
  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('localities', injector);
  }

  public async getLocalitiesTreeFromDomain(options?): Promise<ILocalityList[]> {
    const { success, data } = await
      this.http.get<IHttpResult<ILocalityList[]>>(`${this.urlBase}/listProperty`, { params: PrepareHttpParams(options) }).toPromise();
    return success ? data : [];
  }

  public async getLocalitiesFirstLevel(options?): Promise<IHttpResult<ILocality[]>> {
    const result = await
      this.http.get<IHttpResult<ILocality[]>>(`${this.urlBase}/firstLevel`, { params: PrepareHttpParams(options) }).toPromise();
      if (!result.data || !result.data.length) {
        result.data = [];
      }
      return result;
  }

  public async getLocalityById(idLocality: number, options?): Promise<IHttpResult<ILocalityList>> {
    const result = await this.http.get<IHttpResult<ILocalityList>>(`${this.urlBase}/${idLocality}`,
      {params: PrepareHttpParams(options)}).toPromise();
    return result;
  }

}
