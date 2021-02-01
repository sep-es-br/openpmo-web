import { Injectable, Inject, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IPerson } from '../interfaces/IPerson';

@Injectable({ providedIn: 'root' })
export class PersonService extends BaseService<IPerson> {

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('person', injector);
  }

  public async GetByEmail(email: string): Promise<IHttpResult<IPerson>> {
    const result = await this.http.get(`${this.urlBase}/${email}`).toPromise();
    return result as IHttpResult<IPerson>;
  }
}


