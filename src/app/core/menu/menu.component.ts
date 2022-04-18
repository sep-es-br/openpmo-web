import { Location } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { CookieService } from 'ngx-cookie';
import { MenuItem } from 'primeng/api';
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

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit, OnDestroy {

  @ViewChild('menuSliderOffices') menuOffices: ElementRef<HTMLDivElement>;
  @ViewChild('menuSliderPortfolio') menuPortfolio: ElementRef<HTMLDivElement>;

  menus: IMenu[] = [
    { label: 'office', isOpen: false },
    { label: 'portfolio', isOpen: false },
    { label: 'planModel', isOpen: false },
    { label: 'user', isOpen: false },
    { label: 'more', isOpen: false }
  ];
  isAdminMenu = false;
  isMobileView = false;
  isChangingView = false;
  items: MenuItem[] = [];
  itemsOfficeUnchanged: MenuItem[] = [];
  itemsOffice: MenuItem[] = [];
  itemsPlanModel: MenuItem[] = [];
  itemsPorfolio: PlanMenuItem[] = [];
  itemsPorfolioFiltered: PlanMenuItem[] = [];
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

  constructor(
    private menuSrv: MenuService,
    private translateChangeSrv: TranslateChangeService,
    private translateSrv: TranslateService,
    public authSrv: AuthService,
    private responsiveSrv: ResponsiveService,
    private router: Router,
    private locationSrv: Location,
    private officeSrv: OfficeService,
    private officePermissionSrv: OfficePermissionService,
    private planSrv: PlanService,
    private cookieSrv: CookieService
  ) {
    this.translateChangeSrv.getCurrentLang()
      .pipe(takeUntil(this.$destroy))
      .subscribe(() => this.handleChangeLanguage());
    // this.menuSrv.isAdminMenu.pipe(takeUntil(this.$destroy)).subscribe(isAdminMenu => {
    //   if (!this.isFixed) {
    //     this.isAdminMenu = isAdminMenu;
    //     this.updateMenuOfficeOnAdminChange();
    //   }
    // });
    this.officeSrv.observableIdOffice().pipe(takeUntil(this.$destroy)).subscribe(async id => {
      if (!this.isFixed) {
        this.currentIDOffice = id;
        await this.loadPortfolioMenu();
        await this.loadPlanModelMenu();
        this.refreshPortfolioMenu();
      }
    });
    this.planSrv.observableIdPlan().pipe(takeUntil(this.$destroy)).subscribe(async id => {
      if (!this.isFixed) {
        this.currentIDPlan = id;
        if (this.currentIDPlan) {
          localStorage.setItem('@currentPlan', this.currentIDPlan.toString());
        }
        await this.loadPropertiesPlan();
        await this.loadPlanModelMenu();
        if (!this.itemsPorfolio?.length) {
          await this.loadPortfolioMenu();
        }
        this.refreshPortfolioMenu();
      }
    });
    this.menuSrv.obsReloadMenuOffice().pipe(takeUntil(this.$destroy)).subscribe(() => !this.isFixed && this.loadOfficeMenu());
    this.menuSrv.obsReloadMenuPortfolio().pipe(takeUntil(this.$destroy)).subscribe(() => !this.isFixed && this.loadPortfolioMenu());
    this.menuSrv.obsReloadMenuPlanModel().pipe(takeUntil(this.$destroy)).subscribe(() => !this.isFixed && this.loadPlanModelMenu());
    this.menuSrv.isAdminMenu.pipe(takeUntil(this.$destroy)).subscribe(isAdminMenu => {
      if (!this.isFixed) {
        this.isAdminMenu = isAdminMenu;
        this.updateMenuOfficeOnAdminChange();
        if (isAdminMenu) {
          this.getOfficePermission();
        }
      }
    });
    this.menuSrv.isPlanMenu.pipe(takeUntil(this.$destroy)).subscribe(isPlanMenu => {
      if (!this.isFixed) {
        this.isPlanMenu = isPlanMenu;
        this.refreshPortfolioMenu();
      }
    });
    this.responsiveSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(responsive => {
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
        this.currentURL = url.slice(2);
        this.selectMenuActive(url.slice(2));
      }
    });
    this.menuSrv.getMenuState.pipe(takeUntil(this.$destroy)).subscribe( async(menuState) => {
      this.isFixed = menuState.isFixed;
      if (!this.isFixed) {
        this.menus = menuState.menus;
        const authenticated = await this.authSrv.isAuthenticated();
        if (authenticated) {
          this.loadOfficeMenu();
        }
      }
    });
    // this.getMenuModeUser();
  }

  refreshPortfolioMenu() {
    this.itemsPorfolioFiltered = Array.from(this.itemsPorfolio.filter(p => p.idPlan === this.currentIDPlan));
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
  }

 async loadCurrentInfo() {
    this.currentUserInfo = await this.authSrv.getInfoPerson();
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
    const itemsPortfolio = this.menus[1].isOpen ? this.itemsPorfolio : [];
    this.menuSrv.nextMenuState({ isFixed: this.isFixed, menus: this.menus, itemsOffice, itemsPorfolio: itemsPortfolio });
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
            { label: 'Português', command: () => {this.changeLanguage('pt-BR'); this.closeAllMenus(); } },
            { label: 'English', command: () => {this.changeLanguage('en-US'); this.closeAllMenus(); } }
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
    if (this.currentIDPlan) {
      const {data, success} = await this.planSrv.GetById(this.currentIDPlan);
      if(success) {
        this.currentPlan = data;
        if (this.currentPlan) {
          this.officeSrv.nextIDOffice(this.currentPlan.idOffice);
        }
      }
    }
  }

  async loadOfficeMenu() {
    const { success, data: itemsOffice } = await this.menuSrv.getItemsOffice();
    if (success) {
      this.itemsOfficeUnchanged = itemsOffice && itemsOffice.map(office => ({
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

  selectMenuActive(url: string) {
    const els = [
      ...Array.from(this.menuOffices?.nativeElement.getElementsByClassName('p-panelmenu-header active')),
      ...Array.from(this.menuPortfolio?.nativeElement.getElementsByClassName('p-panelmenu-header active')),
      ...Array.from(this.menuOffices?.nativeElement.getElementsByClassName('p-menuitem active')),
      ...Array.from(this.menuPortfolio?.nativeElement.getElementsByClassName('p-menuitem active'))
    ];
    for (const el of els) {
      el.classList.remove('active');
    }
    const id = this.getIdFromURL(url);
    if (url.startsWith('offices/office')) {
      this.menuOffices?.nativeElement.querySelector('.office-' + id)?.classList.add('active');
    } else if (url.startsWith('plan')) {
      this.menuOffices?.nativeElement.querySelector('.plan-' + id)?.classList.add('active');
    } else if (url.startsWith('workpack')) {
      this.menuPortfolio?.nativeElement.querySelector('.workpack-' + id)?.classList.add('active');
    }
  }

  getIdFromURL(url: string) {
    const [path, queries] = url.split('?');
    return queries ? Number((queries.split('id=')[1] || queries.split('idOffice=')[1])?.split('&')[0]) : 0;
  }

  async loadPortfolioMenu() {
    if (this.currentIDOffice) {
      const { success, data } = await this.menuSrv.getItemsPortfolio(this.currentIDOffice);
      if (success) {
        this.itemsPorfolio = this.buildMenuItemPortfolio(data || []);
        this.refreshPortfolioMenu();
      }
    }
    return;
  }

  async loadPlanModelMenu() {
    if (this.currentIDOffice) {
      const { success, data } = await this.menuSrv.getItemsPlanModel(this.currentIDOffice);
      if (success) {
        this.itemsPlanModel = this.buildMenuItemPlanModel(data || []);
        this.refreshPortfolioMenu();
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
      items: planModel.workpackModels?.length ? this.buildMenuItemWorkpackModel(planModel.workpackModels) : undefined,
      command: (e) => {
        if (e.originalEvent?.target?.classList?.contains('p-menuitem-text')) {
          this.router.navigate(['/strategies/strategy'], { queryParams:
            { id: planModel.id, idOffice: this.currentIDOffice } });
          this.closeAllMenus();
        }
      }
    }));
  }

  buildMenuItemWorkpackModel(root: IMenuWorkpackModel[]) {
    return root.map(workpackModel => ({
      idPlanModel: workpackModel.idPlanModel,
      id: workpackModel.id,
      label: workpackModel.name,
      icon: workpackModel.fontIcon,
      styleClass: `workpackModel-${workpackModel.id} ${this.currentURL === `workpackModel?id=${workpackModel.id}` ? 'active' : ''}`,
      items: workpackModel.children?.length ? this.buildMenuItemWorkpackModel(workpackModel.children) : undefined,
      command: (e) => {
        if (e.originalEvent?.target?.classList?.contains('p-menuitem-text')) {
          this.router.navigate(['/workpack-model'], { queryParams:
            { id: workpackModel.id, idStrategy: workpackModel.idPlanModel, idOffice: this.currentIDOffice } });
          this.closeAllMenus();
        }
      }
    }));
  }

  buildMenuItemPortfolio(root: IMenuWorkpack[]) {
    return root.map(workpack => ({
      label: workpack.name,
      icon: workpack.fontIcon,
      idPlan: workpack.idPlan,
      styleClass: `workpack-${workpack.id} ${this.currentURL === `workpack?id=${workpack.id}` ? 'active' : ''}`,
      items: workpack.children?.length ? this.buildMenuItemPortfolio(workpack.children) : undefined,
      command: (e) => {
        if (e.originalEvent?.target?.classList?.contains('p-menuitem-text')) {
          this.router.navigate(['/workpack'], { queryParams: { id: workpack.id, idWorkpaModelLinked: workpack.idWorkpackModelLinked } });
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
