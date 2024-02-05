import {Location} from '@angular/common';
import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {CookieService} from 'ngx-cookie';
import {Subject} from 'rxjs';
import {takeUntil} from 'rxjs/operators';
import {IMenu} from 'src/app/shared/interfaces/IMenu';
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
export class NavMenuComponent implements OnInit {

  @Output() changeMenu = new EventEmitter<boolean>();

  menus: IMenu[] = [
    {label: 'office', isOpen: false},
    {label: 'portfolio', isOpen: false},
    {label: 'planModel', isOpen: false},
    {label: 'favorite', isOpen: false},
    {label: 'more', isOpen: false}
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
    
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async ngOnInit() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.loadCurrentInfo();
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

  toggleMenu(menu: string) {
    this.menus.forEach(m => {
      m.isOpen = m.label === menu ? true : false
    });
    this.showUserMenu = false;
    this.menuSrv.nextToggleMenu(menu);
  }

  isMenuOpen(menu?: string) {
    return menu
      ? this.menus.find(m => m.label === menu)?.isOpen
      : this.menus.reduce((a, b) => a ? a : b.isOpen, false);
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
    this.menuSrv.nextCloseAllMenus(true);
    this.showUserMenu = true;
  }


}
