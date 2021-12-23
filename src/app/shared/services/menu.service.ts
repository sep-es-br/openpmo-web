import { PlanMenuItem } from './../interfaces/IMenu';
import { MenuItem } from 'primeng/api';
import { Location } from '@angular/common';
import { Inject, Injectable, Injector } from '@angular/core';
import * as moment from 'moment';
import { CookieService } from 'ngx-cookie';
import { BehaviorSubject, Subject } from 'rxjs';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';

import { IMenu, IMenuOffice, IMenuWorkpack } from '../interfaces/IMenu';
import { PrepareHttpParams } from '../utils/query.util';

interface IMenuState {
  isFixed: boolean;
  menus: IMenu[];
  itemsOffice: MenuItem[];
  itemsPorfolio: PlanMenuItem[];
}

@Injectable({
  providedIn: 'root'
})

export class MenuService extends BaseService<any> {

  adminsPath = [ 'strategies', 'organizations', 'domains',
    'measure-units', 'offices/permission', 'workpack-model', 'configuration-office', 'persons' ];
  plansPath = [ 'plan', 'workpack' ];

  private $reloadMenuOffice = new Subject();
  private $reloadMenuPortfolio = new Subject();
  private isAdminMenuObservable = new BehaviorSubject<boolean>(false);
  private isPlanMenuObservable = new BehaviorSubject<boolean>(false);
  private menuState = new BehaviorSubject<IMenuState>({
    isFixed: false,
    menus: [
      { label: 'office', isOpen: false },
      { label: 'portfolio', isOpen: false },
      { label: 'user', isOpen: false },
      { label: 'more', isOpen: false }
    ],
    itemsOffice: [],
    itemsPorfolio: []
  } as IMenuState);

  constructor(
    @Inject(Injector) injector: Injector,
    private locationSrv: Location,
    private cookieSrv: CookieService
  ) {
    super('menus', injector);
    this.checkURL(`#${this.locationSrv.path()}`);
    this.locationSrv.onUrlChange(url => this.checkURL(url));
  }

  checkURL(url: string) {
    const [ path ] = url.slice(2).split('?');
    this.isAdminMenuObservable.next(!!this.adminsPath.find(p => path.startsWith(p)) && path !== 'persons/profile');
    this.isPlanMenuObservable.next(!!this.plansPath.find(p => path.startsWith(p)));
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

  nextIsPlanMenu(value: boolean) {
    this.isPlanMenuObservable.next(value);
  }

  get isPlanMenu() {
    return this.isPlanMenuObservable.asObservable();
  }

 get getMenuState() {
    return this.menuState.asObservable();
 }

  nextMenuState(value: IMenuState) {
    this.menuState.next(value);
  }

  setCookiesModeMenu(isFixed: boolean , userInfo) {
    const date = moment().add(30, 'days').calendar();
    if (userInfo && userInfo.email) {
      this.cookieSrv.put('menuMode'+userInfo.email, isFixed ? 'fixed' : 'floating', { expires: date} );
    }
  }
}
