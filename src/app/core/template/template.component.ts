import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { takeUntil } from 'rxjs/operators';
import { MenuService } from 'src/app/shared/services/menu.service';
import { Component, OnDestroy, OnInit } from '@angular/core';

import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Subject } from 'rxjs';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';
import { MobileViewService } from 'src/app/shared/services/mobile-view.service';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss']
})
export class TemplateComponent implements OnDestroy, OnInit {

  isMenuFixed = false;
  $destroy = new Subject();
  fullScreenModeDashboard = false;
  isAdminMenu = false;
  menuWidth = 0.01;
  mainWidth = 99.99;
  menuMobile = false;

  constructor(
    public responsiveSrv: ResponsiveService,
    public mobileViewSrv: MobileViewService,
    public menuSrv: MenuService,
    public dashboardSrv: DashboardService,
    public workpackShowTabViewSrv: WorkpackShowTabviewService,
  ) {
    this.dashboardSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.fullScreenModeDashboard = value);
    this.mobileViewSrv.observable.pipe(takeUntil(this.$destroy)).subscribe( mobileView => {
      this.menuMobile = mobileView;
    });
  }

  ngOnInit(): void {
    this.menuSrv.getMenuState.pipe(takeUntil(this.$destroy)).subscribe(menuState => {
      this.isMenuFixed = menuState.isFixed;
    });
    if (!this.menuMobile) {
        setTimeout(() => {
          this.onResizeEnd(null);
          this.prepareLineSplitter();
        });
      }
    this.menuSrv.obsToggleMenu.pipe(takeUntil(this.$destroy)).subscribe( value => value && value.trim().length > 0 && !this.isMenuFixed && this.openSlideMenu());
    this.menuSrv.obsCloseAllMenus.pipe(takeUntil(this.$destroy)).subscribe( close => close && !this.isMenuFixed && this.closeSlideMenu());
  }

  toggleMenu(isAdmin: boolean) {
    this.isAdminMenu = isAdmin;
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  prepareLineSplitter() {
    const splitter = document.querySelector('.p-splitter-gutter');
    const appTemplateWidth = document.querySelector('.app-template').clientWidth;
    const maxWidth = appTemplateWidth * 0.99;
    const minWidth = appTemplateWidth * 0.01;
    if (splitter) {
      splitter.addEventListener('mousedown', () => {
        document.onmousemove = (event) => {
          splitter.classList.add('splitter-moveevent');
          if (event.clientX > minWidth && event.clientX < maxWidth) {
            splitter.setAttribute('style', `left: ${event.clientX}px`);
          }
        };
        document.onmouseup = () => {
          document.onmousemove = null;
          document.onmouseup = null;
          splitter.classList.remove('splitter-moveevent');
          splitter.setAttribute('style', 'width: 4px;');
        };
      });
    }
  }

  onResizeEnd(event) {
    const splitterPanels = document.querySelectorAll('.p-splitter-panel-nested');
    if (splitterPanels.length > 1) {
      const maxWidth = splitterPanels[1].getAttribute('style').split(';')[0].split(':')[1].trim();
      const perc = maxWidth.split('(')[1];
      const mainWidthPerc = perc && perc.split('%')[0];
      this.mainWidth = Number(mainWidthPerc);
      const menuWidthPerc = (100 - this.mainWidth).toFixed(2);
      this.menuWidth = Number(menuWidthPerc);
      splitterPanels[1].setAttribute('style', `flex-basis: ${maxWidth}; max-width: ${maxWidth};`);
    }
    const mainContent = document.querySelector('.main-content');
    const mainContentWidth = mainContent.clientWidth;
    if (mainContentWidth <= 900) {
      this.workpackShowTabViewSrv.next(false);
    } else {
      this.workpackShowTabViewSrv.next(true);
    }
    if (mainContentWidth <= 1200) {
      this.responsiveSrv.next(true);
    } else {
      this.responsiveSrv.next(false);
    }
    this.responsiveSrv.nextResizeEvent({width: mainContentWidth});
  }

  closeAllMenus() {
    this.closeSlideMenu()
    this.menuSrv.nextCloseMenuUser(true);
  }

  closeSlideMenu() {
    if (this.menuWidth === 0.01) {
      return;
    }
    this.menuWidth = 0.01;
    this.mainWidth = 99.99;
    const splitterPanels = document.querySelectorAll('.p-splitter-panel-nested');
    if (splitterPanels.length > 1) {
      splitterPanels[0].setAttribute('style', `flex-basis: calc(${this.menuWidth}% - 4px);`);
      splitterPanels[1].setAttribute('style', `flex-basis: calc(${this.mainWidth}% - 4px);`);
    }
    this.onResizeEnd(null);
  }

  openSlideMenu() {
    this.menuWidth = 20;
    this.mainWidth = 80;
    const splitterPanels = document.querySelectorAll('.p-splitter-panel-nested');
    if (splitterPanels.length > 1) {
      splitterPanels[0].setAttribute('style', `flex-basis: calc(${this.menuWidth}% - 4px);`);
      splitterPanels[1].setAttribute('style', `flex-basis: calc(${this.mainWidth}% - 4px);`);
    }
    this.onResizeEnd(null);
  }

  handleCloseMenu() {
    if (!this.isMenuFixed) this.closeAllMenus();
  }

}
