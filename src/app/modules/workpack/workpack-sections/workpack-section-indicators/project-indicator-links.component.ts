import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MenuItem, MessageService } from 'primeng/api';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IProjectIndicatorLink, IndicatorLinkCategory, IndicatorService } from '../../../../shared/services/indicator.service';
import { WorkpackService } from '../../../../shared/services/workpack.service';
import { TranslateService } from '@ngx-translate/core';
import { ICardItem } from '../../../../shared/interfaces/ICardItem';
import { ConfigDataViewService } from '../../../../shared/services/config-dataview.service';
import { ResponsiveService } from '../../../../shared/services/responsive.service';
import { IconsEnum } from '../../../../shared/enums/IconsEnum';
import { ICard } from '../../../../shared/interfaces/ICard';
import { WorkpackIndicatorRouteReuseStrategy } from '../../../../shared/services/workpack-indicator-route-reuse.strategy';

@Component({
  selector: 'app-project-indicator-links',
  templateUrl: './project-indicator-links.component.html',
  styleUrls: ['./project-indicator-links.component.scss']
})
export class ProjectIndicatorLinksComponent implements OnInit, OnDestroy {
  @Input() category: IndicatorLinkCategory = 'ODS';

  idWorkpack: number;
  links: IProjectIndicatorLink[] = [];
  filteredLinks: IProjectIndicatorLink[] = [];
  cardItems: ICardItem[] = [];
  cardSection: ICard = {
    toggleable: false,
    initialStateToggle: false,
    collapseble: false,
    cardTitle: '',
    showFilters: true,
    hideTextFilter: false,
    filters: [],
    idFilterSelected: null,
    showCreateNemElementButton: false,
    searchTerm: ''
  };
  searchTerm = '';
  displayModeAll = 'grid';
  pageSize = 5;
  responsive = false;
  loading = true;
  savingLinks = false;
  canEdit = false;
  readonly destroy$ = new Subject<void>();

  constructor(
    private indicatorService: IndicatorService,
    private workpackService: WorkpackService,
    private messageService: MessageService,
    private router: Router,
    private translateService: TranslateService,
    private configDataViewService: ConfigDataViewService,
    private responsiveService: ResponsiveService,
    private routeReuseStrategy: WorkpackIndicatorRouteReuseStrategy
  ) {}

  async ngOnInit(): Promise<void> {
    this.configDataViewService.observableDisplayModeAll
      .pipe(takeUntil(this.destroy$))
      .subscribe(mode => this.displayModeAll = mode);
    this.configDataViewService.observablePageSize
      .pipe(takeUntil(this.destroy$))
      .subscribe(size => this.pageSize = size);
    this.responsiveService.observable
      .pipe(takeUntil(this.destroy$))
      .subscribe(responsive => this.responsive = responsive);
    this.idWorkpack = this.workpackService.getWorkpackParams()?.idWorkpack;
    this.canEdit = this.workpackService.getEditPermission();
    this.cardSection = {
      ...this.cardSection,
      showCreateNemElementButton: this.canEdit
    };

    const savingKey = `${this.idWorkpack}:${this.category}`;
    this.indicatorService.observableProjectIndicatorLinksSaving
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        const isSaving = !!state[savingKey];
        if (isSaving) {
          this.savingLinks = true;
          this.loading = true;
          this.cardSection = { ...this.cardSection, showCreateNemElementButton: false };
        } else if (this.savingLinks) {
          this.savingLinks = false;
          this.cardSection = { ...this.cardSection, showCreateNemElementButton: this.canEdit };
          this.loadLinks();
        }
      });

    if (this.indicatorService.isProjectIndicatorLinksSaving(this.idWorkpack, this.category)) {
      this.savingLinks = true;
      this.loading = true;
      this.cardSection = { ...this.cardSection, showCreateNemElementButton: false };
      return;
    }
    await this.loadLinks();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadLinks(): Promise<void> {
    if (!this.idWorkpack) {
      this.loading = false;
      return;
    }
    this.loading = true;
    try {
      const response = await this.indicatorService.getProjectIndicatorLinks(this.idWorkpack, this.category);
      this.links = response?.success ? response.data || [] : [];
      this.applyFilters();
    } catch (error) {
      this.showError(error);
    } finally {
      this.loading = false;
    }
  }

  openAddScreen(): void {
    if (!this.canEdit) {
      return;
    }
    this.routeReuseStrategy.prepareIndicatorFormNavigation();
    this.router.navigate(['/workpack/indicator-links', this.category], { queryParamsHandling: 'preserve' })
      .then(navigated => {
        if (!navigated) {
          this.routeReuseStrategy.cancelIndicatorFormNavigation();
        }
      })
      .catch(() => this.routeReuseStrategy.cancelIndicatorFormNavigation());
  }

  async toggleActive(link: IProjectIndicatorLink): Promise<void> {
    const previous = link.active;
    link.active = !previous;
    try {
      const response = await this.indicatorService.updateProjectIndicatorLinkStatus(
        this.idWorkpack,
        link.id,
        link.active
      );
      if (!response?.success) {
        throw new Error(response?.message || 'Unable to update link');
      }
      this.applyFilters();
    } catch (error) {
      link.active = previous;
      this.showError(error);
    }
  }

  applyFilters(): void {
    const term = this.searchTerm.trim().toLocaleLowerCase();
    this.filteredLinks = (this.links || []).filter(link => {
      return link.active && (!term || `${link.name} ${link.description || ''}`.toLocaleLowerCase().includes(term));
    });
    this.cardItems = this.filteredLinks.map(link => this.toCardItem(link));
    if (this.canEdit && !this.savingLinks) {
      this.cardItems.push({
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        iconSvg: true,
        onClick: () => this.openAddScreen()
      });
    }
  }

  handleSearchText(event: { term: string }): void {
    this.searchTerm = event?.term || '';
    this.applyFilters();
  }

  private toCardItem(link: IProjectIndicatorLink): ICardItem {
    const strategicIndicatorId = this.category === 'STRATEGIC'
      ? Number(link.externalId?.replace(/^strategic:/, ''))
      : NaN;
    const canOpenStrategicDetails = Number.isInteger(strategicIndicatorId) && strategicIndicatorId > 0;
    const strategicDetailsParams = [
      { name: 'indicatorId', value: strategicIndicatorId },
      { name: 'idWorkpack', value: this.idWorkpack }
    ];
    const idPlan = this.workpackService.getWorkpackParams()?.idPlan;
    if (idPlan != null) {
      strategicDetailsParams.push({ name: 'idPlan', value: idPlan });
    }
    const menuItems: MenuItem[] = [{
      label: this.translateService.instant('removeIndicatorLink'),
      icon: 'fas fa-trash-alt',
      disabled: !this.canEdit,
      command: () => this.toggleActive(link)
    }];

    return {
      typeCardItem: 'listItem',
      icon: 'fas fa-chart-line',
      nameCardItem: link.name,
      fullNameCardItem: link.description,
      subtitleCardItem: link.description,
      ...(canOpenStrategicDetails ? {
        urlCard: '/workpack/indicator-links/strategic/details',
        paramsUrlCard: strategicDetailsParams
      } : {}),
      menuItems
    };
  }

  private showError(error: any): void {
    this.messageService.add({
      severity: 'error',
      summary: this.translateService.instant('error'),
      detail: error?.error?.message || error?.message || this.translateService.instant('messages.catalogLoadError')
    });
  }
}
