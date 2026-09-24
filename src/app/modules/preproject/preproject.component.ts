import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { MenuItem, SelectItem } from 'primeng/api';

import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { MenuService } from 'src/app/shared/services/menu.service';
import { ConfigDataViewService } from 'src/app/shared/services/config-dataview.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { ICardItem } from 'src/app/shared/interfaces/ICardItem';
import { IWorkpackCardItem } from 'src/app/shared/interfaces/IWorkpackCardItem';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { OfficeService } from 'src/app/shared/services/office.service';
import { IBreadcrumb } from 'src/app/shared/interfaces/IBreadcrumb';
import { PreprojectService } from 'src/app/shared/services/preproject.service';
import { IOrganization } from 'src/app/shared/interfaces/IOrganization';
import { IHttpResult } from 'src/app/shared/interfaces/IHttpResult';
import { IPreproject, IPreprojectListItem, PreprojectStatus } from 'src/app/shared/interfaces/IPreproject';
import { IPlan } from 'src/app/shared/interfaces/IPlan';
import { OrganizationService } from 'src/app/shared/services/organization.service';
import { PlanService } from 'src/app/shared/services/plan.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';

@Component({
  selector: 'app-preproject',
  templateUrl: './preproject.component.html',
  styleUrls: ['./preproject.component.scss']
})
export class PreprojectComponent implements OnInit, OnDestroy, AfterViewInit {

  private destroy$: Subject<void> = new Subject<void>();

  preprojects: (ICardItem | IWorkpackCardItem)[] = [];

  private allPreprojectCards: ICardItem[] = [];

  statusFilterOptions: SelectItem[] = [];

  selectedStatus: PreprojectStatus | 'all' = 'all';

  newPreprojectCard: IWorkpackCardItem;

  displayMode: 'list' | 'grid' = 'list';

  pageSize: number = 5;

  responsive: boolean = false;

  collapsePanelsStatus: boolean = false;

  cardProperties: ICard = {
    cardTitle: 'preproject',
    collapseble: true,
    toggleable: false,
    initialStateToggle: false,
    initialStateCollapse: false,
    showCreateNemElementButton: true
  };

  constructor(
    private breadcrumbService: BreadcrumbService,
    private menuService: MenuService,
    private officeService: OfficeService,
    private configDataViewService: ConfigDataViewService,
    private responsiveService: ResponsiveService,
    private translateService: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    private preprojectService: PreprojectService,
    private organizationService: OrganizationService,
    private planService: PlanService,
    private workpackService: WorkpackService
  ) {}

  ngOnInit(): void {
    this.configDataViewService.nextCollapsePanelsStatus('expand');
    this.initDataViewSubscriptions();
    this.loadStatusFilterOptions();
    this.translateService.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadStatusFilterOptions();
        void this.loadPreprojects();
      });

    void this.initOfficeAndBreadcrumb();
    void this.loadPreprojects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleCreatePreproject(): void {
    const idOffice = this.route.snapshot.queryParamMap.get('idOffice');
    void this.router.navigate(['/preproject', 'new'], {
      queryParams: idOffice ? { idOffice } : undefined
    });
  }

  handleExistingProject(): void {
    // A seleção de um projeto existente será conectada na próxima etapa.
  }

  handleEditPreproject(preproject: IPreprojectListItem): void {
    const idOffice = this.route.snapshot.queryParamMap.get('idOffice');
    void this.router.navigate(['/preproject', 'edit'], {
      queryParams: {
        ...(idOffice ? { idOffice } : {}),
        idPreproject: preproject.id
      }
    });
  }

  handleViewPreproject(preproject: IPreprojectListItem): void {
    const idOffice = this.route.snapshot.queryParamMap.get('idOffice');
    void this.router.navigate(['/preproject', 'view'], {
      queryParams: {
        ...(idOffice ? { idOffice } : {}),
        idPreproject: preproject.id
      }
    });
  }

  handleStatusFilterChange(status: PreprojectStatus | 'all'): void {
    this.selectedStatus = status;
    this.applyStatusFilter();
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

  private async initOfficeAndBreadcrumb(): Promise<void> {
    const idOffice: string | null = this.route.snapshot.queryParamMap.get('idOffice');
    const idOfficeNumber: number = Number(idOffice);
    const breadcrumbs: IBreadcrumb[] = [];

    this.menuService.nextIsPlanMenu(false);

    if (Number.isFinite(idOfficeNumber) && idOfficeNumber > 0) {
      const office = await this.officeService.getCurrentOffice(idOfficeNumber);
      this.officeService.nextIDOffice(idOfficeNumber);

      if (office) {
        breadcrumbs.push({
          key: 'office',
          routerLink: ['/offices', 'office'],
          queryParams: { id: office.id },
          info: office.name,
          tooltip: office.fullName
        });
      }
    }

    breadcrumbs.push({
      key: 'preproject',
      routerLink: ['/preproject'],
      queryParams: idOffice ? { idOffice } : undefined
    });

    this.breadcrumbService.setMenu(breadcrumbs);
  }

  private async loadPreprojects(): Promise<void> {
    const createPreprojectMenuItems: MenuItem[] = [
      {
        label: this.translateService.instant('new'),
        icon: `app-icon ${IconsEnum.Preproject} grey-icon`,
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

    const getItemMenuItems = (preproject: IPreprojectListItem, status: PreprojectStatus): MenuItem[] => [
      ...(status === 'Estruturação' ? [{
        label: this.translateService.instant('viewPreproject'),
        icon: 'fas fa-eye',
        command: () => this.handleViewPreproject(preproject)
      }] : []),
      ...(status !== 'Estruturação' ? [{
        label: this.translateService.instant('edit'),
        icon: 'fas fa-pencil-alt',
        command: () => this.handleEditPreproject(preproject)
      }] : []),
      {
        label: this.translateService.instant('delete'),
        icon: 'fas fa-trash-alt',
        command: () => undefined
      }
    ];

    const idOffice = Number(this.route.snapshot.queryParamMap.get('idOffice'));
    let response: IHttpResult<IPreprojectListItem[]>;
    let organizationsResponse: IHttpResult<IOrganization[]>;
    let plansResponse: IHttpResult<IPlan[]>;
    if (Number.isFinite(idOffice) && idOffice > 0) {
      [response, organizationsResponse, plansResponse] = await Promise.all([
        this.preprojectService.findAllByOfficeId(idOffice),
        this.organizationService.GetAll({ 'id-office': idOffice }),
        this.planService.GetAll({ 'id-office': idOffice })
      ]);
    } else {
      response = { success: true, data: [] };
      organizationsResponse = { success: true, data: [] };
      plansResponse = { success: true, data: [] };
    }
    const preprojects = response.success ? response.data || [] : [];
    const organizationsById = new Map<number, string>(
      (organizationsResponse.success ? organizationsResponse.data || [] : [])
        .filter((organization: IOrganization) => !!organization.id)
        .map((organization: IOrganization) => [organization.id as number, organization.name])
    );
    const preprojectDetails = await Promise.all(preprojects.map(async preproject => {
      try {
        const detailResponse = await this.preprojectService.findById(preproject.id);
        return detailResponse.success && detailResponse.data ? detailResponse.data : null;
      } catch {
        return null;
      }
    }));
    const detailsById = new Map<number, IPreproject>(
      preprojectDetails
        .filter((preproject): preproject is IPreproject => !!preproject)
        .map(preproject => [preproject.id, preproject])
    );
    const plans = plansResponse.success ? plansResponse.data || [] : [];
    const planNamesById = new Map<number, string>(
      plans
        .filter((plan): plan is IPlan => !!plan?.id)
        .map(plan => [plan.id as number, plan.name])
    );
    const structuredPlanIds = Array.from(new Set(
      preprojects
        .filter(preproject => this.getPreprojectStatus(preproject, detailsById.get(preproject.id)) === 'Estruturação')
        .map(preproject => this.getPreprojectPlanId(preproject, detailsById.get(preproject.id)))
        .filter((idPlan): idPlan is number => Number.isFinite(idPlan) && idPlan > 0)
    ));
    const workpackIdsByPlan = await this.loadRepresentativeWorkpackIds(structuredPlanIds);

    const mappedItems: ICardItem[] = preprojects.map((preproject: IPreprojectListItem) => {
      const detail = detailsById.get(preproject.id);
      const status = this.getPreprojectStatus(preproject, detail);
      const organizationName = organizationsById.get(detail?.idOrganization || preproject.idOrganization || 0);
      const idPlan = this.getPreprojectPlanId(preproject, detail);
      const idWorkpack = detail?.idWorkpack
        || preproject.idWorkpack
        || workpackIdsByPlan.get(idPlan || 0);
      const navigation = this.getPreprojectCardNavigation(preproject, status, idPlan, idWorkpack);
      const breadcrumbWorkpackModel = status === 'Estruturação'
        ? this.getStructuringWorkpackBreadcrumb(idOffice, idPlan, navigation.itemId)
        : undefined;
      const planName = idPlan ? planNamesById.get(idPlan) : '';
      return {
        typeCardItem: 'listItem',
        icon: 'fas fa-cog project-icon',
        iconSvg: false,
        nameCardItem: preproject.name,
        fullNameCardItem: preproject.fullName || preproject.name,
        organizationName: organizationName || '',
        subtitleCardItem: planName || '',
        statusItem: status,
        showStatusInList: true,
        statusItemAsSubtitle: true,
        itemId: preproject.id,
        navigationItemId: navigation.itemId,
        urlCard: navigation.url,
        idAtributeName: navigation.idAttributeName,
        paramsUrlCard: navigation.params,
        breadcrumbWorkpackModel,
        menuItems: getItemMenuItems(preproject, status)
      };
    });

    this.newPreprojectCard = {
      typeCardItem: 'newCardItem',
      icon: IconsEnum.Plus,
      iconSvg: true,
      iconMenuItems: createPreprojectMenuItems
    };

    this.allPreprojectCards = mappedItems;
    this.applyStatusFilter();
  }

  ngAfterViewInit(): void {
    // O painel de controles pode restaurar a preferência global após a abertura da tela.
    // Anteprojetos deve iniciar aberto, sem alterar a preferência para as próximas ações do usuário.
    setTimeout(() => this.configDataViewService.nextCollapsePanelsStatus('expand'));
  }

  private getPreprojectStatus(preproject: IPreprojectListItem, detail?: IPreproject): PreprojectStatus {
    return preproject.status || detail?.status || 'Elaboração';
  }

  private loadStatusFilterOptions(): void {
    this.statusFilterOptions = [
      { label: this.translateService.instant('all'), value: 'all' },
      { label: this.translateService.instant('preprojectElaboration'), value: 'Elaboração' },
      { label: this.translateService.instant('structuring'), value: 'Estruturação' }
    ];
  }

  private applyStatusFilter(): void {
    const filteredCards = this.selectedStatus === 'all'
      ? this.allPreprojectCards
      : this.allPreprojectCards.filter(card => card.statusItem === this.selectedStatus);

    this.preprojects = [...filteredCards, this.newPreprojectCard];
  }

  private getPreprojectCardNavigation(
    preproject: IPreprojectListItem,
    status: PreprojectStatus,
    idPlan?: number,
    idWorkpack?: number
  ): {
    url: string;
    idAttributeName: string;
    itemId: number;
    params: Array<{ name: string; value: string | number }>;
  } {
    const idOffice = this.route.snapshot.queryParamMap.get('idOffice');

    if (status === 'Estruturação') {
      return {
        url: '/workpack',
        idAttributeName: 'id',
        itemId: idWorkpack || preproject.id,
        params: idPlan ? [{ name: 'idPlan', value: idPlan }] : []
      };
    }

    return {
      url: '/preproject/edit',
      idAttributeName: 'idPreproject',
      itemId: preproject.id,
      params: idOffice ? [{ name: 'idOffice', value: idOffice }] : []
    };
  }

  private getStructuringWorkpackBreadcrumb(
    idOffice: number,
    idPlan: number | undefined,
    idWorkpack: number
  ): IBreadcrumb[] {
    return [
      {
        key: 'preproject',
        routerLink: ['/preproject'],
        queryParams: Number.isFinite(idOffice) && idOffice > 0 ? { idOffice } : undefined
      },
      {
        key: 'project',
        info: this.translateService.instant('structuring'),
        tooltip: this.translateService.instant('structuring'),
        queryParams: {
          id: idWorkpack,
          ...(idPlan ? { idPlan } : {})
        }
      }
    ];
  }

  private async loadRepresentativeWorkpackIds(planIds: number[]): Promise<Map<number, number>> {
    const entries = await Promise.all(planIds.map(async idPlan => {
      try {
        const response = await this.workpackService.GetWorkpackListCards({ 'id-plan': idPlan });
        const workpacks = response.success ? response.data || [] : [];
        const workpack = workpacks.find(item => item.type === 'Project') || workpacks[0];
        return workpack?.id ? [idPlan, workpack.id] as [number, number] : null;
      } catch {
        return null;
      }
    }));
    return new Map(entries.filter((entry): entry is [number, number] => !!entry));
  }

  private getPreprojectPlanId(
    preproject: IPreprojectListItem,
    detail: IPreproject | undefined
  ): number | undefined {
    return detail?.idPlan
      || preproject.idPlan;
  }

}
