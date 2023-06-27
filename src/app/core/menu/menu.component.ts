import { Location } from '@angular/common';
import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { CookieService } from 'ngx-cookie';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { IMenuWorkpack, IMenuWorkpackModel, PlanMenuItem, IMenu, IMenuPlanModel } from 'src/app/shared/interfaces/IMenu';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MenuService } from 'src/app/shared/services/menu.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { PlanService } from 'src/app/shared/services/plan.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { TranslateChangeService } from 'src/app/shared/services/translate-change.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IMenuFavorites } from '../../shared/interfaces/IMenu';
import { MobileViewService } from 'src/app/shared/services/mobile-view.service';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ReportService } from 'src/app/shared/services/report.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit, OnDestroy {
  @ViewChild('menuSliderOffices') menuOffices: ElementRef<HTMLDivElement>;
  @ViewChild('menuSliderPortfolio') menuPortfolio: ElementRef<HTMLDivElement>;
  @ViewChild('menuSliderPlanModel') menuPlanModel: ElementRef<HTMLDivElement>;

  @Output() changeMenu = new EventEmitter<boolean>();

  menus: IMenu[] = [
    { label: 'office', isOpen: false },
    { label: 'portfolio', isOpen: false },
    { label: 'planModel', isOpen: false },
    { label: 'favorite', isOpen: false },
    { label: 'user', isOpen: false },
    { label: 'more', isOpen: false }
  ];

  isMobileView = false;
  isChangingView = false;
  items: MenuItem[] = [];
  itemsOfficeUnchanged = [];
  itemsOffice = [];
  itemsPlanModel: MenuItem[] = [];
  itemsFavorites: IMenuFavorites[] = [];
  itemsPortfolio = [];
  itemsLanguages: MenuItem[] = [];
  username = '';
  currentIDOffice = 0;
  isUserAdmin = false;
  currentURL = '';
  currentUserInfo: IPerson;
  $destroy = new Subject();
  editPermissionOnOffice = false;
  isPlanMenu = false;
  currentPlan: IPlan;
  currentIDPlan = 0;
  isFixed = false;
  menuStateChanged = false;
  isAdminMenu = false;
  parentsWorkpack = [];
  changedUrl = false;
  propertiesOffice: IOffice;
  itemsBreadcrumb = [];
  storageBreadcrumbsItems = [];
  hasReports = false;

  constructor(
    private menuSrv: MenuService,
    private translateChangeSrv: TranslateChangeService,
    private translateSrv: TranslateService,
    public authSrv: AuthService,
    private mobileViewSrv: MobileViewService,
    private router: Router,
    private locationSrv: Location,
    private officeSrv: OfficeService,
    private officePermissionSrv: OfficePermissionService,
    private planSrv: PlanService,
    private workpackSrv: WorkpackService,
    private cookieSrv: CookieService,
    private confirmationSrv: ConfirmationService,
    private breadcrumbSrv: BreadcrumbService,
    private reportSrv: ReportService
  ) {
    this.translateChangeSrv.getCurrentLang()
      .pipe(takeUntil(this.$destroy))
      .subscribe(() => this.handleChangeLanguage());
    this.officeSrv.observableIdOffice().pipe(takeUntil(this.$destroy)).subscribe(async id => {
      if (!this.isFixed) {
        this.currentIDOffice = id;
        this.getPropertiesOffice(this.currentIDOffice);
        await this.loadPlanModelMenu();
      }
    });
    this.planSrv.observableIdPlan().pipe(takeUntil(this.$destroy)).subscribe(async id => {
      if (!this.isFixed) {
        this.currentIDPlan = id
          if (this.currentIDPlan && this.currentIDPlan !== 0) {
            localStorage.setItem('@currentPlan', this.currentIDPlan.toString());
          }
          await this.loadPropertiesPlan();
          await this.loadPortfolioMenu();
          await this.loadFavoritesMenu();
          await this.loadReportsMenu();
      }
    });
    this.menuSrv.obsReloadMenuOffice().pipe(takeUntil(this.$destroy)).subscribe(() => !this.isFixed && this.loadOfficeMenu());
    this.menuSrv.obsReloadMenuFavorite().pipe(takeUntil(this.$destroy)).subscribe(() => !this.isFixed && this.loadFavoritesMenu());
    this.menuSrv.obsReloadMenuPortfolio().pipe(takeUntil(this.$destroy)).subscribe(() => {
      const idNewWorkpack = this.menuSrv.getIdNewWorkpack();
      this.changedUrl = false;
      if (!this.isFixed) this.loadPortfolioMenu(idNewWorkpack);

    });
    this.menuSrv.obsReloadMenuPlanModel().pipe(takeUntil(this.$destroy)).subscribe(() => !this.isFixed && this.loadPlanModelMenu());
    this.menuSrv.isAdminMenu.pipe(takeUntil(this.$destroy)).subscribe(isAdminMenu => {
      if (!this.isFixed) {
        this.isAdminMenu = isAdminMenu;
        this.changeMenu.emit(this.isAdminMenu);
        this.updateMenuOfficeOnAdminChange();
        if (isAdminMenu) {
          this.getOfficePermission();
        }
      }
    });
    this.menuSrv.isPlanMenu.pipe(takeUntil(this.$destroy)).subscribe(isPlanMenu => {
      if (!this.isFixed) {
        this.isPlanMenu = isPlanMenu;
      }
    });
    this.mobileViewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(responsive => {
      if (!this.isFixed) {
        this.isChangingView = true;
        this.isMobileView = responsive;
        setTimeout(() => {
          this.isChangingView = false;
        }, 250);
      }
    });
    this.locationSrv.onUrlChange(url => {
      if (!this.isFixed) {
        this.changedUrl = true;
        this.currentURL = url.slice(2);
        this.selectMenuActive(url.slice(2));
      }
    });
    this.menuSrv.getMenuState.pipe(takeUntil(this.$destroy)).subscribe(async (menuState) => {
      this.isFixed = menuState.isFixed;
      if (!this.isFixed) {
        this.menus = menuState.menus;
        const authenticated = await this.authSrv.isAuthenticated();
        if (authenticated) {
          this.loadOfficeMenu();
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    const payload = this.authSrv.getTokenPayload();
    await this.loadOfficeMenu();
    await this.loadCurrentInfo();
    this.username = this.isUserAdmin
      ? 'Admin'
      : (this.currentUserInfo.name?.split(' ').shift() || payload.email);
    this.getMenuModeUser();
    this.changeMenu.emit(this.isAdminMenu);
  }

  async loadCurrentInfo() {
    this.currentUserInfo = await this.authSrv.getInfoPerson();
  }

  async getPropertiesOffice(idOffice) {
    if (idOffice) {
      const result = await this.officeSrv.GetById(idOffice);
      if (result.success) {
        this.propertiesOffice = result.data;
      }
    }
  }

  getMenuModeUser() {
    const user = this.authSrv.getTokenPayload();
    const isFixed = this.cookieSrv.get('menuMode' + user.email) === 'true' ? true : false;
    if (!!isFixed) {
      this.toggleMenu('office');
      this.handleChangeMenuMode();
    }
  }

  handleChangeMenuMode() {
    this.isFixed = true;
    this.setCookieMenuMode();
    const itemsOffice = this.menus[0].isOpen ? this.itemsOffice : [];
    const itemsPortfolio = this.menus[1].isOpen ? this.itemsPortfolio : [];
    const itemsFavorites = this.menus[3].isOpen ? this.itemsFavorites : [];
    const itemsPlanModel = this.menus[2].isOpen ? this.itemsPlanModel : [];
    this.menuSrv.nextMenuState({
      isFixed: this.isFixed,
      menus: this.menus,
      itemsOffice,
      itemsPortfolio,
      itemsFavorites,
      itemsPlanModel
    });
  }

  async loadReportsMenu() {
    const result = await this.reportSrv.checkHasActiveReports({'id-plan': this.currentIDPlan});
    if (result.success) {
      this.hasReports = result.data;
    }
  }

  setCookieMenuMode() {
    const date = moment().add(60, 'days').calendar();
    const user = this.authSrv.getTokenPayload();
    if (user && user.email) {
      this.cookieSrv.put('menuMode' + user.email, 'true', { expires: date });
    }
  }

  updateMenuOfficeOnAdminChange() {
    this.itemsOffice = this.itemsOffice && this.itemsOffice
      .map((office, i) => ((office.items = this.isAdminMenu ? undefined : this.itemsOfficeUnchanged[i].items), office));
  }

  async getOfficePermission() {
    if (this.currentIDOffice) {
      this.editPermissionOnOffice = await this.officePermissionSrv.getPermissions(this.currentIDOffice);
    } else {
      setTimeout(() => this.getOfficePermission(), 150);
    }
  }

  handleChangeLanguage() {
    setTimeout(() =>
      this.itemsLanguages = [
        {
          label: this.translateSrv.instant('currentLanguage'),
          icon: 'fas fa-flag',
          items: [
            { label: 'Português', command: () => { this.changeLanguage('pt-BR'); this.closeAllMenus(); } },
            { label: 'English', command: () => { this.changeLanguage('en-US'); this.closeAllMenus(); } }
          ]
        }
      ]
      , 0);
  }

  changeLanguage(language: string) {
    this.translateChangeSrv.changeLangDefault(language);
    window.location.reload();
  }

  async loadPropertiesPlan() {
    const currentPlan = !this.currentIDPlan || this.currentIDPlan === 0 ?
      localStorage.getItem('@currentPlan') : this.currentIDPlan;
    this.currentIDPlan = Number(currentPlan);
    if (currentPlan) {
      if (this.authSrv.getAccessToken()) {
        const { data, success } = await this.planSrv.GetById(this.currentIDPlan);
        if (success) {
          this.currentPlan = data;
          if (this.currentPlan) {
            this.currentIDOffice = this.currentPlan.idOffice;
            this.getPropertiesOffice(this.currentIDOffice);
            this.officeSrv.nextIDOffice(this.currentPlan.idOffice);
          }
        }
      }
    }
  }

  async loadOfficeMenu() {
    const { success, data: itemsOffice } = await this.menuSrv.getItemsOffice();
    if (success) {
      this.itemsOfficeUnchanged = itemsOffice && itemsOffice.map(office => ({
        id: office.id,
        label: office.name,
        icon: 'app-icon building',
        styleClass: `office-${office.id} ${this.currentURL === `offices/office?id=${office.id}` ? 'active' : ''}`,
        command: (e) => {
          if (e.originalEvent?.target?.classList?.contains('p-menuitem-text')) {
            if (this.isAdminMenu) {
              this.router.navigate(['/configuration-office'], { queryParams: { idOffice: office.id } });
            } else {
              this.router.navigate(['/offices', 'office'], { queryParams: { id: office.id } });
            }
            this.closeAllMenus();
          }
        },
        items: !this.isAdminMenu && office.plans
          ? office.plans.map(plan =>
          ({
            label: plan.name,
            icon: 'app-icon plan',
            styleClass: `plan-${plan.id} ${this.currentURL === `plan?id=${plan.id}` ? 'active' : ''}`,
            command: (e) => {
              this.router.navigate(['/plan'], { queryParams: { id: plan.id } });
              this.closeAllMenus();
            }
          })
          )
          : undefined
      }));
      this.itemsOffice = this.itemsOfficeUnchanged && this.itemsOfficeUnchanged.map(item => Object.assign({}, item));
    }
  }

  async selectMenuActive(url: string, idNewWorkpack?: number) {
    if (!this.menuOffices || !this.menuPortfolio) {
      return;
    }
    const els = [
      ...Array.from(this.menuOffices ? this.menuOffices.nativeElement.getElementsByClassName('p-panelmenu-header active') : []),
      ...Array.from(this.menuPortfolio ? this.menuPortfolio.nativeElement.getElementsByClassName('p-panelmenu-header active') : []),
      ...Array.from(this.menuOffices ? this.menuOffices?.nativeElement.getElementsByClassName('p-menuitem active') : []),
      ...Array.from(this.menuPortfolio ? this.menuPortfolio.nativeElement.getElementsByClassName('p-menuitem active') : []),
      ...Array.from(this.menuPlanModel ? this.menuPlanModel?.nativeElement.getElementsByClassName('p-menuitem active') : []),
      ...Array.from(this.menuPlanModel ? this.menuPlanModel?.nativeElement.getElementsByClassName('p-menuitem-text active') : []),
      ...Array.from(this.menuPlanModel ? this.menuPlanModel?.nativeElement.getElementsByClassName('p-panelmenu-header active') : [])
    ];
    for (const el of els) {
      el.classList.remove('active');
    }
    const id = idNewWorkpack ? idNewWorkpack : this.getIdFromURL(url);
    if ((url.startsWith('strategies') || url.startsWith('configuration-office')) && (isNaN(id) || !id)) {
      this.itemsPlanModel = this.itemsPlanModel ? [...this.expandedMenuSelectedItem(this.itemsPlanModel, [], 0)] : undefined;
    }
    if (url.startsWith('offices') && (isNaN(id) || !id)) {
      this.itemsOffice = this.itemsOffice ? [...this.collapseMenuItems(this.itemsOffice)] : undefined;
    }
    if (!id || isNaN(id)) {
      return;
    }
    if (url.startsWith('offices/office')) {
      this.menuOffices?.nativeElement.querySelector('.office-' + id)?.classList.add('active');
      this.itemsOffice = this.itemsOffice ? [...this.expandMenuOffice()] : undefined;

    } else if (url.startsWith('strategies/strategy')) {
      this.menuPlanModel?.nativeElement.querySelector('.planModel-' + id)?.classList.add('active');
      this.itemsPlanModel = this.itemsPlanModel ? [...this.expandedMenuSelectedItem(this.itemsPlanModel, [], id)] : undefined;

    } else if (url.startsWith('workpack-model')) {
      this.storageBreadcrumbsItems = this.breadcrumbSrv.get;
      const parents = this.parentsFromBreadcrumb();
      this.itemsPlanModel = this.itemsPlanModel ? [...this.expandedMenuModelSelectedItem(this.itemsPlanModel, parents, id)] : undefined;
      const idParent = this.getIdParentFromURL(url);
      if (idParent) {
        this.menuPlanModel?.nativeElement.querySelector(`.workpackModel-${id}-${parents.join('-')}`)?.classList.add('active');
      } else {
        this.menuPlanModel?.nativeElement.querySelector('.workpackModel-' + id)?.classList.add('active');
      }
       

    }
    else if (url.startsWith('plan')) {
      this.menuOffices?.nativeElement.querySelector('.plan-' + id)?.classList.add('active');
      this.itemsOffice = this.itemsOffice ? [...this.expandMenuOffice()] : undefined;
      const itemsMenu = this.itemsPortfolio ? [...Array.from(this.itemsPortfolio)] : undefined;
      this.itemsPortfolio = itemsMenu ? [...this.collapseMenuItems(itemsMenu)] : undefined;

    } else if (url.startsWith('workpack')) {
      this.itemsOffice = this.itemsOffice ? [...this.expandMenuOffice()] : undefined;
      if (this.currentIDPlan) {
        this.menuOffices?.nativeElement.querySelector('.plan-' + this.currentIDPlan)?.classList.add('active');
      } else {
        this.menuOffices?.nativeElement.querySelector('.office-' + this.currentIDOffice)?.classList.add('active');
      }
      const itemsMenu = this.itemsPortfolio ? [...Array.from(this.itemsPortfolio)] : undefined;
      const result = await this.menuSrv.getParentsItemsPortfolio(id, this.currentIDPlan);
      if (result.success) {
        const parents = result.data.parents;
        this.itemsPortfolio = itemsMenu ? [...this.expandedMenuSelectedItem(itemsMenu, parents, id)] : undefined;
      }
      this.menuPortfolio?.nativeElement.querySelector('.workpack-' + id)?.classList.add('active');
    }
    if (!this.currentIDOffice || this.currentIDOffice === 0) {
      this.itemsOffice = [...this.itemsOffice.map(item => ({ ...item, expanded: false }))];
    }
  }

  parentsFromBreadcrumb() {
    const parents = this.storageBreadcrumbsItems.filter( item => ['workpackModel', 'planModel'].includes(item.key)).map( item => item.queryParams.id);
    return parents;
  }

  expandMenuOffice() {
    const officeIndex = this.itemsOffice.findIndex(item => item.id === this.currentIDOffice);
    if (officeIndex > -1) {
      this.itemsOffice[officeIndex].expanded = true;
      return this.itemsOffice;
    }
    return [];
  }

  collapseMenuItems(list) {
    list.forEach(item => {
      item.expanded = false;
      if (item.items && item.items.length > 0) {
        item.items = this.collapseMenuItems(item.items);
      }
    });
    return list;
  }

  expandedMenuSelectedItem(list: MenuItem[], parents, id) {
    const itemIndex = list.findIndex(item => parents.includes(item.id) || item.id === id);
    if (itemIndex > -1) {
      list[itemIndex].expanded = true;
      if (list[itemIndex].items && list[itemIndex].items.length > 0) {
        list[itemIndex].items = this.expandedMenuSelectedItem(list[itemIndex].items, parents, id);
        return list;
      } else {
        return list;
      }
    } else {
      list.forEach(item => {
        item.expanded = false;
        if (item.items && item.items.length > 0) {
          item.items = this.expandedMenuSelectedItem(item.items, parents, id);
        }
      })
      return list;
    }
  }

  expandedMenuModelSelectedItem(list: MenuItem[], parents, id) {
    let itemIndex = list.findIndex(item => (parents.includes(item.id)));
    if (itemIndex < 0) {
      itemIndex = list.findIndex(item => ((!parents.includes(item.id) && item.id === id)));
    }
    if (itemIndex > -1) {
      list[itemIndex].expanded = true;
      if (list[itemIndex].items && list[itemIndex].items.length > 0) {
        list[itemIndex].items = this.expandedMenuModelSelectedItem(list[itemIndex].items, parents, id);
        return list;
      } else {
        return list;
      }
    } else {
      list.forEach(item => {
        item.expanded = false;
        if (item.items && item.items.length > 0) {
          item.items = this.expandedMenuModelSelectedItem(item.items, parents, id);
        }
      })
      return list;
    }
  }

  getIdFromURL(url: string) {
    const [path, queries] = url.split('?');
    return queries ? Number((queries.split('id=')[1])?.split('&')[0]) : 0;
  }

  getIdParentFromURL(url: string) {
    const [path, queries] = url.split('?');
    return queries ? Number((queries.split('idParent=')[1])?.split('&')[0]) : 0;
  }

  async loadFavoritesMenu() {
    if (this.currentIDPlan) {
      const { success, data } = await this.workpackSrv.getItemsFavorites(this.currentIDPlan);
      if (success) {
        this.itemsFavorites = data.map(item => ({
          label: item.name,
          icon: item.icon,
          styleClass: `workpack-${item.id} ${this.currentURL === `workpack?id=${item.id}` ? 'active' : ''}`,
          routerLink: { path: 'workpack', queryParams: { id: item.id, idPlan: this.currentIDPlan } },
          id: item.id,
          idPlan: this.currentIDPlan,
          canAccess: item.canAccess,
        }));
      }
    }
    return;
  }

  handleNavigateFavorite(item: IMenuFavorites) {
    if (!item.canAccess) {
      this.confirmationSrv.confirm({
        message: this.translateSrv.instant('messages.favoriteCantAccess'),
        header: this.translateSrv.instant('attention'),
        icon: 'pi pi-exclamation-triangle',
        acceptLabel: this.translateSrv.instant('primeng.accept'),
        rejectLabel: this.translateSrv.instant('primeng.reject'),
        accept: () => {
          this.handleRemoveFavorite(item.id);
        }
      });
      return;
    }

    this.router.navigate([item.routerLink?.path], { queryParams: item.routerLink?.queryParams });
    this.closeAllMenus();
  }
  async handleRemoveFavorite(id: number) {

    if (!id || !this.currentIDPlan) {
      return;
    }
    const { success } = await this.workpackSrv.patchToggleWorkpackFavorite(id, this.currentIDPlan);
    if (success) {
      await this.loadFavoritesMenu();
      this.menuSrv.nextRemovedFavorited(id);
      if (!this.itemsFavorites || !this.itemsFavorites.length) {
        this.closeAllMenus();
      }
    }
  }

  async loadPortfolioMenu(idNewWorkpack?: number) {
    if (this.currentIDOffice) {
      const { success, data } = await this.menuSrv.getItemsPortfolio(this.currentIDOffice, this.currentIDPlan);
      if (success) {
        this.itemsPortfolio = this.buildMenuItemPortfolio(data || []);
        if (!this.isFixed && !this.changedUrl) {
          this.selectMenuActive(this.router.url.slice(1), idNewWorkpack)
        }
      }
    }
    return;
  }

  async loadPlanModelMenu() {
    if (this.currentIDOffice) {
      const { success, data } = await this.menuSrv.getItemsPlanModel(this.currentIDOffice);
      if (success) {
        this.itemsPlanModel = this.buildMenuItemPlanModel(data || []);
        this.selectMenuActive(this.router.url.slice(1));
      }
    }
    return;
  }

  toggleMenu(menu: string) {
    const aDifferentMenuIsOpen = this.menus.filter(m => m.label !== menu && m.isOpen).length > 0;
    const menuFound = this.menus.find(m => m.label === menu);
    if (aDifferentMenuIsOpen) {
      this.menus.forEach(m => m.isOpen = false);
      return setTimeout(() => menuFound.isOpen = true, 250);
    }
    return menuFound.isOpen = !menuFound.isOpen;
  }

  buildMenuItemPlanModel(root: IMenuPlanModel[]): MenuItem[] {
    return root.map(planModel => ({
      id: planModel.id as any,
      label: planModel.name,
      icon: 'app-icon plan-model',
      styleClass: `planModel-${planModel.id} ${this.currentURL === `planModel?id=${planModel.id}` ? 'active' : ''}`,
      items: planModel.workpackModels?.length ? this.buildMenuItemWorkpackModel(planModel.workpackModels, this.currentIDOffice, planModel, [planModel.id]) : undefined,
      command: (e) => {
        if (e.originalEvent?.target?.classList?.contains('p-menuitem-text')) {
          this.clearActiveClass();
          e.originalEvent?.target?.classList?.add('active');
          this.router.navigate(['/strategies/strategy'], {
            queryParams:
              { id: planModel.id, idOffice: this.currentIDOffice }
          });
          this.closeAllMenus();
        }
      }
    }));
  }

  clearActiveClass() {
    const els = [
      ...Array.from(this.menuPlanModel ? this.menuPlanModel?.nativeElement.getElementsByClassName('p-menuitem-text active') : []),
      ...Array.from(this.menuPlanModel ? this.menuPlanModel?.nativeElement.getElementsByClassName('p-panelmenu-header active') : [])
    ];
    for (const el of els) {
      el.classList.remove('active');
    }
  }

  buildMenuItemWorkpackModel(root: IMenuWorkpackModel[], idOffice, planModel, parents, parent?) {
    return root.map(workpackModel => ({
      idPlanModel: workpackModel.idPlanModel,
      id: workpackModel.id,
      label: workpackModel.name,
      icon: workpackModel.fontIcon,
      nameInPlural: workpackModel.nameInPlural,
      type: workpackModel.type,
      parents: [...parents, parent],
      styleClass: parent ? `workpackModel-${workpackModel.id}-${[...parents, parent].join('-')}  ${this.currentURL === `workpackModel?id=${workpackModel.id}` ? 'active' : ''}` :
      `workpackModel-${workpackModel.id}  ${this.currentURL === `workpackModel?id=${workpackModel.id}` ? 'active' : ''}`,
      items: workpackModel.children?.length ? this.buildMenuItemWorkpackModel(workpackModel.children, idOffice, planModel, (parent ? [...parents, parent] : [...parents]), workpackModel.id) : undefined,
      command: (e) => {
        if (e.originalEvent?.target?.classList?.contains('p-menuitem-text')) {
          this.clearActiveClass();
          e.originalEvent?.target?.classList?.add('active');
          this.setBreadcrumbStorage(this.currentIDOffice, planModel, workpackModel, (parent ? [...parents, parent] : [...parents]), parent);
          this.router.navigate(['/workpack-model'], {
            queryParams: parent ?
              { id: workpackModel.id, idStrategy: workpackModel.idPlanModel, idOffice: this.currentIDOffice, type: workpackModel.type, idParent: parent } :
              { id: workpackModel.id, idStrategy: workpackModel.idPlanModel, idOffice: this.currentIDOffice, type: workpackModel.type }
          });
          this.closeAllMenus();
        }
      }
    }));
  }

  async setBreadcrumbStorage(idOffice, planModelSelected, workpackModel, parents, parent) {
    this.itemsBreadcrumb = [
      {
        key: 'administration',
        info: this.propertiesOffice?.name,
        tooltip: this.propertiesOffice?.fullName,
        routerLink: ['/configuration-office'],
        queryParams: { idOffice: idOffice }
      },
      {
        key: 'configuration',
        info: this.translateSrv.instant('planModels'),
        tooltip: 'planModels',
        routerLink: ['/strategies'],
        queryParams: { idOffice: idOffice }
      },
      {
        key: 'planModel',
        info: planModelSelected?.name,
        tooltip: planModelSelected?.fullName,
        routerLink: ['/strategies', 'strategy'],
        queryParams: { id: planModelSelected.id, idOffice: idOffice }
      },
    ];
    const currentPlanModel = this.itemsPlanModel.find(planModel => planModel.id === planModelSelected.id);
    const list = currentPlanModel && currentPlanModel.items ? currentPlanModel.items : [];
    this.loadBreadCrumbItems(list, parents, workpackModel.id, idOffice, parent);
    this.breadcrumbSrv.setBreadcrumbStorage(this.itemsBreadcrumb);
  }

  async loadBreadCrumbItems(list, parents, idWorkpackModel, idOffice, parent?) {
    const itemIndex = list.findIndex(item => parents.includes(item.id) && !!item.expanded);
    if (itemIndex > -1) {
      this.itemsBreadcrumb.push(
        {
          key: 'workpackModel',
          info: list[itemIndex].label,
          tooltip: list[itemIndex].nameInPlural,
          routerLink: ['/workpack-model'],
          queryParams: parent ? { idStrategy: list[itemIndex].idPlanModel, id: list[itemIndex].id, type: list[itemIndex].type, idOffice, idParent: parent } :
          { idStrategy: list[itemIndex].idPlanModel, id: list[itemIndex].id, type: list[itemIndex].type, idOffice }
        }
      );
      if (list[itemIndex].items && list[itemIndex].items.length > 0) {
        this.loadBreadCrumbItems(list[itemIndex].items, parents, idWorkpackModel, idOffice, list[itemIndex].id);
      }
    }
  }

  buildMenuItemPortfolio(root: IMenuWorkpack[]) {
    return root.map(workpack => ({
      label: workpack.name,
      icon: workpack.fontIcon,
      idPlan: workpack.idPlan,
      id: workpack.id,
      expanded: false,
      styleClass: `workpack-${workpack.id} ${this.currentURL === `workpack?id=${workpack.id}` ? 'active' : ''}`,
      items: workpack.children?.length ? this.buildMenuItemPortfolio(workpack.children) : undefined,
      command: (e) => {
        if (e.originalEvent?.target?.classList?.contains('p-menuitem-text')) {
          this.router.navigate(['/workpack'], { queryParams: { id: workpack.id, idWorkpaModelLinked: workpack.idWorkpackModelLinked, idPlan: this.currentIDPlan } });
          this.closeAllMenus();
        }
      }
    }));
  }

  buildMenuItemOffices(root: IMenuWorkpackModel[], idOffice: number, idStrategy: number) {
    return root.map(model => ({
      label: model.modelName,
      icon: model.fontIcon,
      styleClass: `workpack-model-${model.id}
        ${this.currentURL.startsWith('workpack-model') && (this.getIdFromURL(this.currentURL) === Number(model.id)) ? 'active' : ''}`,
      items: model.children?.length ? this.buildMenuItemOffices(model.children, idOffice, idStrategy) : undefined,
      command: (e) => {
        if (e.originalEvent?.target?.classList?.contains('p-menuitem-text')) {
          this.router.navigate(['/workpack-model'], { queryParams: { id: model.id, idOffice, idStrategy } });
          this.closeAllMenus();
        }
      }
    }));
  }

  isMenuOpen(menu?: string) {
    return menu
      ? this.menus.find(m => m.label === menu)?.isOpen
      : this.menus.reduce((a, b) => a ? a : b.isOpen, false);
  }

  closeAllMenus() {
    if (!this.isFixed) {
      this.menus.forEach(menu => menu.isOpen = false);
    }
  }
}
