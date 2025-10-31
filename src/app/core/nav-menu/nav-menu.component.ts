import {Location} from '@angular/common';
import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {CookieService} from 'ngx-cookie';
import {Subject} from 'rxjs';
import {distinctUntilChanged, skipWhile, take, takeUntil} from 'rxjs/operators';
import {IMenu} from 'src/app/shared/interfaces/IMenu';
import {IPerson} from 'src/app/shared/interfaces/IPerson';
import {IPlan} from 'src/app/shared/interfaces/IPlan';
import {AuthService} from 'src/app/shared/services/auth.service';
import {MenuService} from 'src/app/shared/services/menu.service';
import {OfficeService} from 'src/app/shared/services/office.service';
import { PersonService } from 'src/app/shared/services/person.service';
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
    {label: 'ccbmember-baselines-view', isOpen: false},
    {label: 'reports', isOpen: false},
    {label: 'search', isOpen: false}
  ];
  menusAdmin: IMenu[] = [
    {label: 'organizations', isOpen: false},
    {label: 'domains', isOpen: false},
    {label: 'measure-units', isOpen: false},
    {label: 'offices/permission', isOpen: false},
    {label: 'persons', isOpen: false},
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
    private personSrv: PersonService
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

  selectMenuActive(url) {
    if (!url.startsWith('ccbmember-baselines-view')) {
      this.menus.forEach( item => {
        if (item.label === 'ccbmember-baselines-view') {
          item.isOpen = false;
        }
      });
    } else {
      this.menus.forEach( item => {
        if (item.label === 'ccbmember-baselines-view') {
          item.isOpen = true;
        } else {
          item.isOpen = false;
        }
      })
      this.menuSrv.getMenuState.pipe(take(1)).subscribe(
            tempMenuState => {
                this.menuSrv.nextMenuState({
                    isFixed: false
                });
                this.menuSrv.nextCloseAllMenus(true);
                this.menuSrv.nextMenuState({
                    isFixed: tempMenuState.isFixed
                });
            }
        )
      this.showUserMenu = false;
    }
    if (!url.startsWith('reports')) {
      this.menus.forEach( item => {
        if (item.label === 'reports') {
          item.isOpen = false;
        }
      });
    } else {
      this.menus.forEach( item => {
        if (item.label === 'reports') {
          item.isOpen = true;
        } else {
          item.isOpen = false;
        }
      });
      this.menuSrv.getMenuState.pipe(take(1)).subscribe(
            tempMenuState => {
                this.menuSrv.nextMenuState({
                    isFixed: false
                });
                this.menuSrv.nextCloseAllMenus(true);
                this.menuSrv.nextMenuState({
                    isFixed: tempMenuState.isFixed
                });
            }
        )
      this.showUserMenu = false;
    }
    if (!url.startsWith('search')) {
      this.menus.forEach( item => {
        if (item.label === 'search') {
          item.isOpen = false;
        }
      });
    } else {
      this.menus.forEach( item => {
        if (item.label === 'search') {
          item.isOpen = true;
        } else {
          item.isOpen = false;
        }
      });
      this.menuSrv.getMenuState.pipe(take(1)).subscribe(
            tempMenuState => {
                this.menuSrv.nextMenuState({
                    isFixed: false
                });
                this.menuSrv.nextCloseAllMenus(true);
                this.menuSrv.nextMenuState({
                    isFixed: tempMenuState.isFixed
                });
            }
        )
      this.showUserMenu = false;
    }
    this.menusAdmin.forEach( item => {
      if (url.startsWith(item.label)) {
        item.isOpen = true;
        this.menuSrv.getMenuState.pipe(take(1)).subscribe(
            tempMenuState => {
                this.menuSrv.nextMenuState({
                    isFixed: false
                });
                this.menuSrv.nextCloseAllMenus(true);
                this.menuSrv.nextMenuState({
                    isFixed: tempMenuState.isFixed
                });
            }
        )


        this.menus.forEach( item => item.isOpen = false);
        
        this.showUserMenu = false;
      } else {
        item.isOpen = false;
      }
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

  toggleMenu(menu: string, next = true) {
    this.menus.forEach(m => {
      m.isOpen = m.label === menu ? true : false
    });

    this.menusAdmin.forEach( item => item.isOpen = false);
    this.showUserMenu = false;
    if (next) {
      this.menuSrv.nextToggleMenu({menu, open: true});
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
