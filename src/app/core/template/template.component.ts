import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { takeUntil } from 'rxjs/operators';
import { MenuService } from 'src/app/shared/services/menu.service';
import { Component, OnDestroy } from '@angular/core';

import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-template',
  templateUrl: './template.component.html',
  styleUrls: ['./template.component.scss']
})
export class TemplateComponent implements OnDestroy {

  isMenuFixed = false;
  $destroy = new Subject();
  fullScreenModeDashboard = false;

  constructor(
    public responsiveSrv: ResponsiveService,
    public menuSrv: MenuService,
    public dashboardSrv: DashboardService
  ) {
    this.menuSrv.getMenuState.pipe(takeUntil(this.$destroy)).subscribe(menuState => {
      this.isMenuFixed = menuState.isFixed;
    });
    this.dashboardSrv.observable.pipe(takeUntil(this.$destroy)).subscribe(value => this.fullScreenModeDashboard = value);
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

}
