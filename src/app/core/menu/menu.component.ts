import { Location } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';

import { IMenuWorkpack, IMenuWorkpackModel } from 'src/app/shared/interfaces/IMenu';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { AuthService } from 'src/app/shared/services/auth.service';
import { MenuService } from 'src/app/shared/services/menu.service';
import { OfficeService } from 'src/app/shared/services/office.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { TranslateChangeService } from 'src/app/shared/services/translate-change.service';

interface IMenu {
  label: string;
  isOpen: boolean;
}

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
})
export class MenuComponent implements OnInit {

  @ViewChild('menuSliderOffices') menuOffices: ElementRef<HTMLDivElement>;
  @ViewChild('menuSliderPortfolio') menuPortfolio: ElementRef<HTMLDivElement>;

  menus: IMenu[] = [
    { label: 'office', isOpen: false },
    { label: 'portfolio', isOpen: false },
    { label: 'user', isOpen: false },
    { label: 'more', isOpen: false }
  ];
  isAdminMenu = false;
  isMobileView = false;
  isChangingView = false;
  items: MenuItem[] = [];
  itemsOffice: MenuItem[] = [];
  itemsPorfolio: MenuItem[] = [];
  itemsLanguages: MenuItem[] = [];
  username = '';
  currentIDOffice = 0;
  isUserAdmin = false;
  currentURL = '';
  currentUserInfo: IPerson;

  constructor(
    private menuSrv: MenuService,
    private translateChangeSrv: TranslateChangeService,
    private translateSrv: TranslateService,
    public authSrv: AuthService,
    private responsiveSrv: ResponsiveService,
    private router: Router,
    private locationSrv: Location,
    private officeSrv: OfficeService
  ) {
    this.translateChangeSrv.getCurrentLang()
      .subscribe(({ lang }) => this.handleChangeLanguage(lang));
    this.menuSrv.isAdminMenu.subscribe(isAdminMenu => this.isAdminMenu = isAdminMenu);
    this.responsiveSrv.observable.subscribe(responsive => {
      this.isChangingView = true;
      this.isMobileView = responsive;
      setTimeout(() => {
        this.isChangingView = false;
      }, 250);
    });
    this.officeSrv.observableIdOffice().subscribe(id => {
      this.currentIDOffice = id;
      this.loadPortfolioMenu();
    });
    this.locationSrv.onUrlChange(url => {
      this.currentURL = url.slice(2);
      this.selectMenuActive(url.slice(2));
    });
  }

  async ngOnInit() {
    this.isUserAdmin = await this.authSrv.isUserAdmin();
    const payload = this.authSrv.getTokenPayload();
    if (this.isUserAdmin) {
      this.loadOfficeMenu();
    }
    this.currentUserInfo = await this.authSrv.getInfoPerson();
    this.username = this.isUserAdmin
      ? 'Admin'
      : ( this.currentUserInfo.name?.split(' ').shift() || payload.email );
  }

  handleChangeLanguage(language: string) {
    setTimeout(() =>
      this.itemsLanguages = [
        {
          label: this.translateSrv.instant(language === 'pt' ? 'portuguese' : 'english'),
          icon: 'fas fa-flag',
          items: [
            { label: this.translateSrv.instant('portuguese'), command: () => this.changeLanguage('pt')},
            { label: this.translateSrv.instant('english'), command: () => this.changeLanguage('en')}
          ]
        }
      ]
    , 0);
  }

  changeLanguage(language: string) {
    this.translateChangeSrv.changeLangDefault(language);
  }

  async loadOfficeMenu() {
    const { success, data: itemsOffice } = await this.menuSrv.getItemsOffice();
    if (success) {
      this.itemsOffice = itemsOffice.map(office => ({
        label: office.fullName,
        icon: 'app-icon building',
        styleClass: `office-strategies-${office.id} ${this.currentURL === `strategies?idOffice=${office.id}` ? 'active' : ''}`,
        command: (e) => {
          if (e.originalEvent?.target?.classList?.contains('p-menuitem-text')) {
            this.router.navigate([ '/strategies' ], { queryParams: { idOffice: office.id }});
            this.closeAllMenus();
          }
        },
        items: office.planModels
          ? office.planModels.map(planModel =>
            ({
              label: planModel.name,
              icon: 'app-icon chess-knight',
              styleClass: `strategy-${planModel.id} ${this.currentURL === `strategies/strategy?id=${planModel.id}&idOffice=${office.id}`
                ? 'active'
                : ''}`,
              items: planModel.models ? this.buildMenuItemOffices(planModel.models, office.id, Number(planModel.id)) : undefined,
              command: (e) => {
                if (e.originalEvent?.target?.classList?.contains('p-menuitem-text')) {
                  this.router.navigate([ '/strategies', 'strategy' ], { queryParams: { id: planModel.id, idOffice: office.id }});
                  this.closeAllMenus();
                }
              }
            })
          )
          : undefined
      }));
    }
  }

  selectMenuActive(url: string) {
    const els = [
      ... Array.from(this.menuOffices?.nativeElement.getElementsByClassName('p-panelmenu-header active')),
      ... Array.from(this.menuPortfolio?.nativeElement.getElementsByClassName('p-panelmenu-header active')),
      ... Array.from(this.menuOffices?.nativeElement.getElementsByClassName('p-menuitem active')),
      ... Array.from(this.menuPortfolio?.nativeElement.getElementsByClassName('p-menuitem active'))
    ];
    for(const el of els) {
      el.classList.remove('active');
    }
    const id = this.getIdFromURL(url); //url.split('id=')[1];
    if(url.startsWith('offices/office')) {
      this.menuOffices?.nativeElement.getElementsByClassName('office-' + id)[0]?.classList.add('active');
    } else if (url.startsWith('plan')) {
      this.menuOffices?.nativeElement.getElementsByClassName('plan-' + id)[0]?.classList.add('active');
    } else if (url.startsWith('workpack-model')){
      this.menuOffices?.nativeElement.getElementsByClassName('workpack-model-' + id)[0]?.classList.add('active');
    } else if (url.startsWith('workpack')){
      this.menuPortfolio?.nativeElement.getElementsByClassName('workpack-' + id)[0]?.classList.add('active');
    } else if (url.startsWith('strategies/strategy')){
      this.menuOffices?.nativeElement.getElementsByClassName('strategy-' + id)[0]?.classList.add('active');
    } else if (url.startsWith('strategies')){
      this.menuOffices?.nativeElement.getElementsByClassName('office-strategies-' + id)[0]?.classList.add('active');
    }
  }

  getIdFromURL(url: string) {
    const [ path, queries ] = url.split('?');
    return queries ? Number((queries.split('id=')[1] || queries.split('idOffice=')[1])?.split('&')[0]) : 0;
  }

  async loadPortfolioMenu() {
    if (this.currentIDOffice) {
      const { success, data } = await this.menuSrv.getItemsPortfolio(this.currentIDOffice);
      if (success) {
        this.itemsPorfolio = this.buildMenuItemPortfolio(data || []);
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

  buildMenuItemPortfolio(root: IMenuWorkpack[]) {
    return root.map(workpack => ({
      label: workpack.name,
      icon: workpack.fontIcon,
      styleClass: `workpack-${workpack.id} ${this.currentURL === `workpack?id=${workpack.id}` ? 'active' : ''}`,
      items: workpack.children?.length ? this.buildMenuItemPortfolio(workpack.children) : undefined,
      command: (e) => {
        if (e.originalEvent?.target?.classList?.contains('p-menuitem-text')) {
          this.router.navigate(['/workpack' ], { queryParams: { id: workpack.id }});
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
          this.router.navigate(['/workpack-model' ], { queryParams: { id: model.id, idOffice, idStrategy }});
          this.closeAllMenus();
        }
      }
    }));
  }

  isMenuOpen(menu?: string) {
    return menu
      ? this.menus.find(m => m.label === menu)?.isOpen
      : this.menus.reduce((a, b) => a ? a : b.isOpen , false);
  }

  closeAllMenus() {
    this.menus.forEach(menu => menu.isOpen = false);
  }
}
