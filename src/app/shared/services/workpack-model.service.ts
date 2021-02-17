import { Injectable, Inject, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IWorkpackModel } from '../interfaces/IWorkpackModel';

@Injectable({ providedIn: 'root' })
export class WorkpackModelService extends BaseService<IWorkpackModel> {

  constructor(
    @Inject(Injector) injector: Injector
  ) {
    super('workpack-model', injector);
  }

  hasParentProject(idWorkpackModel: number) {
    return this.http.get<IHttpResult<boolean>>(`${this.urlBase}/${idWorkpackModel}/parent-project`).toPromise();
  }

  canDeleteProperty(idProperty: number) {
    return this.http.get<IHttpResult<boolean>>(`${this.urlBase}/can-delete-property/${idProperty}`).toPromise();
  }
}
