import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CookieService } from 'ngx-cookie';
import { MessageService } from 'primeng/api';
import { filter, map } from 'rxjs/operators';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { ISocialLoginResult } from 'src/app/shared/interfaces/ISocialLoginResult';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { TranslateChangeService } from 'src/app/shared/services/translate-change.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  routerPlanWork = false;

  constructor(
    private authSrv: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private translateChangeSrv: TranslateChangeService,
    private cookieSrv: CookieService
  ) {
    this.breadcrumbSrv.setMenu([]);
    this.activatedRoute.queryParams
      .pipe(
        map(({ AcessoDto }) =>
          (!this.authSrv.isAuthenticated() && !AcessoDto)
            ? this.router.navigate(['/login'])
            : AcessoDto
        ),
        filter((dto) => !!dto)
      ).subscribe((dto) => {
        if (dto === 'error.unauthorized') {
          const lang = window.navigator.language;
          this.translateChangeSrv.changeLangDefault(lang);
          this.authSrv.nextIsLoginDenied(true);
          this.router.navigate(['/login']);
        } else {
          const userInfo = JSON.parse(atob(dto)) as ISocialLoginResult;
          this.authSrv.saveToken(userInfo);
          this.authSrv.nextIsLoginDenied(false);
          const user = this.authSrv.getTokenPayload();
          const language = user ? this.cookieSrv.get('cookiesDefaultLanguateUser' + user.email) : null;
          if (language) {
            this.translateChangeSrv.changeLangDefault(language);
          }
          const workPlanUser = this.cookieSrv.get('planWorkUser' + user.email);
          if (workPlanUser) {
            this.routerPlanWork = true;
            this.router.navigate(['plan'], {
              queryParams: {
                id: Number(workPlanUser)
              }
            });
          } else {
            this.router.navigate(['/home']);
          }
        }
      });
  }

  ngOnInit(): void {
    setTimeout( () => {
      if (!this.authSrv.isAuthenticated()) {
        setTimeout(async () => {
          const routeLink = '/offices'
          this.router.navigate([routeLink]);
        }, 0);
      } else {
        const user = this.authSrv.getTokenPayload();
        const language = user ? this.cookieSrv.get('cookiesDefaultLanguateUser' + user.email) : null;
        if (language) {
          this.translateChangeSrv.changeLangDefault(language);
        }
        const workPlanUser = user ? this.cookieSrv.get('planWorkUser' + user.email) : null;
        if ((!this.routerPlanWork && !workPlanUser) ) {
          setTimeout(async () => {
            const routeLink = '/offices'
            this.router.navigate([routeLink]);
          }, 0);
        } else {
          this.router.navigate(['plan'], {
            queryParams: {
              id: workPlanUser
            }
          });
        }
      }
    },300)
    
  }

}
