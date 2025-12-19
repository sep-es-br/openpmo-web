import { AuthService } from '../../../shared/services/auth.service';
import { BaselineService } from '../../../shared/services/baseline.service';
import { IBaseline, IBaselineUpdates } from '../../../shared/interfaces/IBaseline';
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
      this.baseline &&
      this.baseline.updates &&
      this.baseline.updates.length > 0 &&
      this.baseline.updates.some(
        (update) => [UpdateStatus.NO_SCHEDULE, UpdateStatus.UNDEFINED_SCOPE].includes(update.classification)
      )
    ) || this.showFailMinMilestoneRequirement || this.showFailPlannedWorkRequirement;
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

    this.actRouter.queryParams.subscribe(
      ({ idBaseline, idWorkpack, idWorkpackModelLinked }) => {
        this.idWorkpack = idWorkpack && +idWorkpack;
        this.idWorkpackModelLinked =
          idWorkpackModelLinked && +idWorkpackModelLinked;
        this.idBaseline = idBaseline && +idBaseline;
      }
    );
      
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
        }
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
      const result = await this.baselineSrv.GetByIdWithIdWorkpack(
        this.idWorkpack,
        this.idBaseline
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

    const { valid, requiredAmount } = await this.baselineSrv.checkMilestonesRequirement(this.idWorkpack);
    const reqPlanWork = await this.baselineSrv.checkPlannedWorkRequirement(this.idWorkpack);
    this.showFailMinMilestoneRequirement = !valid;
    this.showFailPlannedWorkRequirement = !reqPlanWork.valid
    this.minMilestoneRequirement = requiredAmount;

    this.assembleUpdatesTree(updates);
  }

  assembleUpdatesTree(updates: Array<any>) {
    const conditionToEntityStartSelected = (
      updates: Array<IBaselineUpdates>,
      entity: IBaselineUpdates
    ) =>
      !updates.some((el) =>
        [
          BaselineUpdateStatus.NO_SCHEDULE,
          BaselineUpdateStatus.UNDEFINED_SCOPE,
        ].includes(el.classification)
      ) &&
      (entity.classification === BaselineUpdateStatus.NEW ||
        entity.classification === BaselineUpdateStatus.TO_CANCEL ||
        entity.classification === BaselineUpdateStatus.DELETED);

    // A função abaixo serve para criar os objetos de Marcos Críticos e Entregas que serão inseridos na árvore
    const buildMilestonesAndDeliveries = (
      childs: Array<IBaselineUpdates>
    ): {
      milestoneTitleObject?: any;
      deliveryTitleObject?: any;
    } => {
      const milestones = childs.filter(
        (el) => el.type === TypeWorkpackEnumWBS.Milestone
      );
      const deliveries = childs.filter(
        (el) => el.type === TypeWorkpackEnumWBS.Deliverable
      );
      const updates = [...milestones, ...deliveries];

      let finalResult: {
        milestoneTitleObject?: any;
        deliveryTitleObject?: any;
      } = {};

      if (milestones.length > 0) {
        const milestoneTitleObject = {
          label: 'Marcos críticos',
          icon: 'fas fa-flag',
          children: [],
          property: 'title',
          expanded: this.treeShouldStartExpanded,
        };

        milestones.forEach((milestone) => {
          const milestoneObject = {
            label: milestone.name,
            icon: milestone.fontIcon,
            children: [],
            included: conditionToEntityStartSelected(updates, milestone),
            readonly: [
              BaselineUpdateStatus.NO_SCHEDULE,
              BaselineUpdateStatus.UNDEFINED_SCOPE,
            ].includes(milestone.classification),
            property: 'value',
            classification: milestone.classification,
            idWorkpack: milestone.idWorkpack,
            expanded: this.treeShouldStartExpanded,
          };

          milestoneTitleObject.children.push(milestoneObject);
          this.baseline.updates.push({
            ...milestone,
            included: conditionToEntityStartSelected(updates, milestone),
          });
        });

        finalResult = {
          ...finalResult,
          milestoneTitleObject,
        };
      }

      if (deliveries.length > 0) {
        const deliveryTitleObject = {
          label: 'Entregas',
          icon: 'fas fa-boxes',
          children: [],
          property: 'title',
          expanded: this.treeShouldStartExpanded,
        };

        deliveries.forEach((delivery) => {
          let deliveryObject: BaselineUpdateBreakdown = {
            label: delivery.name,
            icon: delivery.fontIcon,
            children: [],
            included: conditionToEntityStartSelected(updates, delivery),
            readonly: [
              BaselineUpdateStatus.NO_SCHEDULE,
              BaselineUpdateStatus.UNDEFINED_SCOPE,
            ].includes(delivery.classification),
            property: 'value',
            classification: delivery.classification,
            idWorkpack: delivery.idWorkpack,
            expanded: this.treeShouldStartExpanded,
          };

          if (
            delivery.deliveryModelHasActiveSchedule &&
            [
              BaselineUpdateStatus.NO_SCHEDULE,
              BaselineUpdateStatus.UNDEFINED_SCOPE,
            ].includes(delivery.classification)
          ) {
            deliveryObject = {
              ...deliveryObject,
              warnings: {
                shouldDisplayDeliveryWarnings: true,
                deliveryTooltipWarnings:
                  this.getDeliveryTooltipWarnings(delivery),
              },
            };
          }

          deliveryTitleObject.children.push(deliveryObject);
          this.baseline.updates.push({
            ...delivery,
            included: conditionToEntityStartSelected(updates, delivery),
          });
        });

        finalResult = {
          ...finalResult,
          deliveryTitleObject,
        };
      }

      return finalResult;
    };

    const etapasTitleObject = {
      label: 'Etapas',
      icon: 'fas fa-tasks',
      children: [],
      property: 'title',
      expanded: this.treeShouldStartExpanded,
    };

    const deletedItemsBlock = updates.find(
      (el) => el.idWorkpack === -1 && el.modelName === 'Excluídos'
    );

    if (deletedItemsBlock)
      updates = updates.filter((el) => el.modelName !== 'Excluídos');

    updates.forEach((etapa) => {
      const etapaObject = {
        label: etapa.name,
        icon: etapa.fontIcon,
        children: [],
        property: 'value',
        expanded: this.treeShouldStartExpanded,
      };

      etapasTitleObject.children.push(etapaObject);

      if (etapa.children) {
        if (
          etapa.children.some(
            (el) => el.type === 'Organizer' && el.modelName === 'Subetapa'
          )
        ) {
          const subetapaTitleObject = {
            label: 'Subetapas',
            icon: 'fas fa-tasks',
            children: [],
            property: 'title',
            expanded: this.treeShouldStartExpanded,
          };

          etapaObject.children.push(subetapaTitleObject);

          etapa.children.forEach((subetapa) => {
            const subetapaObject = {
              label: subetapa.name,
              icon: subetapa.fontIcon,
              children: [],
              property: 'value',
              expanded: this.treeShouldStartExpanded,
            };

            subetapaTitleObject.children.push(subetapaObject);

            const milestonesAndDeliveries = buildMilestonesAndDeliveries(
              subetapa.children
            );
            if (milestonesAndDeliveries.milestoneTitleObject)
              subetapaObject.children.push(
                milestonesAndDeliveries.milestoneTitleObject
              );
            if (milestonesAndDeliveries.deliveryTitleObject)
              subetapaObject.children.push(
                milestonesAndDeliveries.deliveryTitleObject
              );
            // Nesse ponto, o TitleObject dos Marcos e Entregas já estão carregados com os Marcos e as Entregas
          });
        } else {
          const milestonesAndDeliveries = buildMilestonesAndDeliveries(
            etapa.children
          );
          if (milestonesAndDeliveries.milestoneTitleObject)
            etapaObject.children.push(
              milestonesAndDeliveries.milestoneTitleObject
            );
          if (milestonesAndDeliveries.deliveryTitleObject)
            etapaObject.children.push(
              milestonesAndDeliveries.deliveryTitleObject
            );
          // Nesse ponto, o TitleObject dos Marcos e Entregas já estão carregados com os Marcos e as Entregas
        }
      }
    });

    if (deletedItemsBlock) {
      const deletedItemsTitle = {
        label: deletedItemsBlock.modelNameInPlural,
        icon: deletedItemsBlock.fontIcon,
        children: [],
        property: 'title',
        expanded: this.treeShouldStartExpanded,
      };

      const deletedDeliveriesAndMilestones = buildMilestonesAndDeliveries(
        deletedItemsBlock.children
      );
      if (deletedDeliveriesAndMilestones.milestoneTitleObject) {
        deletedItemsTitle.children.push(
          deletedDeliveriesAndMilestones.milestoneTitleObject
        );
      }
      if (deletedDeliveriesAndMilestones.deliveryTitleObject) {
        deletedItemsTitle.children.push(
          deletedDeliveriesAndMilestones.deliveryTitleObject
        );
      }

      this.updatesTree = [etapasTitleObject, deletedItemsTitle];
      this.baseline.updates = [
        ...this.baseline.updates,
        ...deletedItemsBlock.children,
      ];
    } else {
      this.updatesTree = [etapasTitleObject];
    }

    this.includeAllUpdates = this.baseline.updates.every(
      (update) => update.included
    );
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
      (update) => update.included
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
