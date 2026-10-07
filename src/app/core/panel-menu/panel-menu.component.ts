import { Location } from '@angular/common';
import { Component, ElementRef, EventEmitter, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { CookieService } from 'ngx-cookie';
import { ConfirmationService, MenuItem } from 'primeng/api';
import { Subject } from 'rxjs';
import { skipWhile, take, takeUntil } from 'rxjs/operators';

import { IMenu, IMenuPlanModel, IMenuWorkpack, IMenuWorkpackModel, MenuButtons } from 'src/app/shared/interfaces/IMenu';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MenuService } from 'src/app/shared/services/menu.service';
import { OfficePermissionService } from 'src/app/shared/services/office-permission.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { PlanService } from 'src/app/shared/services/plan.service';
import { TranslateChangeService } from 'src/app/shared/services/translate-change.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IMenuFavorites } from '../../shared/interfaces/IMenu';
import { IOffice } from 'src/app/shared/interfaces/IOffice';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ReportService } from 'src/app/shared/services/report.service';
import { WorkpackBreadcrumbStorageService } from 'src/app/shared/services/workpack-breadcrumb-storage.service';
import { PersonService } from 'src/app/shared/services/person.service';
import { WorkpackModelClassificationEnum } from 'src/app/shared/enums/WorkpackModelClassificationEnum';
import { TransversalService } from 'src/app/shared/services/transversal.service';
import { ITransversalProgram, ITransversalProgramModel } from 'src/app/shared/interfaces/ITransversal';

@Component({
  selector: 'app-panel-menu',
  templateUrl: './panel-menu.component.html',
  styleUrls: ['./panel-menu.component.scss']
})
export class PanelMenuComponent implements OnInit {

  @ViewChild('menuSliderOffices') menuOffices: ElementRef<HTMLDivElement>;
  @ViewChild('menuSliderPortfolio') menuPortfolio: ElementRef<HTMLDivElement>;
  @ViewChild('menuSliderPlanModel') menuPlanModel: ElementRef<HTMLDivElement>;

  @ViewChild('menuSliderTransversalViews') menuTransversalViews: ElementRef<HTMLDivElement>;

  @Output() changeMenu = new EventEmitter<boolean>();

    menus: IMenu[] = [
    { label: MenuButtons.OFFICE, isOpen: false },
    { label: MenuButtons.PORTFOLIO, isOpen: false },
    { label: MenuButtons.PLAN_MODEL, isOpen: false },
    { label: MenuButtons.FAVORITES, isOpen: false },
    { label: MenuButtons.USER, isOpen: false },
    { label: MenuButtons.MORE, isOpen: false },
    { label: MenuButtons.TRANSVERSAL_VIEWS, isOpen: false },
  ];


  items: MenuItem[] = [];
  itemsOfficeUnchanged = [];
  itemsOffice = [];
  itemsPlanModel: MenuItem[] = [];
  itemsFavorites: IMenuFavorites[] = [];
  itemsPortfolio = [];
  itemsTransversalViews: MenuItem[] = [];
  loadingTransversalViews = false;
  itemsLanguages: MenuItem[] = [];
  username = '';
  currentIDOffice = 0;
  currentURL = '';
  currentUserInfo: IPerson;
  $destroy = new Subject();
  editPermissionOnOffice = false;
  isPlanMenu = false;
  currentPlan: IPlan;
  currentIDPlan = 0;
  isFixed = false;
  menuStateChanged = false;
  isOfficeConfigMenu = false;
  parentsWorkpack = [];
  changedUrl = false;
  propertiesOffice: IOffice;
  itemsBreadcrumb = [];
  storageBreadcrumbsItems = [];
  hasReports = false;
  linkEvent = false;
  idOfficeItemsPlanModel: number;
  loadingMenuPortfolio = false;
  user;

  constructor(
    private menuSrv: MenuService,
    private translateChangeSrv: TranslateChangeService,
    private translateSrv: TranslateService,
    public authSrv: AuthService,
    private router: Router,
    private locationSrv: Location,
    private officeSrv: OfficeService,
    private officePermissionSrv: OfficePermissionService,
    private planSrv: PlanService,
    private workpackSrv: WorkpackService,
    private cookieSrv: CookieService,
    private confirmationSrv: ConfirmationService,
    private breadcrumbSrv: BreadcrumbService,
    private workpackBreadcrumbStorageSrv: WorkpackBreadcrumbStorageService,
    private personSrv: PersonService,
    private transversalSrv: TransversalService
  ) {
    this.menuSrv.getMenuState.pipe(takeUntil(this.$destroy)).subscribe(async (menuState) => {
      this.isFixed = menuState.isFixed;
    });
    this.translateChangeSrv.getCurrentLang()
      .pipe(takeUntil(this.$destroy))
      .subscribe(() => this.handleChangeLanguage());

    this.officeSrv.observableIdOffice().pipe(takeUntil(this.$destroy)).subscribe(async id => {
      this.currentIDOffice = id;
      const idOffice = localStorage.getItem('@currentOffice') && Number(localStorage.getItem('@currentOffice'));
      if ((!idOffice || idOffice !== id || !this.itemsPlanModel || this.itemsPlanModel.length === 0) && id !== 0) {
        this.getPropertiesOffice(this.currentIDOffice);
        this.loadPlanModelMenu();
      }
    });
    this.planSrv.observableIdPlan().pipe(takeUntil(this.$destroy)).subscribe(async id => {
      if (id === 0) {
        await this.loadPropertiesPlan();
      }
      if (this.currentIDPlan !== 0 || id !== 0) {
        this.currentIDPlan = id;
        await this.loadPropertiesPlan();
        this.loadPortfolioMenu();
        this.loadFavoritesMenu();
      }
    });
    this.planSrv.observableNewPlan().pipe(takeUntil(this.$destroy)).subscribe(value => {
      if (!!value) {
        this.currentPlan = undefined;
        this.currentIDPlan = undefined;
        this.itemsPortfolio = [];
        this.itemsTransversalViews = [];
        this.itemsFavorites = [];
      }
    });
    this.menuSrv.obsReloadMenuOffice().pipe(takeUntil(this.$destroy)).subscribe(async () => {
      await this.loadOfficeMenu();
    });
    this.menuSrv.obsReloadMenuFavorite().pipe(takeUntil(this.$destroy)).subscribe(() => {
      this.loadFavoritesMenu();
    });
    this.menuSrv.obsReloadMenuPortfolio().pipe(takeUntil(this.$destroy)).subscribe(() => {
      const idNewWorkpack = this.menuSrv.getIdNewWorkpack();
      this.changedUrl = false;
      this.loadPortfolioMenu(idNewWorkpack);

    });
    this.menuSrv.obsReloadMenuPlanModel().pipe(takeUntil(this.$destroy)).subscribe(() => this.loadPlanModelMenu());
    this.menuSrv.isOfficeConfigMenu.pipe(takeUntil(this.$destroy)).subscribe(isOfficeConfigMenu => {
      this.isOfficeConfigMenu = isOfficeConfigMenu;
      this.updateMenuOfficeOnAdminChange();
      if (!isOfficeConfigMenu) {
        const planModelMenuIsOpen = this.menus.find(
            (item) =>
              item.label === MenuButtons.PLAN_MODEL && item.isOpen === true
          );
        if (planModelMenuIsOpen) {
          this.toggleMenu('office');
        }
      }
      if (isOfficeConfigMenu) {      
        this.getOfficePermission();
      }
    });
    this.menuSrv.isPlanMenu.pipe(takeUntil(this.$destroy)).subscribe(isPlanMenu => {
      this.isPlanMenu = isPlanMenu;
    });
    this.locationSrv.onUrlChange(url => {
      this.changedUrl = true;
      this.currentURL = url.slice(2);
      this.linkEvent = this.currentURL.includes('linkEvent');
      if (!this.linkEvent) this.selectMenuActive(url.slice(2));
    });
    this.menuSrv.obsCloseAllMenus.pipe(takeUntil(this.$destroy)).subscribe( closeAllMenus => {
      if (closeAllMenus && !this.isFixed) this.setCloseAllMenus();
    });
    this.menuSrv.obsToggleMenu.pipe(takeUntil(this.$destroy)).subscribe(({menu}) => {
      this.toggleMenu(menu);
    });
    this.personSrv.$preferences.pipe(takeUntil(this.$destroy)).subscribe(
        preferences => {
            this.menuSrv.nextMenuState({isFixed: preferences?.fixedMenu ?? false});
        }
    );

  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    const token = this.authSrv.getAccessToken();
    if (token) {
      await this.loadOfficeMenu();
    };
  }

  async getPropertiesOffice(idOffice) {
    if (idOffice) {
      this.propertiesOffice = await this.officeSrv.getCurrentOffice(idOffice);
    }
  }

  handleChangeMenuMode() {
    this.isFixed = !this.isFixed;
    this.menuSrv.nextMenuState({
      isFixed: this.isFixed
    });
    this.personSrv.nextAndSavePreferences({fixedMenu: this.isFixed });
    
  }


  updateMenuOfficeOnAdminChange() {
    this.itemsOffice = this.itemsOffice && this.itemsOffice
      .map((office, i) => ((office.items = this.isOfficeConfigMenu ? undefined : this.itemsOfficeUnchanged[i].items), office));
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
            {
              label: 'Português', command: () => {
                this.changeLanguage('pt-BR');
                this.closeAllMenus();
              }
            },
            {
              label: 'English', command: () => {
                this.changeLanguage('en-US');
                this.closeAllMenus();
              }
            }
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
    this.currentIDPlan = Number(currentPlan) !== 0 ? Number(currentPlan) : undefined;
    if (this.currentIDPlan) {
      if (this.authSrv.getAccessToken()) {
        this.currentPlan = await this.planSrv.getCurrentPlan(this.currentIDPlan);
        if (this.currentPlan) {
          if (this.currentIDOffice !== this.currentPlan.idOffice) {
            this.currentIDOffice = this.currentPlan.idOffice;
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
        title: office.fullName,
        icon: 'app-icon building',
        styleClass: `office-${office.id} ${this.currentURL === `offices/office?id=${office.id}` ? 'active' : ''}`,
        command: (e) => {
          const classList = Array.from(e.originalEvent?.target?.classList) || [];
          if (classList.some((className: string) => ['p-menuitem-text', 'fas', 'app-icon'].includes(className))) {
            e.item.expanded = false;
            if (this.isOfficeConfigMenu) {
              this.router.navigate(['/configuration-office'], { queryParams: { idOffice: office.id } });
            } else {
              this.router.navigate(['/offices', 'office'], { queryParams: { id: office.id } });
            }
            this.closeAllMenus();
          }
        },
        items: !this.isOfficeConfigMenu && office.plans
          ? office.plans.map(plan =>
          ({
            label: plan.name,
            icon: 'app-icon plan',
            title: plan.fullName,
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
    const preferences = await this.personSrv.$preferences.pipe(take(1)).toPromise();

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
      this.itemsPlanModel = this.itemsPlanModel ? [...this.expandedMenuModelSelectedItem(this.itemsPlanModel, [], 0)] : undefined;
    }
    if (url.startsWith('offices') && (isNaN(id) || !id)) {
      this.itemsOffice = this.itemsOffice ? [...this.collapseMenuItems(this.itemsOffice)] : undefined;
      this.menuSrv.nextToggleMenu({menu: 'office', open: (preferences?.fixedMenu ?? false)});
    }
    if (!id || isNaN(id)) {
      return;
    }
    if (url.startsWith('offices/office')) {
      this.menuOffices?.nativeElement.querySelector('.office-' + id)?.classList.add('active');
      this.itemsOffice = this.itemsOffice ? [...this.expandMenuOffice()] : undefined;
      this.menuSrv.nextToggleMenu({menu: MenuButtons.OFFICE, open: (preferences?.fixedMenu ?? false)});

    } else if (url.startsWith('strategies/strategy')) {
      this.menuPlanModel?.nativeElement.querySelector('.planModel-' + id)?.classList.add('active');
      this.itemsPlanModel = this.itemsPlanModel ? [...this.expandedMenuModelSelectedItem(this.itemsPlanModel, [], id)] : undefined;
      this.menuSrv.nextToggleMenu({menu: MenuButtons.PLAN_MODEL, open: (preferences?.fixedMenu ?? false)});
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
      this.menuSrv.nextToggleMenu({menu: MenuButtons.PLAN_MODEL, open: (preferences?.fixedMenu ?? false)});
    } else if (url.startsWith('plan')) {
      this.menuOffices?.nativeElement.querySelector('.plan-' + id)?.classList.add('active');
      this.itemsOffice = this.itemsOffice ? [...this.expandMenuOffice()] : this.itemsOffice;
      const itemsMenu = this.itemsPortfolio ? [...Array.from(this.itemsPortfolio)] : undefined;
      this.itemsPortfolio = itemsMenu ? [...this.collapseMenuItems(itemsMenu)] : undefined;
      this.menuSrv.nextToggleMenu({menu: MenuButtons.PORTFOLIO, open: (preferences?.fixedMenu ?? false)});
    } else if (url.startsWith('workpack') || url.startsWith('stakeholder')) {
      this.itemsOffice = this.itemsOffice ? [...this.expandMenuOffice()] : this.itemsOffice;
      if (this.currentIDPlan) {
        this.menuOffices?.nativeElement.querySelector('.plan-' + this.currentIDPlan)?.classList.add('active');
      } else {
        this.menuOffices?.nativeElement.querySelector('.office-' + this.currentIDOffice)?.classList.add('active');
      }
      const idPlan = this.currentIDPlan && this.currentIDPlan !== 0 ? this.currentIDPlan : this.getIdPlanFromURL(url);
      if (this.isTransversalMenuWorkpack(id)) {
        this.expandTransversalMenuRoot(id);
        this.menuTransversalViews?.nativeElement.querySelector('.transversal-program-' + id)?.classList.add('active');
        this.menuSrv.nextToggleMenu({ menu: MenuButtons.TRANSVERSAL_VIEWS, open: (preferences?.fixedMenu ?? false) });
      } else {
        const itemsMenu = this.itemsPortfolio ? [...Array.from(this.itemsPortfolio)] : undefined;
        const result = itemsMenu && itemsMenu.length > 0 && await this.menuSrv.getParentsItemsPortfolio(id, idPlan);
        if (result.success) {
          const parents = result.data.parents;
          this.itemsPortfolio = itemsMenu ? [...this.expandedMenuSelectedItem(itemsMenu, parents, id)] : undefined;
        }
        this.menuPortfolio?.nativeElement.querySelector('.workpack-' + id)?.classList.add('active');
        this.menuSrv.nextToggleMenu({menu: MenuButtons.PORTFOLIO, open: (preferences?.fixedMenu ?? false)});
      }
    }
    if (!this.currentIDOffice || this.currentIDOffice === 0) {
      this.itemsOffice = [...this.itemsOffice.map(item => ({ ...item, expanded: false }))];
    }
  }

  parentsFromBreadcrumb() {
    const parents = this.storageBreadcrumbsItems
      .filter(item => ['workpackModel', 'planModel'].includes(item.key))
      .map(item => item.queryParams.id);
    return parents;
  }

  expandMenuOffice() {
    const officeIndex = this.itemsOffice.findIndex(item => item.id === this.currentIDOffice);
    if (officeIndex > -1) {
      this.itemsOffice[officeIndex].expanded = true;
    }
    return this.itemsOffice;
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

  expandedMenuSelectedItem(list, parents, id) {
    const itemIndex = list.findIndex(item => parents.includes(item.id) || item.id === id);
    if (itemIndex > -1) {
      list[itemIndex].expanded = true;
      list[itemIndex].items = list[itemIndex].children;
      list.forEach( l => l.items = l.children);
      if (list[itemIndex].items && list[itemIndex].items.length > 0) {
        list[itemIndex].items = this.expandedMenuSelectedItem(list[itemIndex].items, parents, id);
        return list;
      } else {
        return list;
      }
    } else {
      list.forEach(item => {
        item.expanded = false;
        if (item.idParent === id) {
          item.items = item.children;
        }
        
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
    const id = queries ? Number((queries.split('id=')[1])?.split('&')[0]) : 0;
    if ((url.startsWith('workpack') || url.startsWith('stakeholder')) && (!id || isNaN(id))) {
      return queries ? Number((queries.split('idWorkpack=')[1])?.split('&')[0]) : 0;
    }
    return id;
  }

  getIdParentFromURL(url: string) {
    const [path, queries] = url.split('?');
    return queries ? Number((queries.split('idParent=')[1])?.split('&')[0]) : 0;
  }

  getIdPlanFromURL(url: string) {
    const [path, queries] = url.split('?');
    return queries ? Number((queries.split('idPlan=')[1])?.split('&')[0]) : 0;
  }

  async loadFavoritesMenu() {
    if (this.currentIDPlan) {
      const { success, data } = await this.workpackSrv.getItemsFavorites(this.currentIDPlan);
      if (success) {
        this.itemsFavorites = data.map(item => ({
          label: item.name,
          icon: item.icon,
          title: item.fullName,
          styleClass: `workpack-${item.id} ${this.currentURL === `workpack?id=${item.id}` ? 'active' : ''}`,
          routerLink: { path: 'workpack', queryParams: { id: item.id, idPlan: this.currentIDPlan } },
          id: item.id,
          idPlan: this.currentIDPlan,
          canAccess: item.canAccess,
        }));
        if (this.itemsFavorites && this.itemsFavorites.length > 0) {
          this.menuSrv.nextHasFavoriteItems(true);
        } else {
          this.menuSrv.nextHasFavoriteItems(false);
        }
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
    this.setWorkpackBreadcrumbStorage(item.id, this.currentIDPlan);
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
    let menuPortfolioData: IMenuWorkpack[] | null = null;
    if (this.currentIDOffice && this.currentIDPlan) {
      this.loadingMenuPortfolio = true;
      const { success, data } = await this.menuSrv.getItemsPortfolio(this.currentIDOffice, this.currentIDPlan);
      if (success) {
        menuPortfolioData = data || [];
        this.menuSrv.nextMenuPortfolioItems(menuPortfolioData);
      }
    }
    await this.loadTransversalViewsMenu();
    await this.loadPlanModelMenu();
    if (menuPortfolioData) {
      this.itemsPortfolio = this.buildMenuItemPortfolio(
        this.filterTransversalWorkpacksFromPortfolio(menuPortfolioData), 0
      );
    }
    this.loadingMenuPortfolio = false;
    if (this.currentIDPlan && (!this.changedUrl || this.linkEvent)) {
      this.selectMenuActive(this.router.url.slice(1), idNewWorkpack);
    } else if (this.currentIDPlan) {
      this.selectMenuActive(this.router.url.slice(1));
    }
    return;
  }

  private async loadTransversalViewsMenu(): Promise<void> {
    this.loadingTransversalViews = true;
    try {
      this.itemsTransversalViews = await this.buildMenuItemTransversalViews();
    } finally {
      this.loadingTransversalViews = false;
    }
  }

  private isTransversalMenuWorkpack(id: number): boolean {
    const pending = [...this.itemsTransversalViews];
    while (pending.length) {
      const item = pending.pop();
      if (Number((item as any).workpackId) === Number(id)) {
        return true;
      }
      pending.push(...(item.items || []));
    }
    return false;
  }

  private filterTransversalWorkpacksFromPortfolio(items: IMenuWorkpack[]): IMenuWorkpack[] {
    const transversalWorkpackIds = new Set<number>();
    const transversalModelIds = new Set<number>();
    const pending = [...this.itemsTransversalViews];
    while (pending.length) {
      const item = pending.pop() as any;
      if (item.workpackId != null) {
        transversalWorkpackIds.add(Number(item.workpackId));
      }
      if (item.workpackModelId != null) {
        transversalModelIds.add(Number(item.workpackModelId));
      }
      pending.push(...(item.items || []));
    }
    const models = [...this.itemsPlanModel];
    while (models.length) {
      const item = models.pop() as any;
      if (item.classification === WorkpackModelClassificationEnum.TRANSVERSAL) {
        transversalModelIds.add(Number(item.id));
      }
      models.push(...(item.items || []));
    }
    const filterItems = (branch: IMenuWorkpack[]): IMenuWorkpack[] => branch.reduce((filtered, item) => {
      if (!transversalWorkpackIds.has(Number(item.id)) &&
        !transversalModelIds.has(Number(item.idWorkpackModel))) {
        filtered.push({
          ...item,
          children: filterItems(item.children || [])
        });
      }
      return filtered;
    }, [] as IMenuWorkpack[]);
    return filterItems(items);
  }

  private expandTransversalMenuRoot(id: number): void {
    const root = this.itemsTransversalViews.find(view =>
      (view.items || []).some(item => Number((item as any).workpackId) === Number(id))
    );
    if (root) {
      root.expanded = true;
    }
  }

  async loadPlanModelMenu() {
    if (this.currentIDOffice && (!this.idOfficeItemsPlanModel || this.idOfficeItemsPlanModel !== this.currentIDOffice)) {
      const { success, data } = await this.menuSrv.getItemsPlanModel(this.currentIDOffice);
      if (success) {
        this.itemsPlanModel = this.buildMenuItemPlanModel(data || []);
        this.idOfficeItemsPlanModel = this.currentIDOffice;
        this.selectMenuActive(this.router.url.slice(1));
      }
    }
    return;
  }

  toggleMenu(menu: string) {
    this.menus.forEach(m => {
      m.isOpen = m.label === menu ? true : false
    });
  }

  buildMenuItemPlanModel(root: IMenuPlanModel[]): MenuItem[] {
    return root.map(planModel => ({
      id: planModel.id as any,
      label: planModel.name,
      title: planModel.fullName,
      icon: 'app-icon plan-model',
      styleClass: `${planModel.id}-${planModel.fullName} planModel-${planModel.id} ${this.currentURL === `planModel?id=${planModel.id}` ? 'active' : ''}`,
      items: planModel.workpackModels?.length ? this.buildMenuItemWorkpackModelGroups(planModel.workpackModels, this.currentIDOffice, planModel, [planModel.id]) : undefined,
      command: (e) => {
        const classList = Array.from(e.originalEvent?.target?.classList) || [];
        if (classList.some((className: string) => ['p-menuitem-text', 'fas', 'app-icon'].includes(className))) {
          e.item.expanded = false;
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

  buildMenuItemWorkpackModelGroups(root: IMenuWorkpackModel[], idOffice, planModel, parents): MenuItem[] {
    const structuralModels = root.filter(workpackModel =>
      workpackModel.classification !== WorkpackModelClassificationEnum.TRANSVERSAL
    );
    const transversalViews = root.filter(workpackModel =>
      workpackModel.classification === WorkpackModelClassificationEnum.TRANSVERSAL
    );

    return [
      structuralModels.length ? {
        id: 'structural-models-' + planModel.id,
        label: this.translateSrv.instant('structuralModels').toUpperCase(),
        icon: 'fas fa-sitemap',
        styleClass: 'workpack-model-group structural-models',
        items: this.buildMenuItemWorkpackModel(structuralModels, idOffice, planModel, parents)
      } : undefined,
      transversalViews.length ? {
        id: 'transversal-views-' + planModel.id,
        label: this.translateSrv.instant('transversalViews').toUpperCase(),
        icon: 'fas fa-project-diagram',
        styleClass: 'workpack-model-group transversal-views',
        items: this.buildMenuItemWorkpackModel(transversalViews, idOffice, planModel, parents)
      } : undefined
    ].filter(Boolean) as MenuItem[];
  }

  buildMenuItemWorkpackModel(root: IMenuWorkpackModel[], idOffice, planModel, parents, parent?) {
    return root.map(workpackModel => ({
      idPlanModel: workpackModel.idPlanModel,
      id: workpackModel.id,
      label: workpackModel.name,
      icon: workpackModel.fontIcon,
      title: workpackModel.fullName,
      nameInPlural: workpackModel.nameInPlural,
      type: workpackModel.type,
      classification: workpackModel.classification,
      parents: [...parents, parent],
      styleClass: parent ? `workpackModel-${workpackModel.id}-${[...parents, parent].join('-')}  ${this.currentURL === `workpackModel?id=${workpackModel.id}` ? 'active' : ''}` :
        `workpackModel-${workpackModel.id}  ${this.currentURL === `workpackModel?id=${workpackModel.id}` ? 'active' : ''}`,
      items: workpackModel.children?.length ? this.buildMenuItemWorkpackModel(workpackModel.children, idOffice, planModel, (parent ? [...parents, parent] : [...parents]), workpackModel.id) : undefined,
      command: (e) => {
        const classList = Array.from(e.originalEvent?.target?.classList) || [];
        if (classList.some((className: string) => ['p-menuitem-text', 'fas', 'app-icon'].includes(className))) {
          e.item.expanded = false;
          this.clearActiveClass();
          e.originalEvent?.target?.classList?.add('active');
          this.setBreadcrumbStorage(this.currentIDOffice, planModel, workpackModel, (parent ? [...parents, parent] : [...parents]), parent);
          this.router.navigate(['/workpack-model'], {
            queryParams: parent ?
              {
                id: workpackModel.id,
                idStrategy: workpackModel.idPlanModel,
                idOffice: this.currentIDOffice,
                type: workpackModel.type,
                classification: workpackModel.classification,
                idParent: parent
              } :
              {
                id: workpackModel.id,
                idStrategy: workpackModel.idPlanModel,
                idOffice: this.currentIDOffice,
                type: workpackModel.type,
                classification: workpackModel.classification
              }
          });
          this.closeAllMenus();
        }
      }
    }));
  }

  async setBreadcrumbStorage(idOffice, planModelSelected, workpackModel, parents, parent) {
    this.itemsBreadcrumb = [
      {
        key: 'officeConfiguration',
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
          queryParams: parent ? {
            idStrategy: list[itemIndex].idPlanModel,
            id: list[itemIndex].id,
            type: list[itemIndex].type,
            idOffice,
            idParent: parent
          } :
            { idStrategy: list[itemIndex].idPlanModel, id: list[itemIndex].id, type: list[itemIndex].type, idOffice }
        }
      );
      if (list[itemIndex].items && list[itemIndex].items.length > 0) {
        this.loadBreadCrumbItems(list[itemIndex].items, parents, idWorkpackModel, idOffice, list[itemIndex].id);
      }
    }
  }

  buildMenuItemPortfolio(root: IMenuWorkpack[], level: number) {
    level++;
    return root.map(workpack => {
      const children =  workpack.children?.length ? this.buildMenuItemPortfolio(workpack.children, level) : undefined;
      return {
        label: workpack.name,
        icon: workpack.fontIcon,
        idPlan: workpack.idPlan,
        fullName: workpack.fullName,
        title: workpack.fullName,
        tooltip: workpack.fullName,
        id: workpack.id,
        idParent: workpack.idParent,
        expanded: false,
        styleClass: `workpack-${workpack.id} ${this.currentURL === `workpack?id=${workpack.id}` ? 'active' : ''}`,
        children,
        items: level < 3 ? children : undefined,
        command: (e) => {
          const classList = Array.from(e.originalEvent?.target?.classList) || [];
          if (classList.some((className: string) => ['p-menuitem-text', 'fas', 'app-icon'].includes(className))) {
            e.item.expanded = false;
            this.setWorkpackBreadcrumbStorage(workpack.id, this.currentIDPlan);
            this.router.navigate(['/workpack'], {
              queryParams: {
                id: workpack.id,
                idWorkpaModelLinked: workpack.idWorkpackModelLinked,
                idPlan: this.currentIDPlan
              }
            });
            this.closeAllMenus();
          }
          e.item.items = e.item.children;
          if (e.item.children && e.item.children.length > 0) {
            e.item.children.forEach(child => {
              child.items = child.children;
            });
          }
        }
      }
    });
  }

  private async buildMenuItemTransversalViews(): Promise<MenuItem[]> {
    const idPlanModel = this.currentPlan?.planModel?.id || this.currentPlan?.idPlanModel;
    if (!idPlanModel || !this.currentIDPlan || !this.currentIDOffice) {
      return [];
    }

    const result = await this.menuSrv.getItemsPlanModel(this.currentIDOffice);
    if (!result.success) {
      return [];
    }

    const planModel = (result.data || []).find(model => model.id === idPlanModel);
    const transversalViews = (planModel?.workpackModels || []).filter(model =>
      model.classification === WorkpackModelClassificationEnum.TRANSVERSAL
    );

    return Promise.all(transversalViews.map(async view => {
      const [programsResult, modelsResult] = await Promise.all([
        this.transversalSrv.getPrograms(Number(view.id), this.currentIDPlan),
        this.transversalSrv.getProgramModels(Number(view.id))
      ]);
      const programs = programsResult.success ? programsResult.data || [] : [];
      const programModels = modelsResult.success ? modelsResult.data || [] : [];

      return {
        id: `transversal-view-${view.id}`,
        label: view.name || view.modelName,
        icon: view.fontIcon,
        title: view.fullName,
        tooltip: view.fullName,
        styleClass: `transversal-view-${view.id}`,
        items: [
          ...this.buildTransversalProgramItems(Number(view.id), programs, programModels),
          ...programModels.filter(model => model.id === Number(view.id) ||
            (view.type !== 'ProgramModel' && model.idParentModel === Number(view.id)))
            .map(model => this.newTransversalProgramItem(Number(view.id), model))
        ]
      };
    }));
  }

  private buildTransversalProgramItems(
    idView: number,
    programs: ITransversalProgram[],
    models: ITransversalProgramModel[],
    idParent?: number,
    visited = new Set<number>()
  ): MenuItem[] {
    const programIds = new Set(programs.map(program => program.idTransversalProgram));
    return programs.filter(program => idParent
      ? program.idParent === idParent
      : !program.idParent || !programIds.has(program.idParent)
    ).filter(program => !visited.has(program.idTransversalProgram)).map(program => {
      const branch = new Set(visited);
      branch.add(program.idTransversalProgram);
      return {
        id: String(program.idTransversalProgram),
        workpackId: program.idTransversalProgram,
        workpackModelId: program.idWorkpackModel,
        label: program.name,
        icon: program.fontIcon,
        title: program.fullName,
        tooltip: program.fullName,
        styleClass: `transversal-program-${program.idTransversalProgram}`,
        items: [
          ...this.buildTransversalProgramItems(idView, programs, models, program.idTransversalProgram, branch),
          ...models.filter(model => model.idParentModel === program.idWorkpackModel)
            .map(model => this.newTransversalProgramItem(idView, model, program.idTransversalProgram))
        ],
        command: (event) => {
          if (event.originalEvent?.target?.classList?.contains('p-panelmenu-icon')) {
            return;
          }
          this.router.navigate(['/workpack'], {
            queryParams: { id: program.idTransversalProgram, idPlan: this.currentIDPlan }
          });
          this.closeAllMenus();
        }
      } as MenuItem;
    });
  }

  private newTransversalProgramItem(
    idView: number,
    model: ITransversalProgramModel,
    idParent?: number
  ): MenuItem {
    return {
      id: `new-transversal-program-${idView}-${model.id}-${idParent || 'root'}`,
      ...({ workpackModelId: model.id } as any),
      label: `${this.translateSrv.instant('new')} ${model.name}`,
      icon: 'pi pi-plus',
      command: () => {
        this.router.navigate(['/workpack'], {
          queryParams: {
            idPlan: this.currentIDPlan,
            idWorkpackModel: model.id,
            idWorkpackParent: idParent,
            idTransversalView: idView
          }
        });
        this.closeAllMenus();
      }
    };
  }

  async setWorkpackBreadcrumbStorage(idWorkpack, idPlan) {
    const breadcrumbItems = await this.workpackBreadcrumbStorageSrv.getBreadcrumbs(idWorkpack, idPlan);
    this.breadcrumbSrv.setBreadcrumbStorage(breadcrumbItems);
  }

  buildMenuItemOffices(root: IMenuWorkpackModel[], idOffice: number, idStrategy: number) {
    return root.map(model => ({
      label: model.modelName,
      icon: model.fontIcon,
      title: model.fullName,
      styleClass: `workpack-model-${model.id}
        ${this.currentURL.startsWith('workpack-model') && (this.getIdFromURL(this.currentURL) === Number(model.id)) ? 'active' : ''}`,
      items: model.children?.length ? this.buildMenuItemOffices(model.children, idOffice, idStrategy) : undefined,
      command: (e) => {
        const classList = Array.from(e.originalEvent?.target?.classList) || [];
        if (classList.some((className: string) => ['p-menuitem-text', 'fas', 'app-icon'].includes(className))) {
          e.item.expanded = false;
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

  setCloseAllMenus() {
    this.menus.forEach(menu => menu.isOpen = false);
    
  }

  closeAllMenus() {
    this.menuSrv.nextCloseAllMenus(true);
  }

}

