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

  constructor(
    public responsiveSrv: ResponsiveService,
    public menuSrv: MenuService
  ) {
    this.menuSrv.getMenuState.pipe(takeUntil(this.$destroy)).subscribe(menuState => {
      this.isMenuFixed = menuState.isFixed;
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

}
