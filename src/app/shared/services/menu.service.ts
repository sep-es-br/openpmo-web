import { Location } from '@angular/common';
import { Inject, Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';

import { IMenuOffice, IMenuWorkpack } from '../interfaces/IMenu';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({
  providedIn: 'root'
})
export class MenuService extends BaseService<any> {

  adminsPath = [ 'strategies', 'organizations', 'domains', 'measure-units', 'offices/permission', 'workpack-model' ];
  private $reloadMenuOffice = new Subject();
  private $reloadMenuPortfolio = new Subject();
  private isAdminMenuObservable = new BehaviorSubject<boolean>(false);

  constructor(
    @Inject(Injector) injector: Injector,
    private locationSrv: Location
  ) {
    super('menus', injector);
    this.checkURL(`#${this.locationSrv.path()}`);
    this.locationSrv.onUrlChange(url => this.checkURL(url));
  }

  checkURL(url: string) {
    const [ path ] = url.slice(2).split('?');
    this.isAdminMenuObservable.next(!!this.adminsPath.find(p => path.startsWith(p)));
  }

  reloadMenuOffice() {
    this.$reloadMenuOffice.next();
  }

  obsReloadMenuOffice() {
    return this.$reloadMenuOffice.asObservable();
  }

  reloadMenuPortfolio() {
    this.$reloadMenuPortfolio.next();
  }

  obsReloadMenuPortfolio() {
    return this.$reloadMenuPortfolio.asObservable();
  }

  getItemsOffice(): Promise<IHttpResult<IMenuOffice[]>> {
    return this.http.get<IHttpResult<IMenuOffice[]>>(`${this.urlBase}/office`).toPromise();
  }

  getItemsPortfolio(idOffice: number): Promise<IHttpResult<IMenuWorkpack[]>> {
    return this.http.get<IHttpResult<IMenuWorkpack[]>>(`${this.urlBase}/portfolio`,
      {
        params: PrepareHttpParams({ 'id-office': idOffice })
      }
    ).toPromise();
  }

  nextIsAdminMenu(value: boolean) {
    this.isAdminMenuObservable.next(value);
  }

  get isAdminMenu() {
    return this.isAdminMenuObservable.asObservable();
  }
}
