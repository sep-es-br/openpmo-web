import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { IBreadcrumb } from 'src/app/shared/interfaces/IBreadcrumb';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss']
})
export class BreadcrumbComponent implements OnInit {

  @ViewChild('crumbsEl') crumbsEl: HTMLDivElement;
  crumbs: IBreadcrumb[] = [];
  isMobileView = false;
  isOverflowing = false;

  constructor(
    public breadcrumbSrv: BreadcrumbService,
    private responsiveSrv: ResponsiveService,
    private router: Router
  ) {
    this.responsiveSrv.observable.subscribe(isMobileView => this.isMobileView = isMobileView);
  }

  ngOnInit(): void {
    this.breadcrumbSrv.observable.subscribe(menu => {
      this.crumbs = menu;
      this.detectOverflow();
    });
  }

  detectOverflow() {
    if (this.crumbsEl) {
      setTimeout(() =>
        this.isOverflowing = (this.crumbsEl.offsetHeight < this.crumbsEl.scrollHeight) ||
          (this.crumbsEl.offsetWidth < this.crumbsEl.scrollWidth)
      , 0);
    }
  }

  navigateTo(crumb: IBreadcrumb, index: number) {
    if (this.breadcrumbSrv.getURLFromCrumb(crumb) !== this.router.url) {
      this.breadcrumbSrv.setMenu(this.crumbs.splice(0, index + 1));
      this.router.navigate(crumb.routerLink, { queryParams: crumb.queryParams });
    }
  }
}
