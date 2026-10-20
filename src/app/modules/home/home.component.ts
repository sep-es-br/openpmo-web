import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CookieService } from 'ngx-cookie';
import { filter, map } from 'rxjs/operators';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { ISocialLoginResult } from 'src/app/shared/interfaces/ISocialLoginResult';
import { AuthService } from 'src/app/shared/services/auth.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { MenuService } from 'src/app/shared/services/menu.service';
import { PlanService } from 'src/app/shared/services/plan.service';
import { TranslateChangeService } from 'src/app/shared/services/translate-change.service';
import {PersonService} from '../../shared/services/person.service';
import { TransversalService } from '../../shared/services/transversal.service';
import { PlanEntryNavigationService } from '../../shared/services/plan-entry-navigation.service';

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
    private menuSrv: MenuService,
    private personSrv: PersonService,
    private transversalSrv: TransversalService,
    private planEntryNavigationSrv: PlanEntryNavigationService,
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
          const personLoaded = await this.authSrv.setInfoPerson();
          const language = user ? this.cookieSrv.get('cookiesDefaultLanguateUser' + user.email) : null;
          if (language) {
            this.translateChangeSrv.changeLangDefault(language);
          }
          this.infoPerson = personLoaded ? await this.authSrv.getInfoPerson() : undefined;
          if (!!this.infoPerson && this.infoPerson.workLocal && this.infoPerson.workLocal.idOffice) {
            const navigated = await this.navigateWorkPerson();
            if (!navigated) {
              await this.navigateToFirstAvailablePage();
            }
          } else {
            await this.navigateToFirstAvailablePage();
          }
          this.personSrv.updatePreferences().subscribe();
        }
      });
  }

  async ngOnInit() {
    // The OAuth callback subscription below owns profile refresh and landing
    // navigation for this route. Avoid a concurrent landing decision here.
    if (this.activatedRoute.snapshot.queryParams.AcessoDto) {
      return;
    }
    if (!await this.authSrv.isAuthenticated()) {
      const routeLink = '/login';
      this.router.navigate([routeLink]);
    } else {
      const user = this.authSrv.getTokenPayload();
      const language = user ? this.cookieSrv.get('cookiesDefaultLanguateUser' + user.email) : null;
      if (language) {
        this.translateChangeSrv.changeLangDefault(language);
      }
      // Work-local is only a navigation preference. Reload it from the API for
      // every entry so stale localStorage cannot survive permission changes.
      const personLoaded = await this.authSrv.setInfoPerson();
      this.infoPerson = personLoaded ? await this.authSrv.getInfoPerson() : undefined;
      if (!!this.infoPerson && this.infoPerson.workLocal && this.infoPerson.workLocal.idOffice) {
        const navigated = await this.navigateWorkPerson();
        if (!navigated) {
          await this.navigateToFirstAvailablePage();
        }
      } else {
        await this.navigateToFirstAvailablePage();
      }
    }

  }

  async navigateWorkPerson(): Promise<boolean> {
    const workLocal = this.infoPerson.workLocal;
    if (!workLocal?.idPlan) {
      return false;
    }
    return this.planEntryNavigationSrv.navigateToPlanEntry(Number(workLocal.idPlan), workLocal);
  }

  private async navigateToFirstAvailablePage(): Promise<void> {
    try {
      const plans = await this.planSrv.getDirectAccessContexts();
      const planContext = plans?.success ? plans.data?.[0] : undefined;
      if (planContext && await this.planEntryNavigationSrv.navigateToPlanEntry(Number(planContext.idPlan))) {
        return;
      }
    } catch (error) {
      // Continue with direct workpack access contexts.
    }
    try {
      const structural = await this.transversalSrv.getDirectStructuralAccessContexts();
      const structuralContext = structural?.success ? structural.data?.[0] : undefined;
      if (structuralContext && await this.planEntryNavigationSrv.navigateToPlanEntry(Number(structuralContext.idPlan))) {
        return;
      }
    } catch (error) {
      // Check transversal contexts next.
    }
    try {
      const transversal = await this.transversalSrv.getAccessibleContexts();
      const transversalContext = transversal?.success ? transversal.data?.[0] : undefined;
      if (transversalContext && await this.planEntryNavigationSrv.navigateToPlanEntry(Number(transversalContext.idPlan))) {
        return;
      }
    } catch (error) {
      // Fall back to the office list when no accessible view can be resolved.
    }
    {
      this.menuSrv.reloadMenuOffice();
      this.router.navigate(['/offices']);
    }
  }

}
