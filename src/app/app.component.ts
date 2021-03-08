import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Location } from '@angular/common';
import { filter } from 'rxjs/operators';

import { BreadcrumbService } from './shared/services/breadcrumb.service';
import { ResponsiveService } from './shared/services/responsive.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  isMobileView = false;
  showTemplate = false;

  constructor(
    private responsiveSrv: ResponsiveService,
    private router: Router,
    private location: Location,
    private breadcrumbSrv: BreadcrumbService
  ){
    this.responsiveSrv.observable.subscribe(isMobileView => this.isMobileView = isMobileView);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => this.showTemplate = !['/login', '/'].includes(event.url));
    this.location.subscribe(l => l.type === 'popstate' ? this.breadcrumbSrv.handleHistoryPop(l.url) : null);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    const currentWidth = event.target.innerWidth;
    this.detectViewMode(currentWidth);
  }

  ngOnInit(): void {
    this.detectViewMode(window.innerWidth);
  }

  detectViewMode(width: number) {
    if (!this.isMobileView && width <= 768) {
      this.responsiveSrv.next(true);
    }
    if (this.isMobileView && width > 768) {
      this.responsiveSrv.next(false);
    }
  }
}
