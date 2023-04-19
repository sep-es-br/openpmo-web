import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IWorkpackBreakdownStructure, IWorkpackBreakdownStructureWorkpackModel } from '../interfaces/IWorkpackBreakdownStructure';
import { IHttpResult } from '../interfaces/IHttpResult';

@Injectable({
  providedIn: 'root'
})
export class BreakdownStructureService extends BaseService<IWorkpackBreakdownStructure> {

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('eap', injector);
  }

  async getByWorkpackId(idWorkpack: number): Promise<IHttpResult<IWorkpackBreakdownStructure>> {
    return await this.http.get<IHttpResult<IWorkpackBreakdownStructure>>(`${this.urlBase}/${idWorkpack}`).toPromise();
  }

}
