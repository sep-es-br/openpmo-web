import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
    private configDataViewService: ConfigDataViewService,
    private responsiveService: ResponsiveService,
    private translateService: TranslateService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initDataViewSubscriptions();
    this.initPlanAndBreadcrumb();
    this.loadMockPreprojects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleCreatePreproject(): void {
    // A navegação será conectada ao formulário de criação do Anteprojeto.
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
        this.displayMode = displayMode as 'list' | 'grid';
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

  private initPlanAndBreadcrumb(): void {
    const idPlan: string | null = this.route.snapshot.queryParamMap.get('idPlan');
    const idPlanNumber: number = Number(idPlan);

    this.menuService.nextIsPlanMenu(true);

    if (Number.isFinite(idPlanNumber) && idPlanNumber > 0) {
      this.planService.nextIDPlan(idPlanNumber);
    }

    this.breadcrumbService.setMenu([
      {
        key: 'preproject',
        routerLink: ['/preproject'],
        queryParams: idPlan ? { idPlan } : undefined
      }
    ]);
  }

  private loadMockPreprojects(): void {
    const createPreprojectMenuItems: MenuItem[] = [
      {
        label: this.translateService.instant('new'),
        icon: 'fas fa-cog',
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
