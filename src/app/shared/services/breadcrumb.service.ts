import { Inject, Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { BaseService } from '../base/base.service';

import { IBreadcrumb, IResultBreadcrumb } from '../interfaces/IBreadcrumb';
import { IHttpResult } from '../interfaces/IHttpResult';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({
  providedIn: 'root'
})
export class BreadcrumbService extends BaseService<any> {

  private menus = new BehaviorSubject<IBreadcrumb[]>([]);
  private currentBreadcrumb: Subject<IBreadcrumb[]> = new Subject<IBreadcrumb[]>();
  private key = '@pmo/current-breadcrumb';

  constructor(
    @Inject(Injector) injector: Injector,
  ) {
    super('breadcrumbs', injector);
  }

  getBreadcrumbWorkpack(idWorkpack: number, options?) {
    return this.http.get<IHttpResult<IResultBreadcrumb[]>>(`${this.urlBase}/workpack/${idWorkpack}`,
      { params: PrepareHttpParams(options) }).toPromise();
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

  setBreadcrumbStorage(breadcrumbs: IBreadcrumb[]) {
    localStorage.setItem(this.key, JSON.stringify(breadcrumbs));
    this.currentBreadcrumb.next(breadcrumbs);
  }

  get get(): IBreadcrumb[] {
    let breadcrumbs: IBreadcrumb[];
    try {
      breadcrumbs = JSON.parse(localStorage.getItem(this.key));
      return breadcrumbs;
    } catch (error) {
      breadcrumbs = [];
      return breadcrumbs;
    }
  }

  get ready(): Observable<IBreadcrumb[]> {
    return this.currentBreadcrumb.asObservable();
  }

}
