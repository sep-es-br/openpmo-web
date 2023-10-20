import { IMenuFavorites, IMenuPlanModel, PlanMenuItem } from './../interfaces/IMenu';
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
  idPlanMenu?: number;
  hasReports?: boolean;
  idOfficeItemsPlanModel?: number;
  menus?: IMenu[];
  itemsOffice?: MenuItem[];
  itemsFavorites?: IMenuFavorites[];
  itemsPortfolio?: PlanMenuItem[];
  itemsPlanModel?: any[];
}

@Injectable({
  providedIn: 'root'
})

export class MenuService extends BaseService<any> {

  adminsPath = [ 'strategies', 'organizations', 'domains', 'config/filter-dataview',
    'measure-units', 'offices/permission', 'workpack-model', 'configuration-office', 'persons', 'report-models' ];
  plansPath = [ 'plan', 'workpack', 'stakeholder', 'reports', 'ccbmember-baselines-view', 'filter-dataview', 'persons/profile'];
  idNewWorkpack: number;

  private $reloadMenuOffice = new Subject();
  private $reloadMenuFavorite = new Subject();
  private $reloadMenuPortfolio = new Subject();
  private $reloadMenuPlanModel = new Subject();
  private $removedFavorites = new Subject();
  private isAdminMenuObservable = new BehaviorSubject<boolean>(false);
  private isPlanMenuObservable = new BehaviorSubject<boolean>(false);
  private closeAllMenus = new BehaviorSubject<boolean>(false);
  private closeMenuUser = new BehaviorSubject<boolean>(false);
  private toggleMenu = new BehaviorSubject<string>('');
  private hasFavoriteItemsObservable = new BehaviorSubject<boolean>(false);
  private menuPortfolioItems = new BehaviorSubject<IMenuWorkpack[]>([]);

  private menuState = new BehaviorSubject<IMenuState>({
    isFixed: false,
    menus: [
      { label: 'office', isOpen: false },
      { label: 'portfolio', isOpen: false },
      { label: 'planModel', isOpen: false },
      { label: 'favorite', isOpen: false },
      { label: 'user', isOpen: false },
      { label: 'more', isOpen: false }
    ],
    itemsOffice: [],
    itemsFavorites: [],
    itemsPortfolio: [],
    itemsPlanModel: []
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

  nextMenuPortfolioItems(value) {
    this.menuPortfolioItems.next(value);
  }

  get obsMenuPortfolioItems() {
    return this.menuPortfolioItems.asObservable();
  }

  nextCloseAllMenus(value) {
    this.closeAllMenus.next(value);
  }

  get obsCloseAllMenus() {
    return this.closeAllMenus.asObservable();
  }

  nextCloseMenuUser(value) {
    this.closeMenuUser.next(value);
  }

  get obsCloseMenuUser() {
    return this.closeMenuUser.asObservable();
  }

  nextToggleMenu(value) {
    this.toggleMenu.next(value);
  }

  get obsToggleMenu() {
    return this.toggleMenu.asObservable();
  }

  reloadMenuOffice() {
    this.$reloadMenuOffice.next();
  }

  obsReloadMenuOffice() {
    return this.$reloadMenuOffice.asObservable();
  }

  reloadMenuFavorite() {
    this.$reloadMenuFavorite.next();
  }

  obsReloadMenuFavorite() {
    return this.$reloadMenuFavorite.asObservable();
  }

  reloadMenuPortfolio(idWorkpack?: number) {
    this.idNewWorkpack = idWorkpack;
    this.$reloadMenuPortfolio.next();
  }

  getIdNewWorkpack() {
    return this.idNewWorkpack;
  }

  obsReloadMenuPortfolio() {
    return this.$reloadMenuPortfolio.asObservable();
  }

  reloadMenuPlanModel() {
    this.$reloadMenuPlanModel.next();
  }

  obsReloadMenuPlanModel() {
    return this.$reloadMenuPlanModel.asObservable();
  }

  getItemsOffice(): Promise<IHttpResult<IMenuOffice[]>> {
    return this.http.get<IHttpResult<IMenuOffice[]>>(`${this.urlBase}/office`).toPromise();
  }

  getItemsPortfolio(idOffice: number, idPlan: number): Promise<IHttpResult<IMenuWorkpack[]>> {
    return this.http.get<IHttpResult<IMenuWorkpack[]>>(`${this.urlBase}/portfolio`,
      {
        params: PrepareHttpParams({
          'id-office': idOffice,
          'id-plan': idPlan
       })
      }
    ).toPromise();
  }

  getParentsItemsPortfolio(idWorkpack: number, idPlan: number): Promise<IHttpResult<{parents: number[]}>> {
    return this.http.get<IHttpResult<{parents: number[]}>>(`${this.urlBase}/portfolios/parents`,
      {
        params: PrepareHttpParams({
          'id-workpack': idWorkpack,
          'id-plan': idPlan
       })
      }
    ).toPromise();
  }

  getParentsItemsWorkpackModel(idWorkpackModel: number): Promise<IHttpResult<{parents: number[]}>> {
    return this.http.get<IHttpResult<{parents: number[]}>>(`${this.urlBase}/planModels/parents`,
      {
        params: PrepareHttpParams({
          'id-workpack-model': idWorkpackModel,
       })
      }
    ).toPromise();
  }

  getItemsPlanModel(idOffice: number): Promise<IHttpResult<IMenuPlanModel[]>> {
    return this.http.get<IHttpResult<IMenuPlanModel[]>>(`${this.urlBase}/planModels`,
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

  nextHasFavoriteItems(value: boolean) {
    this.hasFavoriteItemsObservable.next(value);
  }

  get hasFavoriteItems() {
    return this.hasFavoriteItemsObservable.asObservable();
  }

  get getMenuState() {
    return this.menuState.asObservable();
 }

  nextMenuState(value: IMenuState) {
    this.menuState.next(value);
  }

  get getRemovedFavorites() {
    return this.$removedFavorites.asObservable();
 }

  nextRemovedFavorited(idRemoved: number) {
    this.$removedFavorites.next(idRemoved);
  }

  
}
