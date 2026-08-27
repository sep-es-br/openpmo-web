import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';

import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { MenuService } from 'src/app/shared/services/menu.service';
import { PlanService } from 'src/app/shared/services/plan.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IWorkpackCardItem } from 'src/app/shared/interfaces/IWorkpackCardItem';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { OfficeService } from 'src/app/shared/services/office.service';
import { IBreadcrumb } from 'src/app/shared/interfaces/IBreadcrumb';

interface IPreprojectMockItem {
  name: string;
  id: number;
}

@Component({
  selector: 'app-preproject',
  templateUrl: './preproject.component.html',
  styleUrls: ['./preproject.component.scss']
})
export class PreprojectComponent implements OnInit, OnDestroy {

  private destroy$: Subject<void> = new Subject<void>();

  preprojects: (ICardItem | IWorkpackCardItem)[] = [];

  newPreprojectCard: IWorkpackCardItem;

  displayMode: 'list' | 'grid' = 'list';

  pageSize: number = 5;

  responsive: boolean = false;

  collapsePanelsStatus: boolean = true;

  cardProperties: ICard = {
    cardTitle: 'preprojects',
    collapseble: true,
    toggleable: false,
    initialStateToggle: false,
    initialStateCollapse: true,
    showCreateNemElementButton: true
  };

  constructor(
    private breadcrumbService: BreadcrumbService,
    private menuService: MenuService,
    private planService: PlanService,
    private officeService: OfficeService,
    private configDataViewService: ConfigDataViewService,
    private responsiveService: ResponsiveService,
    private translateService: TranslateService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initDataViewSubscriptions();
    this.translateService.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadMockPreprojects());

    void this.initPlanAndBreadcrumb();
    this.loadMockPreprojects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleCreatePreproject(): void {
    const idPlan = this.route.snapshot.queryParamMap.get('idPlan');
    void this.router.navigate(['/preproject', 'new'], {
      queryParams: idPlan ? { idPlan } : undefined
    });
  }

  handleExistingProject(): void {
    // A seleção de um projeto existente será conectada na próxima etapa.
  }

  private initDataViewSubscriptions(): void {
    this.configDataViewService.observableCollapsePanelsStatus
      .pipe(takeUntil(this.destroy$))
      .subscribe((collapsePanelStatus: string) => {
        this.collapsePanelsStatus = collapsePanelStatus === 'collapse';
        this.cardProperties = {
          ...this.cardProperties,
          initialStateCollapse: this.collapsePanelsStatus
        };
      });

    this.configDataViewService.observableDisplayModeAll
      .pipe(takeUntil(this.destroy$))
      .subscribe((displayMode: string) => {
        if (displayMode === 'list' || displayMode === 'grid') {
          this.displayMode = displayMode;
        }
      });

    this.configDataViewService.observablePageSize
      .pipe(takeUntil(this.destroy$))
      .subscribe((pageSize: number) => {
        this.pageSize = pageSize;
      });

    this.responsiveService.observable
      .pipe(takeUntil(this.destroy$))
      .subscribe((responsive: boolean) => {
        this.responsive = responsive;
      });
  }

  private async initPlanAndBreadcrumb(): Promise<void> {
    const idPlan: string | null = this.route.snapshot.queryParamMap.get('idPlan');
    const idPlanNumber: number = Number(idPlan);
    const breadcrumbs: IBreadcrumb[] = [];

    this.menuService.nextIsPlanMenu(true);

    if (Number.isFinite(idPlanNumber) && idPlanNumber > 0) {
      await this.planService.nextIDPlan(idPlanNumber);
      const plan = await this.planService.getCurrentPlan(idPlanNumber);

      if (plan) {
        const office = await this.officeService.getCurrentOffice(plan.idOffice);
        this.officeService.nextIDOffice(plan.idOffice);

        if (office) {
          breadcrumbs.push({
            key: 'office',
            routerLink: ['/offices', 'office'],
            queryParams: { id: office.id },
            info: office.name,
            tooltip: office.fullName
          });
        }

        breadcrumbs.push({
          key: 'plan',
          routerLink: ['/plan'],
          queryParams: { id: plan.id },
          info: plan.name,
          tooltip: plan.fullName
        });
      }
    }

    breadcrumbs.push({
      key: 'preproject',
      routerLink: ['/preproject'],
      queryParams: idPlan ? { idPlan } : undefined
    });

    this.breadcrumbService.setMenu(breadcrumbs);
  }

  private loadMockPreprojects(): void {
    const createPreprojectMenuItems: MenuItem[] = [
      {
        label: this.translateService.instant('new'),
        icon: 'assets/svg/icons.svg#preproject',
        command: () => this.handleCreatePreproject()
      },
      {
        label: this.translateService.instant('existingProject'),
        icon: 'fas fa-briefcase',
        command: () => this.handleExistingProject()
      }
    ];

    this.cardProperties = {
      ...this.cardProperties,
      createNewElementMenuItems: createPreprojectMenuItems
    };

    const getItemMenuItems = (): MenuItem[] => [
      {
        label: this.translateService.instant('edit'),
        icon: 'fas fa-pencil-alt',
        command: () => undefined
      },
      {
        label: this.translateService.instant('delete'),
        icon: 'fas fa-trash-alt',
        command: () => undefined
      }
    ];

    const mockData: IPreprojectMockItem[] = [
      { name: 'Valorização das Culturas Populares', id: 199 },
      { name: 'Modernização TVE e Rad ES', id: 204 },
      { name: 'TVE Revista', id: 209 },
      { name: 'PE 2023-2026', id: 211 }
    ];

    const mappedItems: ICardItem[] = mockData.map((preproject: IPreprojectMockItem) => ({
      typeCardItem: 'listItem',
      icon: 'fas fa-cog project-icon',
      iconSvg: false,
      nameCardItem: preproject.name,
      fullNameCardItem: preproject.name,
      itemId: preproject.id,
      menuItems: getItemMenuItems()
    }));

    this.newPreprojectCard = {
      typeCardItem: 'newCardItem',
      icon: IconsEnum.Plus,
      iconSvg: true,
      iconMenuItems: createPreprojectMenuItems
    };

    this.preprojects = [...mappedItems, this.newPreprojectCard];
  }

}
