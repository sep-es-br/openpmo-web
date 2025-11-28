import { MobileViewService } from './../../shared/services/mobile-view.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { takeUntil } from 'rxjs/operators';
import {
  Component,
  ElementRef,
  HostListener,
  Input,
  OnInit,
  SimpleChanges,
  ViewChild,
  OnChanges,
} from '@angular/core';
import { Router } from '@angular/router';
import { IBreadcrumb } from 'src/app/shared/interfaces/IBreadcrumb';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { Subject } from 'rxjs';
import { WorkpackService } from '../../shared/services/workpack.service';
import { MenuItem } from 'primeng/api';
import { AuthService } from 'src/app/shared/services/auth.service';
import { PlanService } from 'src/app/shared/services/plan.service';
import { IPerson } from 'src/app/shared/interfaces/IPerson';
import { TranslateChangeService } from 'src/app/shared/services/translate-change.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-breadcrumb',
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
})
export class BreadcrumbComponent implements OnInit, OnChanges {
  @Input() isAdminMenu = false;

  @ViewChild('crumbsEl') crumbsEl: ElementRef;

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.addCrumbHidden = true;
    this.detectOverflow();
  }

  crumbs: IBreadcrumb[] = [];

  crumpsHide: IBreadcrumb[] = [];

  isMobileView = false;

  isOverflowing = false;

  addCrumbHidden = true;

  crumbOffice: IBreadcrumb;

  crumbPlan: IBreadcrumb;

  $destroy = new Subject();

  fullScreenModeDashboard = false;

  loadingWorkpack = false;

  isUserAdmin: boolean = false;

  currentPlanId: number = 0;

  currentUserInfo: IPerson = {
    name: '--',
  };

  currentLanguage: string;

  responsiveMenuButtons: Array<MenuItem> = [
    {
      label: this.translateSrv.instant('reports'),
      icon: 'far fa-file-alt',
      routerLink: 'reports',
    },
    { separator: true },
    {
      label: this.currentUserInfo.name,
      id: 'user-name',
    },
    {
      label: this.translateSrv.instant('profile'),
      icon: 'far fa-user',
      routerLink: '/persons/profile',
      styleClass: 'ps-2',
    },
    {
      label: this.translateSrv.instant('administrators'),
      icon: 'fas fa-users',
      id: 'user-menu-admin',
      routerLink: '/administrators',
      styleClass: 'ps-2',
      visible: false,
    },
    {
      label: this.translateSrv.instant('languages'),
      icon: 'far fa-flag',
      styleClass: 'ps-2 disabled-as-normal',
      disabled: true,
    },
    {
      label: this.translateSrv.instant('portuguese'),
      icon: 'fas fa-check',
      id: 'language-pt',
      styleClass: 'ps-4',
      command: () => this.changeLanguage('pt-BR'),
    },
    {
      label: this.translateSrv.instant('english'),
      icon: 'fas fa-times',
      id: 'language-en',
      styleClass: 'ps-4',
      command: () => this.changeLanguage('en-US'),
    },
    { separator: true },
    {
      label: this.translateSrv.instant('logout'),
      icon: 'app-icon sign-out-alt',
      command: () => this.authSrv.signOut(),
    },
  ];

  constructor(
    public breadcrumbSrv: BreadcrumbService,
    private mobileViewSrv: MobileViewService,
    private dashboardSrv: DashboardService,
    private workpackSrv: WorkpackService,
    private router: Router,
    public authSrv: AuthService,
    private planSrv: PlanService,
    private translateChangeSrv: TranslateChangeService,
    private translateSrv: TranslateService
  ) {
    this.mobileViewSrv.observable.subscribe(
      (isMobileView) => (this.isMobileView = isMobileView)
    );
    this.workpackSrv.observableLoadingWorkpack.subscribe(
      (isLoading) => (this.loadingWorkpack = isLoading)
    );
    this.dashboardSrv.observable
      .pipe(takeUntil(this.$destroy))
      .subscribe((value) => (this.fullScreenModeDashboard = value));

    this.translateChangeSrv
      .getCurrentLang()
      .pipe(takeUntil(this.$destroy))
      .subscribe((res: { lang: string }) => {
        this.currentLanguage = res.lang;

        // Procura os botões de idioma no menu responsivo pra exibir o ícone de check corretamente no idioma selecionado
        const ptMenuItem = this.responsiveMenuButtons.find(
          (item) => item.id === 'language-pt'
        );
        const enMenuItem = this.responsiveMenuButtons.find(
          (item) => item.id === 'language-en'
        );

        if (ptMenuItem && enMenuItem) {
          if (this.currentLanguage === 'pt-BR') {
            ptMenuItem.icon = 'fas fa-check';
            enMenuItem.icon = 'fas fa-times';
          } else if (this.currentLanguage === 'en-US') {
            ptMenuItem.icon = 'fas fa-times';
            enMenuItem.icon = 'fas fa-check';
          }
        }
      });
  }

  async ngOnInit() {
    this.breadcrumbSrv.observable.subscribe(async (menu) => {
      await this.resetAll();
      await this.setCrumbs(menu);
      this.detectOverflow();
    });

    this.isUserAdmin = await this.authSrv.isUserAdmin();
    this.currentUserInfo = await this.authSrv.getInfoPerson();

    if (this.isUserAdmin) {
      const userMenuAdmin = this.responsiveMenuButtons.find(
        (item) => item.id === 'user-menu-admin'
      );
      if (userMenuAdmin) {
        userMenuAdmin.visible = true;
      }
    }

    if (this.currentUserInfo && this.currentUserInfo.name) {
      const userMenuName = this.responsiveMenuButtons.find(
        (item) => item.id === 'user-name'
      );
      if (userMenuName) {
        userMenuName.label = this.currentUserInfo.name;
      }
    }

    this.planSrv
      .observableIdPlan()
      .pipe(takeUntil(this.$destroy))
      .subscribe(async (id) => {
        this.currentPlanId = id;
      });
  }

  ngOnChanges(changes: SimpleChanges) {
    this.isAdminMenu = changes.isAdminMenu.currentValue;
  }

  async resetAll() {
    this.crumbs = [];
    this.crumbPlan = undefined;
    this.crumbOffice = undefined;
  }

  async setCrumbs(crumbs: IBreadcrumb[]) {
    if (crumbs.length > 0) {
      this.crumbOffice = crumbs.find((crumb) => crumb.key === 'office');
      this.crumbPlan = crumbs.find((crumb) => crumb.key === 'plan');
    }
    this.crumbs = crumbs.filter(
      (crumb) => !['office', 'plan'].includes(crumb.key)
    );
  }

  handleNavigateBredcrumb() {
    if (this.loadingWorkpack) {
      return;
    }
    if (this.crumbPlan && this.crumbOffice && this.crumbs.length > 0) {
      this.router.navigate([...this.crumbPlan.routerLink], {
        queryParams: this.crumbPlan.queryParams,
      });
    } else if (
      (this.crumbPlan && this.crumbOffice && this.crumbs.length === 0) ||
      (!this.crumbPlan && this.crumbOffice && this.crumbs.length === 0)
    ) {
      this.router.navigate([...this.crumbOffice.routerLink], {
        queryParams: this.crumbOffice.queryParams,
      });
    } else if (!this.crumbPlan && this.crumbOffice && this.crumbs.length > 0) {
      this.router.navigate([...this.crumbOffice.routerLink], {
        queryParams: this.crumbOffice.queryParams,
      });
    } else {
      this.router.navigate(['/offices']);
    }
  }

  detectOverflow() {
    if (this.crumbsEl) {
      setTimeout(() => {
        this.isOverflowing =
          this.crumbsEl.nativeElement.offsetHeight <
            this.crumbsEl.nativeElement.scrollHeight ||
          this.crumbsEl.nativeElement.offsetWidth <
            this.crumbsEl.nativeElement.scrollWidth;
        this.hideCrumbsUntilNotOverflowing();
      }, 0);
    }
  }

  hideCrumbsUntilNotOverflowing() {
    if (this.isOverflowing) {
      const firstCrumb = 0;
      if (this.crumbs[firstCrumb].key === 'reticencias') {
        const secondElement = 1;
        const hideCrump = this.crumbs.splice(secondElement, 1)[0];
        this.crumpsHide.push(hideCrump);
        this.crumbs[firstCrumb].routerLink = hideCrump.routerLink;
        this.crumbs[firstCrumb].queryParams = hideCrump.queryParams;
      } else {
        const hideCrump = this.crumbs.shift();
        this.crumpsHide.push(hideCrump);
        this.crumbs.unshift({
          key: 'reticencias',
          routerLink: this.crumpsHide[this.crumpsHide.length - 1].routerLink,
          queryParams: this.crumpsHide[this.crumpsHide.length - 1].queryParams,
          modelName: '...',
        });
      }

      this.addCrumbHidden = false;
      return this.detectOverflow();
    }

    if (this.crumpsHide.length > 0 && this.addCrumbHidden) {
      const indexAdd = this.crumpsHide.length > 1 ? 1 : 0;
      const deleteOrAddCrumb = this.crumpsHide.length > 1 ? 0 : 1;
      this.crumbs.splice(indexAdd, deleteOrAddCrumb, this.crumpsHide.shift());
      this.detectOverflow();
    }
  }

  navigateTo(crumb: IBreadcrumb, index: number) {
    if (this.loadingWorkpack) {
      return;
    }
    if (!crumb.routerLink) {
      return;
    }
    if (crumb.key === 'workpackModel') {
      const currentBreadcrumbItemsStoraged = localStorage.getItem(
        '@pmo/current-breadcrumb'
      );
      if (currentBreadcrumbItemsStoraged) {
        const currentBreadcrumbItems = JSON.parse(
          currentBreadcrumbItemsStoraged
        );
        const breadcrumbIndex = currentBreadcrumbItems.findIndex(
          (item) => item.queryParams?.id === crumb.queryParams.id
        );
        if (breadcrumbIndex > -1) {
          const breadcrumb = currentBreadcrumbItems.slice(
            0,
            breadcrumbIndex + 1
          );
          localStorage.setItem(
            '@pmo/current-breadcrumb',
            JSON.stringify(breadcrumb)
          );
        }
      }
    }
    this.router.navigate(crumb.routerLink, { queryParams: crumb.queryParams });
  }

  changeLanguage(language: 'pt-BR' | 'en-US') {
    this.translateChangeSrv.changeLangDefault(language);
    window.location.reload();
  }
}
