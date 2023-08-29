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

  async loadWorkpackBreadcrumbs(idWorkpack: number, idPlan: number) {
    const { success, data } = await this.getBreadcrumbWorkpack(idWorkpack, { 'id-plan': idPlan });
    return success
      ? data.map(p => ({
        key: !p.modelName ? p.type.toLowerCase() : p.modelName,
        info: p.name,
        tooltip: p.fullName,
        routerLink: this.getRouterLinkFromType(p.type),
        queryParams: { id: p.id, idWorkpackModelLinked: p.idWorkpackModelLinked, idPlan: idPlan },
        modelName: p.modelName
      }))
      : [];
  }

  getRouterLinkFromType(type: string): string[] {
    switch (type) {
      case 'office':
        return ['/offices', 'office'];
      case 'plan':
        return ['plan'];
      default:
        return ['/workpack'];
    }
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

  storageBreadcrumb(breadcrumbs: IBreadcrumb[]) {
    localStorage.setItem(this.key, JSON.stringify(breadcrumbs));
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
