import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { takeUntil } from 'rxjs/operators';
import { MenuService } from 'src/app/shared/services/menu.service';
import { Component, OnDestroy } from '@angular/core';

import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Subject } from 'rxjs';
import { WorkpackShowTabviewService } from 'src/app/shared/services/workpack-show-tabview.service';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss']
})
export class TemplateComponent implements OnDestroy {

  isMenuFixed = false;
  $destroy = new Subject();
  fullScreenModeDashboard = false;
  isAdminMenu = false;


  constructor(
    public responsiveSrv: ResponsiveService,
    public menuSrv: MenuService,
    public dashboardSrv: DashboardService,
    public workpackShowTabViewSrv: WorkpackShowTabviewService,
  ) {
    this.menuSrv.getMenuState.pipe(takeUntil(this.$destroy)).subscribe(menuState => {
      this.isMenuFixed = menuState.isFixed;
    });
    this.dashboardSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.fullScreenModeDashboard = value);
  }

  toggleMenu(isAdmin: boolean) {
    this.isAdminMenu = isAdmin;
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  onResizeEnd(event) {
    const splitterPanels = document.querySelectorAll('.p-splitter-panel-nested');
    if (splitterPanels.length > 1) {
      const maxWidth = splitterPanels[1].getAttribute('style').split(';')[0].split(':')[1].trim();
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

}
