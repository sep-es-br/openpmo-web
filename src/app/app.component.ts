import { TranslateChangeService } from 'src/app/shared/services/translate-change.service';
import { AuthService } from 'src/app/shared/services/auth.service';
import { CookieService } from 'ngx-cookie';
import { Component, HostListener, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

import { ResponsiveService } from './shared/services/responsive.service';

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
    }
    if (this.isMobileView && width > 768) {
      this.responsiveSrv.next(false);
    }
  }
}
