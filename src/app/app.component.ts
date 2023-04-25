import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { ResponsiveService } from './shared/services/responsive.service';
import { WorkpackShowTabviewService } from './shared/services/workpack-show-tabview.service';
import { MobileViewService } from './shared/services/mobile-view.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {

  isMobileView = false;
  showTemplate: boolean;

  constructor(
    private responsiveSrv: ResponsiveService,
    private mobileViewSrv: MobileViewService,
    private workpackShowTabViewSrv: WorkpackShowTabviewService,
    private router: Router,
  ){
    this.responsiveSrv.observable.subscribe(isMobileView => this.isMobileView = isMobileView);
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const showTemplate = !['/login', '/', '/workpack/expanded-dashboard'].includes(event.url);
        if (this.showTemplate !== showTemplate) {
          this.showTemplate = showTemplate;
        }
      });
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
      this.mobileViewSrv.next(true);
    }
    if (this.isMobileView && width > 768) {
      this.responsiveSrv.next(false);
      this.mobileViewSrv.next(true);
    }
    if (width >= 900) {
      this.workpackShowTabViewSrv.next(true);
    }
    if (width < 900) {
      this.workpackShowTabViewSrv.next(false);
    }
  }
}
