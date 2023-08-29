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
import { OfficeService } from 'src/app/shared/services/office.service';
import { PlanService } from 'src/app/shared/services/plan.service';
import { TranslateChangeService } from 'src/app/shared/services/translate-change.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  routerPlanWork = false;
  infoPerson: IPerson;

  constructor(
    private authSrv: AuthService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private breadcrumbSrv: BreadcrumbService,
    private translateChangeSrv: TranslateChangeService,
    private cookieSrv: CookieService,
    private planSrv: PlanService,
    private officeSrv: OfficeService
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
      ).subscribe(async (dto) => {
        if (dto === 'error.unauthorized') {
          const lang = window.navigator.language;
          this.translateChangeSrv.changeLangDefault(lang);
          this.authSrv.nextIsLoginDenied(true);
          this.router.navigate(['/login']);
        } else {
          const userInfo = JSON.parse(atob(dto)) as ISocialLoginResult;
          this.authSrv.clearStorage();
          this.authSrv.saveToken(userInfo);
          this.authSrv.nextIsLoginDenied(false);
          const user = this.authSrv.getTokenPayload();
          await this.authSrv.setInfoPerson()
          const language = user ? this.cookieSrv.get('cookiesDefaultLanguateUser' + user.email) : null;
          if (language) {
            this.translateChangeSrv.changeLangDefault(language);
          }
          this.infoPerson = await this.authSrv.getInfoPerson();
          if (this.infoPerson?.workLocal) {
            this.navigateWorkPerson();
          } else {
            this.router.navigate(['/home']);
          }
        }
      });
  }

  ngOnInit(): void {
    setTimeout(async () => {
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
        this.infoPerson = await this.authSrv.getInfoPerson();
        if (this.infoPerson?.workLocal) {
          this.navigateWorkPerson();
        } else {
          setTimeout(async () => {
            const routeLink = '/offices'
            this.router.navigate([routeLink]);
          }, 0);
        }
      }
    }, 300)

  }

  async navigateWorkPerson() {
    if (this.infoPerson?.workLocal) {
      const workLocal = this.infoPerson.workLocal;
      if (workLocal.idWorkpackModelLinked && workLocal.idWorkpack) {
        this.officeSrv.nextIDOffice(workLocal.idOffice);
        this.planSrv.nextIDPlan(workLocal.idPlan);
        this.router.navigate(['workpack'], {
          queryParams: {
            id: Number(workLocal.idWorkpack),
            idPlan: Number(workLocal.idPlan),
            idWorkpackModelLinked: Number(workLocal.idWorkpackModelLinked)
          }
        });
        return;
      }
      if (!workLocal.idWorkpackModelLinked && workLocal.idWorkpack) {
        this.officeSrv.nextIDOffice(workLocal.idOffice);
        this.planSrv.nextIDPlan(workLocal.idPlan);
        this.router.navigate(['workpack'], {
          queryParams: {
            id: Number(workLocal.idWorkpack),
            idPlan: Number(workLocal.idPlan),
          }
        });
        return;
      }
      if (workLocal.idPlan && !workLocal.idWorkpack) {
        this.router.navigate(['plan'], {
          queryParams: {
            id: Number(workLocal.idPlan),
          }
        });
        return;
      }
      if (!workLocal.idPlan && workLocal.idOffice) {
        this.router.navigate(['offices/office'], {
          queryParams: {
            id: Number(workLocal.idOffice),
          }
        });
        return;
      }    
    }
  }

}
