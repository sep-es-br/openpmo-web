import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthService } from 'src/app/shared/services/auth.service';
import { Router } from '@angular/router';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';

@Component({
  selector: 'app-administration-config',
  templateUrl: './administration.component.html',
  styleUrls: ['./administration.component.scss']
})
export class AdministrationComponent implements OnInit {

  cardProperties: ICard = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: 'configurations',
    collapseble: true,
    initialStateCollapse: false
  };

  cardItemsProperties: ICardItem[] = [];
  displayModeAll = 'grid';
  responsive: boolean;
  isLoading = false;
  showBackToManagement = false;
  infoPerson;

  $destroy = new Subject();

  constructor(
    private translateSvr: TranslateService,
    private responsiveSrv: ResponsiveService,
    private configDataViewSrv: ConfigDataViewService,
    private breadcrumbSrv: BreadcrumbService,
    private authSrv: AuthService,
    private router: Router
  ) {
    this.configDataViewSrv.observableDisplayModeAll
      .pipe(takeUntil(this.$destroy))
      .subscribe(displayMode => {
        this.displayModeAll = displayMode;
      });

    this.responsiveSrv.observable
      .subscribe(value => this.responsive = value);
  }

  ngOnInit(): void {
    this.loadCardItemsProperties();
    this.checkShowBackToManagement();
    this.loadBreadcrump();
  }

  checkShowBackToManagement() {
    this.infoPerson = this.authSrv.getInfoPerson();
    if (this.infoPerson && this.infoPerson.workLocal &&
      (this.infoPerson.workLocal.idOffice || this.infoPerson.workLocal.idPlan || this.infoPerson.workLocal.idWorkpack)) {
      this.showBackToManagement = true;
    }
  }

  
  loadBreadcrump() {
    this.breadcrumbSrv.setMenu([
      {
        key: 'administration',
        routerLink: ['/administration'],
      }
    ]);
  }

  async navigateToManagement() {
    const workLocal = this.infoPerson.workLocal;
    if (workLocal.idWorkpackModelLinked && workLocal.idWorkpack && workLocal.idPlan && workLocal.idOffice) {
      this.router.navigate(['workpack'], {
        queryParams: {
          id: Number(workLocal.idWorkpack),
          idPlan: Number(workLocal.idPlan),
          idWorkpackModelLinked: Number(workLocal.idWorkpackModelLinked)
        }
      });
      return;
    }
    if (workLocal.idWorkpack && workLocal.idPlan && workLocal.idOffice) {
      this.router.navigate(['workpack'], {
        queryParams: {
          id: Number(workLocal.idWorkpack),
          idPlan: Number(workLocal.idPlan),
        }
      });
      return;
    }
    if (workLocal.idPlan && workLocal.idOffice) {
      this.router.navigate(['plan'], {
        queryParams: {
          id: Number(workLocal.idPlan),
        }
      });
      return;
    }
    if (workLocal.idOffice) {
      this.router.navigate(['offices/office'], {
        queryParams: {
          id: Number(workLocal.idOffice),
        }
      });
      return;
    }
  }

  loadCardItemsProperties() {
    this.isLoading = true;

    this.cardItemsProperties = [
        {
            typeCardItem: 'listItem',
            icon: 'fas fa-users-cog',
            nameCardItem: this.translateSvr.instant('administrators'),
            fullNameCardItem: this.translateSvr.instant('administrators'),
            urlCard: '/administrators'
        },
        {
            typeCardItem: 'listItem',
            icon: 'app-icon map-marked',
            nameCardItem: this.translateSvr.instant('domain'),
            fullNameCardItem: this.translateSvr.instant('domain'),
            urlCard: '/domains'
        },
        // {
        //     typeCardItem: 'listItem',
        //     icon: 'fas fa-ruler-horizontal',
        //     nameCardItem: this.translateSvr.instant('measureUnits'),
        //     fullNameCardItem: this.translateSvr.instant('measureUnits'),
        //     urlCard: '/measure-units'
        // }
    ];

    setTimeout(() => {
      this.isLoading = false;
    }, 200);
  }
}
