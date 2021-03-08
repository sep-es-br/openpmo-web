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

  pushMenu(crumb: IBreadcrumb) {
    const newMenus = Array.from(this.menus.value);
    const itemMenuFoundIndex = this.findIndexMenu(crumb);
    if (itemMenuFoundIndex === -1) {
      newMenus.push(crumb);
      this.menus.next(newMenus);
    } else {
      this.menus.next(newMenus.slice(0, itemMenuFoundIndex + 1));
    }
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

  handleHistoryPop(url: string) {
    const currentMenus = Array.from(this.menus.value);
    const index = currentMenus.length - 2 > -1 ? currentMenus.length - 2 : 0;
    const lastMenu = currentMenus[index];
    if (lastMenu && url === this.getURLFromCrumb(lastMenu)) {
      this.popMenu();
    }
  }

  getURLFromCrumb(crumb: IBreadcrumb) {
    const crumbPath = crumb.routerLink.join('/');
    const crumbQueries = Object.keys(crumb.queryParams || {})
      .map(key => `${key}=${crumb.queryParams[key]}`)
      .join();
    return crumbPath + (crumbQueries ? `?${crumbQueries}` : '');;
  }

  private popMenu() {
    const newMenus = Array.from(this.menus.value);
    newMenus.pop();
    this.menus.next(newMenus);
  }

  private findIndexMenu(crumb: IBreadcrumb) {
    return this.menus.value.findIndex(menu => {
      const isSamePath = crumb.routerLink.reduce((a, b, i) => a ? menu.routerLink[i] === b : a, true);
      const isSamePathLength = crumb.routerLink.length === menu.routerLink.length;
      if (isSamePath && isSamePathLength) {
        const isSameQueries = Object.keys(crumb.queryParams || {})
          .reduce((a, b) => a ? crumb.queryParams[b]?.toString() === menu.queryParams[b]?.toString() : a, true);
        const isSameQueriesLength = Object.keys(crumb.queryParams || {}).length === Object.keys(menu.queryParams || {}).length;
        return isSameQueries && isSameQueriesLength;
      }
      return false;
    });
  }
}
