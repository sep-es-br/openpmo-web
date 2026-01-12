import { AuthService } from '../../../shared/services/auth.service';
import { BaselineService } from '../../../shared/services/baseline.service';
import {
  IBaseline,
  IBaselineUpdates,
} from '../../../shared/interfaces/IBaseline';
import { takeUntil } from 'rxjs/operators';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { ResponsiveService } from 'src/app/shared/services/responsive.service';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ICard } from 'src/app/shared/interfaces/ICard';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MessageService, TreeNode } from 'primeng/api';
import { TranslateService } from '@ngx-translate/core';
import { TypeWorkpackEnumWBS } from 'src/app/shared/enums/TypeWorkpackEnum';
import { BaselineUpdateStatus } from 'src/app/shared/enums/BaselineUpdateStatus';

interface BaselineUpdateBreakdown {
  label: string;
  icon: string;
  children: Array<BaselineUpdateBreakdown>;
  included: boolean;
  readonly: boolean;
  property: string;
  classification: BaselineUpdateStatus;
  idWorkpack: number;
  expanded: boolean;
  warnings?: {
    shouldDisplayDeliveryWarnings: boolean;
    deliveryTooltipWarnings: string;
  };
}

@Component({
  selector: 'app-baseline',
  templateUrl: './baseline.component.html',
  styleUrls: ['./baseline.component.scss'],
})
export class BaselineComponent implements OnInit, OnDestroy {
  idBaseline: number;

  idWorkpack: number;

  idWorkpackModelLinked: number;

  responsive: boolean;

  cardBaselineProperties: ICard;

  cardBaselineUpdates: ICard;

  cardBaselineEvaluations: ICard;

  formBaseline: FormGroup;

  baseline: IBaseline;

  $destroy = new Subject();

  editPermission = false;

  updates: IBaselineUpdates[];

  includeAllUpdates = true;

  panelCollapsed = false;

  idPlan: number;

  showCommentDialog = false;

  selectedComment = '';

  isLoading = false;

  formIsLoading = false;

  updatesTree: Array<TreeNode<IBaselineUpdates>>;

  treeShouldStartExpanded: boolean = true;

  showFailMinMilestoneRequirement: boolean;

  showFailPlannedWorkRequirement: boolean;

  minMilestoneRequirement: number;

  get allTogglerIsDisabled(): boolean {
    return this.areTherePendentUpdatesListed || this.formBaseline.disabled;
  }

  get areTherePendentUpdatesListed(): boolean {
    return (
      (this.baseline &&
        this.baseline.updates &&
        this.baseline.updates.length > 0 &&
        this.baseline.updates.some((update) =>
          [
            BaselineUpdateStatus.NO_SCHEDULE,
            BaselineUpdateStatus.UNDEFINED_SCOPE,
          ].includes(update.classification)
        )) ||
      this.showFailMinMilestoneRequirement ||
      this.showFailPlannedWorkRequirement
    );
  }

  get shouldDisableBaselineSubmission(): boolean {
    return (
      this.formIsLoading ||
      this.areTherePendentUpdatesListed ||
      !this.baseline?.updates.some((update) => update.included) ||
      !this.formBaseline.valid
    );
  }

  constructor(
    private actRouter: ActivatedRoute,
    private baselineSrv: BaselineService,
    private workpackSrv: WorkpackService,
    private formBuilder: FormBuilder,
    private responsiveSrv: ResponsiveService,
    private breadcrumbSrv: BreadcrumbService,
    private router: Router,
    private authSrv: AuthService,
    private messageSrv: MessageService,
    private translateSrv: TranslateService
  ) {
    this.responsiveSrv.observable
      .pipe(takeUntil(this.$destroy))
      .subscribe((value) => (this.responsive = value));
    this.formBaseline = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(50)]],
      proposer: null,
      description: ['', [Validators.required]],
      message: ['', [Validators.required]],
    });
  }

  async ngOnInit() {
    this.actRouter.queryParams.pipe(takeUntil(this.$destroy)).subscribe({
      next: async ({ idWorkpack, idWorkpackModelLinked, idBaseline }) => {
        this.idWorkpack = idWorkpack && +idWorkpack;
        this.idWorkpackModelLinked =
          idWorkpackModelLinked && +idWorkpackModelLinked;
        this.idBaseline = idBaseline && +idBaseline;

        await this.loadPropertiesBaseline();
        await this.setBreadcrumb();
      },
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next();
    this.$destroy.complete();
  }

  async setBreadcrumb() {
    let breadcrumbItems = this.breadcrumbSrv.get;
    if (!breadcrumbItems || breadcrumbItems.length === 0) {
      breadcrumbItems = await this.breadcrumbSrv.loadWorkpackBreadcrumbs(
        this.idWorkpack,
        this.idPlan
      );
    }

    this.breadcrumbSrv.setMenu([
      ...breadcrumbItems,
      {
        key: 'baseline',
        info: this.baseline?.name,
        tooltip: this.baseline?.name,
      },
    ]);
  }

  async getBreadcrumbs(idWorkpack: number) {
    const { success, data } = await this.breadcrumbSrv.getBreadcrumbWorkpack(
      idWorkpack,
      { 'id-plan': this.idPlan }
    );
    return success
      ? data.map((p) => ({
          key: !p.modelName ? p.type.toLowerCase() : p.modelName,
          info: p.name,
          tooltip: p.fullName,
          routerLink: this.getRouterLinkFromType(p.type),
          queryParams: {
            id: p.id,
            idWorkpackModelLinked: p.idWorkpackModelLinked,
            idPlan: this.idPlan,
          },
          modelName: p.modelName,
        }))
      : [];
  }

  getRouterLinkFromType(type: string): string[] {
    switch (type) {
      case 'office':
        return ['/offices', 'office'];
      case 'plan':
        return ['plan'];
      default:
        return ['/workpack'];
    }
  }

  async loadPropertiesBaseline() {
    this.formIsLoading = true;

    this.cardBaselineProperties = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: 'properties',
      collapseble: true,
      initialStateCollapse: false,
      isLoading: this.idBaseline ? true : false,
    };
    this.cardBaselineUpdates = {
      toggleable: false,
      initialStateToggle: false,
      cardTitle: this.translateSrv.instant('updates'),
      collapseble: true,
      initialStateCollapse: false,
      isLoading: true,
    };

    if (this.idBaseline) {
      this.idPlan = Number(localStorage.getItem('@currentPlan'));
      const result = await this.baselineSrv.GetByIdWithIdWorkpack(
        this.idWorkpack,
        this.idBaseline,
        this.idPlan
      );
      this.baseline = result.data;
      this.cardBaselineProperties.isLoading = false;
      if (this.baseline) {
        this.idWorkpack = this.baseline.idWorkpack;
        this.formBaseline.controls.name.setValue(this.baseline.name);
        this.formBaseline.controls.proposer.setValue(this.baseline.proposer);
        this.formBaseline.controls.description.setValue(
          this.baseline.description
        );
        this.formBaseline.controls.message.setValue(this.baseline.message);
        if (this.baseline.status !== 'DRAFT') {
          this.formBaseline.disable();
          if (this.baseline.updates) {
            this.assembleUpdatesTree(this.baseline.updates);
          }
        }
      }
    } else {
      this.baseline = {
        idWorkpack: this.idWorkpack,
        status: 'DRAFT',
        name: '',
        description: '',
      };
    }
    await this.loadPermissions();
    this.cardBaselineUpdates.isLoading =
      !this.idBaseline || this.baseline.status === 'DRAFT';
    if (!this.idBaseline || this.baseline.status === 'DRAFT') {
      await this.loadUpdates();
    }

    this.formIsLoading = false;
  }

  async loadPermissions() {
    const isUserAdmin = await this.authSrv.isUserAdmin();
    this.idPlan = Number(localStorage.getItem('@currentPlan'));
    const result = await this.workpackSrv.GetWorkpackPermissions(
      this.idWorkpack,
      { 'id-plan': this.idPlan }
    );

    if (result.success) {
      const workpack = result.data;
      if (isUserAdmin) {
        this.editPermission = !workpack.canceled;
      } else {
        this.editPermission =
          workpack.permissions &&
          workpack.permissions.filter((p) => p.level === 'EDIT').length > 0 &&
          !workpack.canceled;
      }
    }
  }

  handleCollapsed(event?) {
    this.panelCollapsed = event ? event : !this.panelCollapsed;
  }

  async loadUpdates() {
    const updates = await this.baselineSrv.getUpdates({
      'id-workpack': this.idWorkpack,
      idPlan: this.idPlan,
    });
    this.baseline.updates = [];
    this.cardBaselineUpdates.isLoading = false;

    const { valid, requiredAmount } =
      await this.baselineSrv.checkMilestonesRequirement(this.idWorkpack);
    const reqPlanWork = await this.baselineSrv.checkPlannedWorkRequirement(
      this.idWorkpack
    );
    this.showFailMinMilestoneRequirement = !valid;
    this.showFailPlannedWorkRequirement = !reqPlanWork.valid;
    this.minMilestoneRequirement = requiredAmount;

    this.assembleUpdatesTree(updates);
  }

  assembleUpdatesTree(updates: IBaselineUpdates[]) {
    this.baseline.updates = [];

    const deletedItemsBlock = updates.find(
      (el) => el.idWorkpack === -1 && el.modelName === 'Excluídos'
    );

    let rootNodes = updates;

    if (deletedItemsBlock) {
      rootNodes = updates.filter((el) => el.modelName !== 'Excluídos');
    }

    const mainTree = this.buildTreeRecursive(rootNodes);

    if (deletedItemsBlock) {
      const deletedTree = {
        label: deletedItemsBlock.modelNameInPlural,
        // icon: deletedItemsBlock.fontIcon,
        property: 'title',
        expanded: this.treeShouldStartExpanded,
        children: this.buildTreeRecursive(deletedItemsBlock.children),
      };

      this.updatesTree = [...mainTree, deletedTree];
    } else {
      this.updatesTree = mainTree;
    }

    this.includeAllUpdates =
      this.baseline.updates.length > 0 &&
      this.baseline.updates.every((u) => u.included);
  }

  private groupByModelNameInPlural(
    nodes: IBaselineUpdates[]
  ): Map<string, IBaselineUpdates[]> {
    const map = new Map<string, IBaselineUpdates[]>();
    nodes.forEach((n) => {
      const key = n.modelNameInPlural || n.modelName || 'Itens';
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key).push(n);
    });
    return map;
  }

  private shouldStartSelected(
    siblings: IBaselineUpdates[],
    entity: IBaselineUpdates
  ): boolean {
    return (
      !siblings.some((el) =>
        [
          BaselineUpdateStatus.NO_SCHEDULE,
          BaselineUpdateStatus.UNDEFINED_SCOPE,
        ].includes(el.classification)
      ) &&
      (entity.classification === BaselineUpdateStatus.NEW ||
        entity.classification === BaselineUpdateStatus.TO_CANCEL ||
        entity.classification === BaselineUpdateStatus.DELETED)
    );
  }

  private isReadonly(entity: IBaselineUpdates): boolean {
    return [
      BaselineUpdateStatus.NO_SCHEDULE,
      BaselineUpdateStatus.UNDEFINED_SCOPE,
    ].includes(entity.classification);
  }

  private buildTreeRecursive(nodes: IBaselineUpdates[]): any[] {
    if (!nodes || nodes.length === 0) return [];
    // Agrupa os nós filhos por modelNameInPlural
    const grouped = this.groupByModelNameInPlural(nodes);
    const result: any[] = [];
    grouped.forEach((groupNodes, groupTitle) => {
      // Title node (ex: "Marcos críticos", "Entregas")
      const titleNode: any = {
        label: groupTitle,
        // icon: groupNodes[0]?.fontIcon,
        property: 'title',
        expanded: this.treeShouldStartExpanded,
        children: [],
      };
      groupNodes.forEach((node) => {
        const treeNode: any = {
          label: node.name,
          icon: node.fontIcon,
          property: 'value',
          expanded: this.treeShouldStartExpanded,
          classification: node.classification,
          idWorkpack: node.idWorkpack,
          readonly: this.isReadonly(node),
          included: this.shouldStartSelected(groupNodes, node),
          children: [],
        };
        // warnings para Deliverable
        if (
          node.type === TypeWorkpackEnumWBS.Deliverable &&
          node.deliveryModelHasActiveSchedule &&
          this.isReadonly(node)
        ) {
          treeNode.warnings = {
            shouldDisplayDeliveryWarnings: true,
            deliveryTooltipWarnings: this.getDeliveryTooltipWarnings(node),
          };
        }
        if (
          node.type === TypeWorkpackEnumWBS.Deliverable ||
          node.type === TypeWorkpackEnumWBS.Milestone
        ) {
          this.baseline.updates.push({
            ...node,
            included: treeNode.included,
          });
        }
        // recursão (caso Organizer tenha filhos)
        if (node.children && node.children.length > 0) {
          treeNode.children = this.buildTreeRecursive(node.children);
        }
        titleNode.children.push(treeNode);
      });
      // só adiciona o title se tiver filhos
      if (titleNode.children.length > 0) {
        result.push(titleNode);
      }
    });
    return result;
  }

  handleSetAllTogglesUpdates(isEnabled: boolean) {
    [...this.baseline.updates, ...this.getBottomTreeNodes(this.updatesTree)]
      .filter(
        (update: any) =>
          ![
            BaselineUpdateStatus.NO_SCHEDULE,
            BaselineUpdateStatus.UNDEFINED_SCOPE,
            BaselineUpdateStatus.UNCHANGED,
          ].includes(update.classification)
      )
      .forEach((update: any) => {
        if (
          [
            BaselineUpdateStatus.TO_CANCEL,
            BaselineUpdateStatus.DELETED,
            BaselineUpdateStatus.NEW,
          ].includes(update.classification)
        ) {
          update.included = true;
        } else {
          update.included = isEnabled;
        }
      });
  }

  async handleSaveDraftBaseline(showMessage = true) {
    if (this.formBaseline.invalid) {
      this.messageSrv.add({
        severity: 'warn',
        summary: this.translateSrv.instant('atention'),
        detail: this.translateSrv.instant(
          'messages.requiredInformationsMustBeFilled'
        ),
      });
      return;
    }
    this.baseline = {
      ...this.baseline,
      name: this.formBaseline.controls.name.value,
      description: this.formBaseline.controls.description.value,
      message: this.formBaseline.controls.message.value,
    };
    this.formIsLoading = true;
    const result = this.idBaseline
      ? await this.baselineSrv.putBaseline(this.idBaseline, this.baseline)
      : await this.baselineSrv.post(this.baseline);
    this.formIsLoading = false;
    if (result.success) {
      if (!this.idBaseline) {
        this.baseline.id = result.data.id;
        this.idBaseline = result.data.id;
      }
      if (showMessage) {
        this.messageSrv.add({
          severity: 'success',
          summary: this.translateSrv.instant('success'),
          detail: this.translateSrv.instant('messages.savedSuccessfully'),
        });
      }
    }
  }

  async handleSubmitBaseline() {
    this.formIsLoading = true;
    const selectedUpdates = this.baseline.updates.filter(
      (update) => update.classification !== BaselineUpdateStatus.UNCHANGED
    );
    const result = await this.baselineSrv.submitBaseline(
      this.idBaseline,
      selectedUpdates
    );
    this.formIsLoading = false;
    if (result.success) {
      const idPlan = Number(localStorage.getItem('@currentPlan'));
      await this.router.navigate(['/workpack'], {
        queryParams: this.idWorkpackModelLinked
          ? {
              id: this.idWorkpack,
              idPlan,
              idWorkpackModelLinked: this.idWorkpackModelLinked,
            }
          : {
              id: this.idWorkpack,
              idPlan,
            },
      });
    }
  }

  async handleCancelChanges() {
    const idPlan = Number(localStorage.getItem('@currentPlan'));
    await this.router.navigate(['/workpack'], {
      queryParams: this.idWorkpackModelLinked
        ? {
            id: this.idWorkpack,
            idPlan,
            idWorkpackModelLinked: this.idWorkpackModelLinked,
          }
        : {
            id: this.idWorkpack,
            idPlan,
          },
    });
  }

  handleShowDialogComment(comment) {
    this.selectedComment = comment;
    this.showCommentDialog = true;
  }

  async saveDraftAndSubmitBaseline() {
    if (!this.idBaseline) {
      await this.handleSaveDraftBaseline(false);
    }
    if (this.idBaseline) {
      await this.handleSubmitBaseline();
    }
  }

  getDeliveryTooltipWarnings(update: IBaselineUpdates) {
    if (update.deliveryModelHasActiveSchedule) {
      if (update.classification === BaselineUpdateStatus.NO_SCHEDULE) {
        const firstSentence = this.translateSrv.instant(
          'workpack-eap-alert-no-schedule'
        );

        return `- ${firstSentence}`;
      } else if (
        update.classification === BaselineUpdateStatus.UNDEFINED_SCOPE
      ) {
        const firstSentence = this.translateSrv.instant(
          'workpack-eap-alert-no-scope'
        );

        return `- ${firstSentence}`;
      }
    }
  }

  handleToggleSwitchChange(isEnabled: boolean, workpackId: number) {
    const changedUpdate = this.baseline.updates.find(
      (update) => update.idWorkpack === workpackId
    );

    if (changedUpdate) {
      if (
        [BaselineUpdateStatus.DELETED, BaselineUpdateStatus.TO_CANCEL].includes(
          changedUpdate.classification
        )
      ) {
        changedUpdate.included = true;
      } else {
        changedUpdate.included = isEnabled;
      }
    }

    const allUpdates = [
      ...this.baseline.updates,
      ...this.getBottomTreeNodes(this.updatesTree),
    ];
    this.includeAllUpdates = allUpdates.every((update: any) => update.included);
    // Se por acaso tiver selecionado todas as Atualizações, habilita o switch geral
  }

  getBottomTreeNodes(tree: Array<TreeNode>): Array<TreeNode> {
    const finalNodes = [];

    tree.forEach((node) => {
      if (node.children && node.children.length > 0) {
        finalNodes.push(...this.getBottomTreeNodes(node.children));
      } else {
        finalNodes.push(node);
      }
    });

    return finalNodes;
  }
}
