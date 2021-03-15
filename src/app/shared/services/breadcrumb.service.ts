import { Inject, Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BaseService } from '../base/base.service';

import { IBreadcrumb, IResultBreadcrumb } from '../interfaces/IBreadcrumb';
import { IHttpResult } from '../interfaces/IHttpResult';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService extends BaseService<any> {

  private menus = new BehaviorSubject<IBreadcrumb[]>([]);

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('breadcrumbs', injector);
  }

  getBreadcrumbWorkpack(idWorkpack: number) {
    return this.http.get<IHttpResult<IResultBreadcrumb[]>>(`${this.urlBase}/workpack/${idWorkpack}`).toPromise();
  }

  getBreadcrumbWorkpackModel(idWorkpackModel: number) {
    return this.http.get<IHttpResult<IResultBreadcrumb[]>>(`${this.urlBase}/model/${idWorkpackModel}`).toPromise();
  }

  getBreadcrumbLocality(idLocality: number) {
    return this.http.get<IHttpResult<IResultBreadcrumb[]>>(`${this.urlBase}/locality/${idLocality}`).toPromise();
  }

  setMenu(value: IBreadcrumb[]) {
    this.menus.next(value);
  }

  get observable() {
    return this.menus.asObservable();
  }

  updateLastCrumb(crumb: IBreadcrumb) {
    const newMenus = Array.from(this.menus.value);
    newMenus.pop();
    newMenus.push(crumb);
    this.setMenu(newMenus);
  }
}
