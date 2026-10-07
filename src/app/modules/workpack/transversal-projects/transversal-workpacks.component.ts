import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { LazyLoadEvent, MessageService } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { ITransversalLinkedModel, ITransversalWorkpack } from 'src/app/shared/interfaces/ITransversal';
import { TransversalService } from 'src/app/shared/services/transversal.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { IWorkpackCardItem } from 'src/app/shared/interfaces/IWorkpackCardItem';
import { IWorkpackListCard } from 'src/app/shared/interfaces/IWorkpack';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import * as moment from 'moment';
import { MilestoneStatusEnum } from 'src/app/shared/enums/MilestoneStatusEnum';
import { BreakdownStructureService } from 'src/app/shared/services/breakdown-structure.service';
import { IconsEnum } from 'src/app/shared/enums/IconsEnum';
import { MenuService } from 'src/app/shared/services/menu.service';
import { IMenuWorkpackModel } from 'src/app/shared/interfaces/IMenu';
import { WorkpackModelClassificationEnum } from 'src/app/shared/enums/WorkpackModelClassificationEnum';

@Component({
  selector: 'app-transversal-workpacks',
  templateUrl: './transversal-workpacks.component.html',
  styleUrls: ['./transversal-workpacks.component.scss']
})
export class TransversalWorkpacksComponent implements OnChanges {
  @Input() idTransversalProgram: number;
  @Input() idPlan: number;
  @Input() linkedModel: ITransversalLinkedModel;
  @Input() canEdit = false;
  @Input() displayMode = 'grid';
  @Input() responsive = false;
  @Input() pageSize = 5;

  workpackCards: Array<IWorkpackCardItem & { currentlyEligible: boolean }> = [];
  eligibleTree: any[] = [];
  private eligibleIncludedIds = new Set<number>();
  includedWorkpacks: ITransversalWorkpack[] = [];
  private workpackCardDetails = new Map<number, IWorkpackListCard>();
  private structuralModelIcons = new Map<number, string>();
  private eligibleTreeModelIds = new Set<number>();
  selectedWorkpackIds: number[] = [];
  includedTotalRecords = 0;
  includedPage = 0;
  showPicker = false;
  showCanceled = false;
  isLoading = false;
  isSaving = false;
  isPickerLoading = false;
  cardSection = {
    toggleable: false,
    initialStateToggle: false,
    cardTitle: '',
    collapseble: false,
    initialStateCollapse: false,
    showFilters: false,
    showCreateNemElementButton: false,
    isLoading: false
  };
  private loadVersion = 0;
  private eligibleLoadVersion = 0;
  private eligibleTreeLoaded = false;
  private eligibleTreeLoad?: Promise<void>;

  constructor(
    private transversalSrv: TransversalService,
    private dashboardSrv: DashboardService,
    private workpackSrv: WorkpackService,
    private breakdownStructureSrv: BreakdownStructureService,
    private menuSrv: MenuService,
    private messageSrv: MessageService,
    private translateSrv: TranslateService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.canEdit) {
      this.refreshWorkpackCards();
    }
    if ((changes.idTransversalProgram || changes.linkedModel) &&
      this.idTransversalProgram && this.linkedModel?.idWorkpackModel) {
      this.cardSection = {
        ...this.cardSection,
        showCreateNemElementButton: false
      };
      this.loadWorkpacks();
      this.eligibleTreeLoaded = false;
      void this.loadEligibleWorkpacks();
    }
  }

  get visibleWorkpacks(): ITransversalWorkpack[] {
    return this.includedWorkpacks;
  }

  get totalRecords(): number {
    return this.includedTotalRecords + (this.canAddWorkpack ? 1 : 0);
  }

  private get canAddWorkpack(): boolean {
    return this.canEdit && !!this.linkedModel?.currentlyConfigured;
  }

  private refreshWorkpackCards(): void {
    this.workpackCards = this.visibleWorkpacks.map(workpack => {
      const details = this.workpackCardDetails.get(Number(workpack.idWorkpack));
      const journalInformation = details?.journalInformation;
      const actualInformation = journalInformation?.date
        ? moment().diff(moment(journalInformation.date), 'days') <= 30
        : undefined;
      return {
        typeCardItem: details?.type || this.linkedModel?.type || 'Workpack',
        icon: details?.fontIcon || this.linkedModel?.fontIcon || 'fas fa-folder',
        iconSvg: false,
        nameCardItem: workpack.name,
        fullNameCardItem: workpack.fullName || workpack.name,
        itemId: workpack.idWorkpack,
        menuItems: this.canEdit ? [{
          label: this.translateSrv.instant('removeParticipation'),
          icon: 'pi pi-times',
          command: () => this.remove(workpack)
        }] : undefined,
        urlCard: '/workpack',
        paramsUrlCard: [{ name: 'idPlan', value: workpack.idPlan }],
        linked: details?.linked,
        shared: details?.sharedWith,
        canceled: workpack.canceled || details?.canceled || details?.deleted,
        completed: details?.completed,
        endManagementDate: details?.endManagementDate,
        dashboardData: this.loadDashboardData(details),
        hasBaseline: details?.hasActiveBaseline,
        baselineName: details?.activeBaselineName,
        subtitleCardItem: details?.type === 'Milestone' ? details.date?.split('T')[0] : '',
        statusItem: details?.type === 'Milestone' ? MilestoneStatusEnum[details.milestoneStatus] : '',
        journalInformation: journalInformation && { ...journalInformation, actual: actualInformation },
        statusProperty: details?.statusProperty,
        currentlyEligible: workpack.currentlyEligible
      };
    });
    const lastPageWithAddCard = Math.floor(this.includedTotalRecords / this.pageSize);
    if (this.canAddWorkpack && this.includedPage === lastPageWithAddCard) {
      this.workpackCards.push({
        typeCardItem: 'newCardItem',
        icon: IconsEnum.Plus,
        iconSvg: true,
        editPermission: true,
        onNewItem: () => this.openPicker(),
        currentlyEligible: true
      });
    }
  }

  trackByWorkpackCard(index: number, card: IWorkpackCardItem): number {
    return card.itemId === undefined ? index : card.itemId;
  }

  async loadWorkpacks(page = 0, pageSize = this.pageSize): Promise<void> {
    const version = ++this.loadVersion;
    this.isLoading = true;
    try {
      const included = await this.transversalSrv.getIncludedWorkpacks(
        this.idTransversalProgram, this.linkedModel.idWorkpackModel, page, pageSize, this.showCanceled
      );
      if (version !== this.loadVersion) { return; }
      const visibleIncluded = included?.success
        ? (included.data || []).filter(workpack => !workpack.coveredByIncludedAncestor)
        : [];
      this.includedTotalRecords = included?.pagination?.totalRecords ?? visibleIncluded.length;
      this.includedWorkpacks = included?.pagination
        ? visibleIncluded
        : visibleIncluded.slice(page * pageSize, (page + 1) * pageSize);
      this.includedPage = page;
      this.pageSize = pageSize;
      this.workpackCardDetails.clear();
      this.refreshWorkpackCards();
      this.isLoading = false;
      const includedIds = this.includedWorkpacks.map(workpack => Number(workpack.idWorkpack));
      if (includedIds.length) {
        try {
          const cardDetails = await this.workpackSrv.GetWorkpackListCards({
            'id-plan': this.idPlan,
            'id-workpack-model': this.linkedModel.idWorkpackModel,
            ids: includedIds
          });
          if (version !== this.loadVersion) { return; }
          this.workpackCardDetails = new Map<number, IWorkpackListCard>(
            (cardDetails?.success ? cardDetails.data || [] : [])
              .filter(details => includedIds.includes(Number(details.id)))
              .map(details => [Number(details.id), details] as [number, IWorkpackListCard])
          );
          this.refreshWorkpackCards();
        } catch (_) {
          // The participation list remains usable if optional card details fail to load.
        }
      }
    } catch (_) {
      if (version === this.loadVersion) {
        this.includedWorkpacks = [];
        this.includedTotalRecords = 0;
        this.workpackCardDetails.clear();
        this.refreshWorkpackCards();
        this.messageSrv.add({ severity: 'error', summary: this.translateSrv.instant('error') });
      }
    } finally {
      if (version === this.loadVersion) { this.isLoading = false; }
    }
  }

  private loadDashboardData(workpack?: IWorkpackListCard) {
    if (!workpack?.dashboard) {
      return { risk: workpack?.risk, milestone: workpack?.milestone };
    }
    const dashboard = workpack.dashboard;
    return {
      tripleConstraint: dashboard.tripleConstraint && {
        cost: {
          actualValue: dashboard.tripleConstraint.costActualValue,
          foreseenValue: dashboard.tripleConstraint.costForeseenValue,
          plannedValue: dashboard.tripleConstraint.costPlannedValue,
          variation: dashboard.tripleConstraint.costVariation
        },
        schedule: {
          actualEndDate: dashboard.tripleConstraint.scheduleActualEndDate,
          actualStartDate: dashboard.tripleConstraint.scheduleActualStartDate,
          actualValue: dashboard.tripleConstraint.scheduleActualValue,
          foreseenEndDate: dashboard.tripleConstraint.scheduleForeseenEndDate,
          foreseenStartDate: dashboard.tripleConstraint.scheduleForeseenStartDate,
          foreseenValue: dashboard.tripleConstraint.scheduleForeseenValue,
          plannedEndDate: dashboard.tripleConstraint.schedulePlannedEndDate,
          plannedStartDate: dashboard.tripleConstraint.schedulePlannedStartDate,
          plannedValue: dashboard.tripleConstraint.schedulePlannedValue,
          variation: dashboard.tripleConstraint.scheduleVariation
        },
        scope: {
          actualVariationPercent: dashboard.tripleConstraint.scopeActualVariationPercent,
          foreseenVariationPercent: dashboard.tripleConstraint.scopeForeseenVariationPercent,
          plannedVariationPercent: dashboard.tripleConstraint.scopePlannedVariationPercent,
          foreseenValue: dashboard.tripleConstraint.scopeForeseenValue,
          actualValue: dashboard.tripleConstraint.scopeActualValue,
          plannedValue: dashboard.tripleConstraint.scopePlannedValue,
          variation: dashboard.tripleConstraint.scopeVariation,
          foreseenWorkRefMonth: dashboard.tripleConstraint.scopeForeseenWorkRefMonth
        }
      },
      earnedValue: dashboard.performanceIndex?.earnedValue,
      costPerformanceIndex: dashboard.performanceIndex?.costPerformanceIndexValue ? {
        costVariation: dashboard.performanceIndex.costPerformanceIndexVariation,
        indexValue: dashboard.performanceIndex.costPerformanceIndexValue
      } : null,
      schedulePerformanceIndex: dashboard.performanceIndex?.schedulePerformanceIndexValue ? {
        indexValue: dashboard.performanceIndex.schedulePerformanceIndexValue,
        scheduleVariation: dashboard.performanceIndex.schedulePerformanceIndexVariation
      } : null,
      risk: workpack.risk,
      milestone: workpack.milestone
    };
  }

  async openPicker(): Promise<void> {
    if (!this.canEdit || !this.linkedModel.currentlyConfigured) { return; }
    this.selectedWorkpackIds = [];
    this.showPicker = true;
    if (!this.eligibleTreeLoaded) {
      await this.loadEligibleWorkpacks();
    }
  }

  async loadEligibleWorkpacks(): Promise<void> {
    if (!this.idTransversalProgram || !this.linkedModel?.idWorkpackModel) { return; }
    if (this.eligibleTreeLoaded) { return; }
    if (this.eligibleTreeLoad) {
      await this.eligibleTreeLoad;
      return;
    }
    const version = ++this.eligibleLoadVersion;
    this.isPickerLoading = true;
    this.eligibleTreeLoad = (async () => {
      try {
        const [result, includedIds, eligibleTreeModelIds] = await Promise.all([
          this.breakdownStructureSrv.getPlanStructureById(this.idPlan, { allLevels: false }),
          this.loadAllIncludedIds(),
          this.loadEligibleTreeModelIds()
        ]);
        if (version !== this.eligibleLoadVersion) { return; }
        this.eligibleIncludedIds = includedIds;
        this.eligibleTree = result?.success
          ? (result.data?.workpackModels || [])
            .filter(model => eligibleTreeModelIds.has(Number(model.idWorkpackModel)))
            .map(model => ({
            label: model.workpackModelName,
            fontIcon: this.structuralModelIcons.get(Number(model.idWorkpackModel)),
            expanded: true,
            selectable: false,
            children: (model.workpacks || []).map(workpack =>
              this.toEligibleTreeNode(workpack, model.idWorkpackModel, includedIds, false))
              .filter(node => !!node)
          }))
          : [];
        this.eligibleTreeLoaded = !!result?.success;
      } catch (_) {
        if (version === this.eligibleLoadVersion) {
          this.eligibleTree = [];
        }
      } finally {
        if (version === this.eligibleLoadVersion) { this.isPickerLoading = false; }
      }
    })();
    try {
      await this.eligibleTreeLoad;
    } finally {
      this.eligibleTreeLoad = undefined;
    }
  }

  private async loadEligibleTreeModelIds(): Promise<Set<number>> {
    this.eligibleTreeModelIds = new Set<number>();
    this.structuralModelIcons.clear();
    const idOffice = this.workpackSrv.getWorkpackParams()?.idOffice;
    const idPlanModel = this.workpackSrv.getWorkpackParams()?.propertiesPlan?.planModel?.id;
    if (!idOffice) { return new Set<number>(); }
    const result = await this.menuSrv.getItemsPlanModel(idOffice);
    const planModel = result?.success
      ? (result.data || []).find(plan => Number(plan.id) === Number(idPlanModel))
      : undefined;
    const visit = (models: IMenuWorkpackModel[] = []) => models.forEach(model => {
      if (model.classification !== WorkpackModelClassificationEnum.TRANSVERSAL) {
        const id = Number(model.id);
        if (model.fontIcon) {
          this.structuralModelIcons.set(id, model.fontIcon);
        }
      }
      visit(model.children || []);
    });
    visit(planModel?.workpackModels || []);
    const eligibleModelIds = new Set<number>();
    const visitEligiblePath = (models: IMenuWorkpackModel[] = [], ancestors: number[] = []) =>
      models.forEach(model => {
        const id = Number(model.id);
        const path = Number.isFinite(id) ? [...ancestors, id] : ancestors;
        if (id === Number(this.linkedModel.idWorkpackModel)) {
          path.forEach(modelId => eligibleModelIds.add(modelId));
        }
        visitEligiblePath(model.children || [], path);
      });
    visitEligiblePath(planModel?.workpackModels || []);
    this.eligibleTreeModelIds = eligibleModelIds;
    return eligibleModelIds;
  }

  private async loadAllIncludedIds(): Promise<Set<number>> {
    const ids = new Set<number>();
    const models = await this.transversalSrv.getLinkedModels(this.idTransversalProgram);
    const modelIds = new Set<number>([
      Number(this.linkedModel.idWorkpackModel),
      ...(models?.success ? models.data || [] : []).map(model => Number(model.idWorkpackModel))
    ]);
    for (const idWorkpackModel of modelIds) {
      let page = 0;
      let totalPages = 1;
      do {
        const result = await this.transversalSrv.getIncludedWorkpacks(
          this.idTransversalProgram, idWorkpackModel, page, 50, true
        );
        (result?.success ? result.data || [] : []).forEach(workpack => ids.add(Number(workpack.idWorkpack)));
        totalPages = result?.pagination?.totalPages || 0;
        page++;
      } while (page < totalPages);
    }
    return ids;
  }

  private toEligibleTreeNode(workpack: any, idWorkpackModel: number, includedIds: Set<number>, covered: boolean): any {
    const included = includedIds.has(Number(workpack.idWorkpack));
    const { workpackModels = [], ...nodeData } = workpack;
    const isLinkedModel = Number(idWorkpackModel) === Number(this.linkedModel.idWorkpackModel);
    const hasEligibleChildren = workpackModels.some(group =>
      this.eligibleTreeModelIds.has(Number(group.idWorkpackModel)) && (group.workpacks || []).length > 0);
    const hasUnloadedEligibleChildren = !isLinkedModel && !workpackModels.length && !!workpack.hasChildren;
    if (!isLinkedModel && !hasEligibleChildren && !hasUnloadedEligibleChildren) { return null; }
    return {
      ...nodeData,
      idWorkpackModel,
      label: workpack.workpackName,
      fontIcon: this.structuralModelIcons.get(Number(idWorkpackModel)),
      expanded: false,
      leaf: covered || included || isLinkedModel || !(hasEligibleChildren || hasUnloadedEligibleChildren),
      selectable: isLinkedModel
        && !included && !covered && !workpack.canceled && !workpack.deleted,
      childrenLoaded: false,
      covered: covered || included,
      children: []
    };
  }

  async expandEligibleNode(event: any): Promise<void> {
    const node = event?.node;
    if (!node?.idWorkpack || node.childrenLoaded || node.covered || node.leaf) { return; }
    node.loading = true;
    try {
      const result = await this.breakdownStructureSrv.getByWorkpackId(node.idWorkpack, {
        'id-plan': this.idPlan,
        allLevels: false
      });
      const groups = result?.success
        ? (result.data?.workpackModels || []).filter(group =>
          this.eligibleTreeModelIds.has(Number(group.idWorkpackModel)))
        : [];
      node.children = groups.flatMap(group => (group.workpacks || []).map(child =>
        this.toEligibleTreeNode(child, group.idWorkpackModel, this.eligibleIncludedIds, node.covered))
        .filter(child => !!child));
      node.childrenLoaded = true;
      node.leaf = node.children.length === 0;
      this.eligibleTree = this.pruneEmptyEligibleBranches(this.eligibleTree);
    } catch (_) {
      // Keep the node expandable so the user can retry after a failed request.
    } finally {
      node.loading = false;
    }
  }

  private pruneEmptyEligibleBranches(nodes: any[]): any[] {
    return nodes.reduce((visible, node) => {
      node.children = this.pruneEmptyEligibleBranches(node.children || []);
      const isLinkedModel = Number(node.idWorkpackModel) === Number(this.linkedModel.idWorkpackModel);
      const hasUnloadedEligibleChildren = !!node.idWorkpack && !node.childrenLoaded && !node.leaf && !node.covered;
      if (!node.idWorkpack) {
        if (node.children.length) { visible.push(node); }
      } else if (isLinkedModel || node.children.length || hasUnloadedEligibleChildren) {
        visible.push(node);
      }
      return visible;
    }, []);
  }

  handleIncludedPageChange(event: LazyLoadEvent): void {
    const rows = event.rows || this.pageSize;
    this.loadWorkpacks(Math.floor((event.first || 0) / rows), rows);
  }

  handleCanceledChange(): void {
    this.loadWorkpacks(0);
  }

  toggleSelection(idWorkpack: number, selected: boolean): void {
    const selection = new Set(this.selectedWorkpackIds);
    if (selected) {
      selection.add(idWorkpack);
    } else {
      selection.delete(idWorkpack);
    }
    this.selectedWorkpackIds = Array.from(selection);
  }

  async confirmSelection(): Promise<void> {
    if (!this.selectedWorkpackIds.length || this.isSaving) { return; }
    this.isSaving = true;
    let includedAny = false;
    try {
      const ids = Array.from(new Set(this.selectedWorkpackIds));
      for (const id of ids) {
        const result = this.linkedModel.type === 'ProjectModel'
          ? await this.transversalSrv.includeProject(this.idTransversalProgram, id)
          : await this.transversalSrv.includeWorkpack(this.idTransversalProgram, id);
        if (!result?.success) { throw new Error('Participation was not included'); }
        includedAny = true;
      }
      this.showPicker = false;
    } catch (_) {
      this.messageSrv.add({ severity: 'error', summary: this.translateSrv.instant('error') });
    } finally {
      try {
        if (includedAny) {
          await this.loadWorkpacks(0);
          await this.dashboardSrv.loadDashboard(false);
        }
      } finally {
        this.isSaving = false;
      }
    }
  }

  async remove(workpack: ITransversalWorkpack): Promise<void> {
    if (!this.canEdit || this.isSaving) { return; }
    this.isSaving = true;
    try {
      const result = this.linkedModel.type === 'ProjectModel'
        ? await this.transversalSrv.removeProject(this.idTransversalProgram, workpack.idWorkpack)
        : await this.transversalSrv.removeWorkpack(this.idTransversalProgram, workpack.idWorkpack);
      if (result?.success) {
        await this.loadWorkpacks(this.includedPage);
        await this.dashboardSrv.loadDashboard(false);
      }
    } catch (_) {
      this.messageSrv.add({ severity: 'error', summary: this.translateSrv.instant('error') });
    } finally {
      this.isSaving = false;
    }
  }

  removeWorkpackCard(idWorkpack: number): Promise<void> {
    const workpack = this.visibleWorkpacks.find(item => item.idWorkpack === idWorkpack);
    return workpack ? this.remove(workpack) : Promise.resolve();
  }
}
