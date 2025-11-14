import {Location} from '@angular/common';
import {Component, EventEmitter, OnDestroy, OnInit, Output} from '@angular/core';
import {CookieService} from 'ngx-cookie';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {IMenu, IMenuAdmin, MenuAdminButtons, MenuButtons} from 'src/app/shared/interfaces/IMenu';
import {IPerson} from 'src/app/shared/interfaces/IPerson';
import {IPlan} from 'src/app/shared/interfaces/IPlan';
import {AuthService} from 'src/app/shared/services/auth.service';
import {MenuService} from 'src/app/shared/services/menu.service';
import {OfficeService} from 'src/app/shared/services/office.service';
import {PlanService} from 'src/app/shared/services/plan.service';
import {ReportService} from 'src/app/shared/services/report.service';

@Component({
  selector: 'app-nav-menu',
  templateUrl: './nav-menu.component.html',
  styleUrls: ['./nav-menu.component.scss']
})
export class NavMenuComponent implements OnInit, OnDestroy {
  @Output() changeMenu = new EventEmitter<boolean>();

  menus: IMenu[] = [
    { label: MenuButtons.OFFICE, isOpen: false },
    { label: MenuButtons.PORTFOLIO, isOpen: false },
    { label: MenuButtons.PLAN_MODEL, isOpen: false },
    { label: MenuButtons.FAVORITES, isOpen: false },
    { label: MenuButtons.CCB, isOpen: false },
    { label: MenuButtons.REPORTS, isOpen: false },
    { label: MenuButtons.UNIVERSAL_SEARCH, isOpen: false },
  ];

  menusAdmin: IMenuAdmin[] = [
    { label: MenuAdminButtons.ORGANIZATIONS, isOpen: false },
    { label: MenuAdminButtons.DOMAINS, isOpen: false },
    { label: MenuAdminButtons.MEASURE_UNITS, isOpen: false },
    { label: MenuAdminButtons.OFFICES_PERMISSION, isOpen: false },
    { label: MenuAdminButtons.PERSONS, isOpen: false },
  ];

  isUserAdmin = false;

  currentURL = '';

  currentUserInfo: IPerson;

  $destroy = new Subject();

  isPlanMenu = false;

  isAdminMenu = false;

  hasReports = false;

  currentIDPlan: number;

  hasFavoriteItems = false;

  currentPlan: IPlan;

  currentIDOffice: number;

  showUserMenu = false;

  constructor(
    private menuSrv: MenuService,
    public authSrv: AuthService,
    private locationSrv: Location,
    private officeSrv: OfficeService,
    private planSrv: PlanService,
    private cookieSrv: CookieService,
    private reportSrv: ReportService,
  ) {
    this.menuSrv.isAdminMenu.pipe(takeUntil(this.$destroy)).subscribe(isAdminMenu => {
      this.isAdminMenu = isAdminMenu;
    });

    this.menuSrv.obsCloseMenuUser.pipe(takeUntil(this.$destroy)).subscribe( close => {
      this.showUserMenu = false;
    });

    this.officeSrv.observableIdOffice().pipe(takeUntil(this.$destroy)).subscribe(async id => {
      this.currentIDOffice = id;
    });

    this.planSrv.observableIdPlan().pipe(takeUntil(this.$destroy)).subscribe(async id => {
      if (id !== 0) {
        this.currentIDPlan = id;
      }

      await this.loadPropertiesPlan();
      if (this.currentIDPlan && this.currentIDPlan !== 0) this.loadReportsMenu();
    });

    this.locationSrv.onUrlChange(url => {
      this.currentURL = url.slice(2);
    });

    this.menuSrv.isPlanMenu.pipe(takeUntil(this.$destroy)).subscribe(isPlanMenu => {
      this.isPlanMenu = isPlanMenu;
    });

    this.menuSrv.hasFavoriteItems.pipe(takeUntil(this.$destroy)).subscribe( hasFavoriteItems => {
      this.hasFavoriteItems = hasFavoriteItems;
    });

    this.locationSrv.onUrlChange(url => {
      this.selectMenuActive(url.slice(2));
    });

    this.menuSrv.obsToggleMenu.pipe(takeUntil(this.$destroy)).subscribe( ({menu}) => {
      this.toggleMenu(menu, false);
    });
  }

  async ngOnInit() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.loadCurrentInfo();
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  selectMenuActive(url: string) {
    if (!url.startsWith('ccbmember-baselines-view')) {
      const ccbButton = this.menus.find((btn) => btn.label === MenuButtons.CCB);
      if (ccbButton) ccbButton.isOpen = false;
    } else {
      this.menus.forEach(btn => {
        if (btn.label === MenuButtons.CCB) {
          btn.isOpen = true;
        } else {
          btn.isOpen = false;
        }
      });

      this.menuSrv.nextMenuState({
        isFixed: false
      });

      this.menuSrv.nextCloseAllMenus(true);
      this.showUserMenu = false;
    }

    if (!url.startsWith('reports')) {
      const reportButton = this.menus.find((btn) => btn.label === MenuButtons.REPORTS);
      if (reportButton) reportButton.isOpen = false;
    } else {
      this.menus.forEach(btn => {
        if (btn.label === MenuButtons.REPORTS) {
          btn.isOpen = true;
        } else {
          btn.isOpen = false;
        }
      });

      this.menuSrv.nextMenuState({
        isFixed: false
      });

      this.menuSrv.nextCloseAllMenus(true);
      this.showUserMenu = false;
    }

    if (!url.startsWith('search')) {
      const searchButton = this.menus.find((btn) => btn.label === MenuButtons.UNIVERSAL_SEARCH);
      if (searchButton) searchButton.isOpen = false;
    } else {
      this.menus.forEach(btn => {
        if (btn.label === MenuButtons.UNIVERSAL_SEARCH) {
          btn.isOpen = true;
        } else {
          btn.isOpen = false;
        }
      });

      this.menuSrv.nextMenuState({
        isFixed: false
      });

      this.menuSrv.nextCloseAllMenus(true);
      this.showUserMenu = false;
    }

    this.menusAdmin.forEach((adminBtn) => {
      if (url.startsWith(adminBtn.label)) {
        adminBtn.isOpen = true;
        this.menuSrv.nextMenuState({
          isFixed: false
        });

        this.menus.forEach(btn => btn.isOpen = false);
        this.menuSrv.nextCloseAllMenus(true);
        this.showUserMenu = false;
      } else {
        adminBtn.isOpen = false;
      }
    });
  }

  async loadCurrentInfo() {
    this.currentUserInfo = await this.authSrv.getInfoPerson();
  }

  async loadReportsMenu() {
    const result = await this.reportSrv.checkHasActiveReports({'id-plan': this.currentIDPlan});
    if (result.success) {
      this.hasReports = result.data;
    }
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

  toggleMenu(menu: string, next = true) {
    this.menus.forEach(m => {
      m.isOpen = m.label === menu ? true : false;
    });

    this.menusAdmin.forEach( item => item.isOpen = false);
    this.showUserMenu = false;
    if (next) {
      const user = this.authSrv.getTokenPayload();
      const isFixed = this.cookieSrv.get('menuMode' + user?.email) === 'true' ? true : false;
      this.menuSrv.nextToggleMenu({menu, open: true});

      if (!!isFixed) {
        this.menuSrv.nextMenuState({
          isFixed,
        });
      }
    };
  }

  isMenuOpen(menu?: string) {
    return menu
      ? this.menus.find(m => m.label === menu)?.isOpen
      : this.menus.reduce((a, b) => a ? a : b.isOpen, false);
  }

  isMenuAdminOpen(menu?: string) {
    return menu
      ? this.menusAdmin.find(m => m.label === menu)?.isOpen
      : this.menusAdmin.reduce((a, b) => a ? a : b.isOpen, false);
  }

  closeAllMenus() {
    this.menus.forEach(menu => menu.isOpen = false);
  }

  closeUserMenu() {
    this.showUserMenu = false;
  }

  toggleMenuUser() {
    this.menuSrv.nextMenuState({
      isFixed: false
    });
    this.closeAllMenus();
    this.menuSrv.nextCloseAllMenus(true);
    this.showUserMenu = true;
  }


}
