import { Component, Input, OnChanges, OnDestroy, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { IWorkpackBreakdownStructure } from 'src/app/shared/interfaces/IWorkpackBreakdownStructure';
import { IWorkpack } from 'src/app/shared/interfaces/IWorkpack';
import { TypeWorkpackEnumWBS } from 'src/app/shared/enums/TypeWorkpackEnum';
import { WorkpackModelClassificationEnum } from 'src/app/shared/enums/WorkpackModelClassificationEnum';
import { Subject } from 'rxjs';
import { MilestoneStatusEnum } from 'src/app/shared/enums/MilestoneStatusEnum';
import { TranslateService } from '@ngx-translate/core';
import { takeUntil } from 'rxjs/operators';
import { BreakdownStructureService } from 'src/app/shared/services/breakdown-structure.service';
import { ActivatedRoute, Router } from '@angular/router';
import { IWorkpackParams } from 'src/app/shared/interfaces/IWorkpackDataParams';
import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { WorkpackBreadcrumbStorageService } from 'src/app/shared/services/workpack-breadcrumb-storage.service';
import { BreadcrumbService } from 'src/app/shared/services/breadcrumb.service';
import { JournalService } from 'src/app/shared/services/journal.service';
import { TransversalService } from 'src/app/shared/services/transversal.service';
import { ITransversalProgram, ITransversalProgramModel, ITransversalStructuralLink } from 'src/app/shared/interfaces/ITransversal';
import {
  DeliverableStatus,
  ProjectStatus,
  WorkpackStatusConfig,
  getWorkpackStatusConfigByStatus,
} from 'src/app/shared/enums/WorkpackStatusEnum';

@Component({
  selector: 'app-workpack-section-wbs',
  templateUrl: './workpack-section-wbs.component.html',
  styleUrls: ['./workpack-section-wbs.component.scss'],
})
export class WorkpackSectionWBSComponent implements OnChanges, OnDestroy {
  @Input() idTransversalProgram: number;

  @Output() onHasWBS = new EventEmitter();

  typeWorkpackEnum = TypeWorkpackEnumWBS;

  wbsTree: any = [];

  language: string;

  $destroy = new Subject();

  attentionMilestone = false;

  milestoneStatusEnum = MilestoneStatusEnum;

  label;

  isLoading = false;

  idPlan: number;

  topPosLoading = 128;

  collapsed = true;

  workpackParams: IWorkpackParams;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.idTransversalProgram && this.idTransversalProgram) {
      this.loadBreakdownStructureData();
    }
  }

  constructor(
    private breakdownStructureSrv: BreakdownStructureService,
    private translateSrv: TranslateService,
    private actRouter: ActivatedRoute,
    private route: Router,
    private workpackSrv: WorkpackService,
    private workpackBreadcrumbStorageSrv: WorkpackBreadcrumbStorageService,
    private breadcrumbSrv: BreadcrumbService,
    private journalSrv: JournalService,
    private transversalSrv: TransversalService
  ) {
    this.isLoading = true;
    this.actRouter.queryParams.subscribe(async ({ idPlan }) => {
      this.idPlan = idPlan && +idPlan;
    });
    this.translateSrv.onLangChange
      .pipe(takeUntil(this.$destroy))
      .subscribe(() => {
        setTimeout(() => this.setLanguage(), 500);
      });
    this.breakdownStructureSrv.observableResetBreakdownStructure
      .pipe(takeUntil(this.$destroy))
      .subscribe((reset) => {
        if (reset) {
          this.loadBreakdownStructureData();
        }
      });
  }

  ngOnDestroy(): void {
    this.$destroy.complete();
    this.$destroy.unsubscribe();
  }

  async handleCollapseAll(collapsed: boolean) {
    this.collapsed = collapsed;
    if (collapsed) {
      this.breakdownStructureSrv.collapseAll();
    } else {
      this.isLoading = true;
      this.breakdownStructureSrv.loadBWSExpandedAll(
        this.workpackParams.idWorkpack
      );
    }
  }

  async loadBreakdownStructureData() {
    this.setLanguage();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    const { wbsTree, loading } = this.breakdownStructureSrv.getWBSTree();
    this.wbsTree = wbsTree;
    this.isLoading = loading;
    const workpackData = this.workpackSrv.getWorkpackData();
    if (this.idTransversalProgram) {
      try {
        const result = await this.transversalSrv.getStructuralLinks(this.idTransversalProgram, true, true);
        if (result?.success) {
          const transversalViewId = this.workpackParams?.idTransversalView || workpackData?.workpackModel?.id;
          const programsResult = transversalViewId
            ? await this.transversalSrv.getPrograms(transversalViewId, this.idPlan)
            : undefined;
          const programModelsResult = transversalViewId
            ? await this.transversalSrv.getProgramModels(transversalViewId).catch(() => undefined)
            : undefined;
          this.attachTransversalStructuralLinks(
            result.data || [],
            workpackData?.workpack,
            programsResult?.success ? programsResult.data || [] : [],
            programModelsResult?.success ? programModelsResult.data || [] : []
          );
        }
      } catch (error) {
        // A falha ao carregar vínculos não deve impedir o EAP transversal existente.
      }
    }
  }

  private attachTransversalStructuralLinks(
    links: ITransversalStructuralLink[],
    transversalProgram?: IWorkpack,
    programs: ITransversalProgram[] = [],
    programModels: ITransversalProgramModel[] = []
  ): void {
    if (!links.length) { return; }
    const existingNodes = new Map<number, any>();
    const indexNodes = (nodes: any[]): void => {
      (nodes || []).forEach(node => {
        if (node.idWorkpack) { existingNodes.set(Number(node.idWorkpack), node); }
        indexNodes(node.children);
      });
    };
    indexNodes(this.wbsTree);

    const linksByProgram = new Map<number, Map<number, ITransversalStructuralLink>>();
    links.forEach(link => {
      const programId = Number(link.idTransversalProgram);
      const programLinks = linksByProgram.get(programId) || new Map<number, ITransversalStructuralLink>();
      const id = Number(link.idWorkpack);
      const current = programLinks.get(id);
      if (!current || (!current.directlyLinked && link.directlyLinked)) {
        programLinks.set(id, link);
      }
      linksByProgram.set(programId, programLinks);
    });

    const rootId = Number(this.idTransversalProgram);
    const programNode = existingNodes.get(rootId) || this.createTransversalProgramRoot(transversalProgram);
    if (!programNode) { return; }

    const programsById = new Map<number, ITransversalProgram>();
    programs.forEach(program => programsById.set(Number(program.idTransversalProgram), program));
    const programModelsById = new Map<number, ITransversalProgramModel>();
    programModels.forEach(model => programModelsById.set(Number(model.id), model));
    const subprogramsByParent = new Map<number, ITransversalProgram[]>();
    programs.forEach(program => {
      const id = Number(program.idTransversalProgram);
      const parentId = Number(program.idParent);
      if (id === rootId || !programsById.has(parentId)) { return; }
      const children = subprogramsByParent.get(parentId) || [];
      children.push(program);
      subprogramsByParent.set(parentId, children);
    });

    const buildModelGroups = (programId: number): any[] => {
      const programLinks = programsById.size
        ? linksByProgram.get(programId) || new Map<number, ITransversalStructuralLink>()
        : new Map<number, ITransversalStructuralLink>(
          Array.from(linksByProgram.values()).flatMap(programItems => Array.from(programItems.entries()))
        );
      const childrenByParent = new Map<number, ITransversalStructuralLink[]>();
      programLinks.forEach(link => {
        const id = Number(link.idWorkpack);
        const requestedParentId = Number(link.idParentWorkpack);
        const parentId = programLinks.has(requestedParentId) ? requestedParentId : programId;
        const siblings = childrenByParent.get(parentId) || [];
        siblings.push(link);
        childrenByParent.set(parentId, siblings);
      });

      const buildGroupsForParent = (parentId: number, ancestorIds: Set<number>): any[] => {
      const groupedByModel = new Map<number, any[]>();
      (childrenByParent.get(parentId) || []).filter(link => !ancestorIds.has(Number(link.idWorkpack))).forEach(link => {
        const modelId = Number(link.idWorkpackModel);
        const workpacks = groupedByModel.get(modelId) || [];
        workpacks.push(link);
        groupedByModel.set(modelId, workpacks);
      });

      return Array.from(groupedByModel.entries()).map(([modelId, modelLinks]) => {
        const firstLink = modelLinks[0];
        const workpacks = modelLinks.map(link => {
          const id = Number(link.idWorkpack);
          const existingNode = existingNodes.get(id) || {};
          const nextAncestors = new Set(ancestorIds);
          nextAncestors.add(id);
          const children = buildGroupsForParent(id, nextAncestors);
          return {
            ...existingNode,
            idWorkpack: id,
            idWorkpaModelLinked: link.idWorkpackModel,
            workpackName: link.name || existingNode.workpackName,
            workpackModelName: link.modelName || existingNode.workpackModelName,
            workpackType: link.workpackModelType || existingNode.workpackType,
            fontIcon: link.fontIcon || existingNode.fontIcon,
            isTransversalStructuralLink: true,
            structuralLinkClickable: link.clickable,
            expanded: true,
            leaf: children.length === 0,
            hasChildren: children.length > 0,
            children
          };
        });
        return {
          idWorkpackModel: modelId,
          workpackModelName: firstLink.modelNameInPlural || firstLink.modelName,
          workpackModelType: firstLink.workpackModelType,
          workpacks,
          children: workpacks,
          expanded: true,
          leaf: false
        };
      });
      };

      return buildGroupsForParent(programId, new Set([programId]));
    };

    const hasProgramContent = (programId: number, visited = new Set<number>()): boolean => {
      if (visited.has(programId)) { return false; }
      visited.add(programId);
      if ((linksByProgram.get(programId)?.size || 0) > 0) { return true; }
      return (subprogramsByParent.get(programId) || [])
        .some(child => hasProgramContent(Number(child.idTransversalProgram), visited));
    };

    const buildProgramChildren = (programId: number): any[] => {
      const structuralChildren = buildModelGroups(programId);
      const subprogramChildren = (subprogramsByParent.get(programId) || [])
        .filter(child => hasProgramContent(Number(child.idTransversalProgram)))
        .map(child => {
          const childId = Number(child.idTransversalProgram);
          const children = buildProgramChildren(childId);
          return {
            idWorkpack: child.idWorkpack,
            idWorkpaModelLinked: child.idWorkpackModel,
            workpackName: child.name || child.fullName,
            workpackType: TypeWorkpackEnumWBS.Program,
            fontIcon: child.fontIcon,
            isTransversalStructuralLink: true,
            structuralLinkClickable: true,
            expanded: true,
            leaf: children.length === 0,
            hasChildren: children.length > 0,
            children
          };
        });
      const subprogramGroups = Array.from(subprogramChildren.reduce((groups, child) => {
        const modelId = Number(child.idWorkpaModelLinked);
        const group = groups.get(modelId) || [];
        group.push(child);
        groups.set(modelId, group);
        return groups;
      }, new Map<number, any[]>()).entries()).map(([modelId, workpacks]) => {
        const model = programModelsById.get(modelId);
        return {
          idWorkpackModel: modelId,
          workpackModelName: model?.nameInPlural || this.translateSrv.instant('subprograms'),
          workpacks,
          children: workpacks,
          expanded: true,
          leaf: false
        };
      });
      return [...subprogramGroups, ...structuralChildren];
    };

    const children = this.applyExpansionState(buildProgramChildren(rootId));
    Object.assign(programNode, { leaf: false, hasChildren: children.length > 0, expanded: true, children });
    this.wbsTree = [programNode];
  }

  private applyExpansionState(nodes: any[], level = 1): any[] {
    return (nodes || []).map(node => ({
      ...node,
      expanded: !this.collapsed || level <= 1,
      children: this.applyExpansionState(node.children, level + 1)
    }));
  }

  private createTransversalProgramRoot(workpack?: IWorkpack): any {
    if (!workpack?.id || Number(workpack.id) !== Number(this.idTransversalProgram)) {
      return undefined;
    }
    const workpackName = workpack.name || workpack.fullName;
    return {
      idWorkpack: workpack.id,
      workpackName,
      workpackType: TypeWorkpackEnumWBS.Program,
      label: workpackName,
      expanded: true,
      leaf: false,
      hasChildren: true,
      children: []
    };
  }

  nodeCollapse(nodeList, level) {
    level++;
    return nodeList
      ? nodeList.map((node) => ({
          ...node,
          expanded: level <= 1,
          children: node.children
            ? this.nodeCollapse(node.children, level)
            : [],
        }))
      : [];
  }

  async nodeExpand(event) {
    this.getTopPosLoading();
    this.isLoading = true;
    await this.breakdownStructureSrv.nodeExpand(event);
    if (this.workpackSrv.getWorkpackData()?.workpackModel?.classification === WorkpackModelClassificationEnum.TRANSVERSAL) {
      this.markTransversalStructuralDescendants(event.node?.children || []);
    }
    this.isLoading = false;
  }

  private markTransversalStructuralDescendants(nodes: any[]): void {
    (nodes || []).forEach(node => {
      if (node.workpacks) {
        this.markTransversalStructuralDescendants(node.workpacks);
      } else if (node.idWorkpack) {
        node.idWorkpaModelLinked = node.idWorkpackModel;
        node.isTransversalStructuralLink = true;
        node.structuralLinkClickable = true;
        this.markTransversalStructuralDescendants(node.children || []);
      }
    });
  }

  getTopPosLoading() {
    const appWbs = document.querySelector('.app-wbs');
    if (appWbs && appWbs.clientHeight > 300) {
      this.topPosLoading = appWbs?.clientHeight / 2;
    }
  }

  setLanguage() {
    this.language = this.translateSrv.currentLang === 'pt-BR' ? 'pt' : 'en';
  }

  validateShowTripleConstraintCost(properties: IWorkpackBreakdownStructure) {
    if (
      properties?.dashboardData?.tripleConstraint?.cost &&
      properties?.dashboardData?.tripleConstraint?.cost?.foreseenValue > 0
    ) {
      return true;
    }
    return false;
  }

  validateShowTripleConstraintSchedule(
    properties: IWorkpackBreakdownStructure
  ) {
    if (
      properties?.dashboardData?.tripleConstraint?.schedule &&
      properties?.dashboardData?.tripleConstraint?.schedule
        ?.foreseenStartDate !== null
    ) {
      return true;
    }
    return false;
  }

  validateShowTripleConstraintScope(properties: IWorkpackBreakdownStructure) {
    if (
      properties?.dashboardData?.tripleConstraint?.scope &&
      properties?.dashboardData?.tripleConstraint?.scope?.foreseenValue > 0
    ) {
      return true;
    }
    return false;
  }

  navigateToWorkpack(item) {
    if (item?.isTransversalStructuralLink && !item.structuralLinkClickable) { return; }
    if (item.idWorkpack === this.workpackParams.idWorkpack) {
      return;
    }
    const idTransversalRoot = this.workpackParams.idTransversalRoot || this.workpackParams.idWorkpack;
    if (!item?.isTransversalStructuralLink) {
      this.setWorkpackBreadcrumbStorage(item.idWorkpack, this.idPlan);
    }
    this.route.navigate(['/workpack'], {
      queryParams: {
        id: item.idWorkpack,
        idWorkpaModelLinked: item.idWorkpaModelLinked,
        idPlan: this.idPlan,
        ...(item?.isTransversalStructuralLink ? {
          idTransversalRoot
        } : {})
      },
    });
  }

  async setWorkpackBreadcrumbStorage(idWorkpack, idPlan) {
    const breadcrumbItems =
      await this.workpackBreadcrumbStorageSrv.getBreadcrumbs(
        idWorkpack,
        idPlan
      );
    this.breadcrumbSrv.setBreadcrumbStorage(breadcrumbItems);
  }

  async handleShowJournalInformation(journalInformation) {
    journalInformation.loading = true;
    const result = await this.journalSrv.GetById(journalInformation.id);
    if (result.success) {
      journalInformation.information = result.data.information;
      journalInformation.author = result.data.author;
      journalInformation.dateInformation = result.data.date;
      journalInformation.workpack = result.data.workpack;
      journalInformation.evidences =
        result.data.evidences &&
        result.data.evidences.map((evidence) => {
          const isImg = evidence.mimeType.includes('image');
          let icon: string;
          switch (evidence.mimeType) {
            case 'application/pdf':
              icon = 'far fa-file-pdf';
              break;
            case 'text/csv':
              icon = 'fas fa-file-csv';
              break;
            case 'application/msword':
              icon = 'far fa-file-word';
              break;
            case 'application/vnd.ms-excel':
            case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
              icon = 'far fa-file-excel';
              break;
            case 'application/vnd.openxmlformats-officedocument.presentationml.presentation':
            case 'application/vnd.ms-powerpoint':
              icon = 'far fa-file-powerpoint';
              break;
            default:
              icon = 'far fa-file';
              break;
          }
          return {
            ...evidence,
            isImg,
            icon,
          };
        });
      journalInformation.loading = false;
    }
  }

  shouldDisplayWarningStyles(node: any): {
    displayWarningIcon: boolean;
    displayColoredText: boolean;
    displayDashedText: boolean;
    textTooltipMessages: Array<string>;
  } {
    if (
      !node.classifications ||
      node.workpackType === TypeWorkpackEnumWBS.Portfolio ||
      node.workpackType === TypeWorkpackEnumWBS.Program
    ) {
      return {
        displayWarningIcon: false,
        displayColoredText: false,
        displayDashedText: false,
        textTooltipMessages: [],
      };
    } else {
      if (
        node.workpackType === TypeWorkpackEnumWBS.Organizer &&
        node.classifications.deletedWithBaseline &&
        node.children &&
        node.children.length > 0 &&
        node.children.every(
          (child: any) =>
            child.workpacks.length > 0 &&
            child.workpacks.every(
              (workpack: any) =>
                workpack.classifications.deletedWithBaseline === false &&
                workpack.classifications.isNew === false &&
                workpack.classifications.noSchedule === false &&
                workpack.classifications.noScope === false &&
                workpack.classifications.toCancel === false
            )
        )
      ) {
        return {
          displayWarningIcon: true,
          displayColoredText: true,
          displayDashedText: false,
          textTooltipMessages: [
            'workpack-eap-alert-deleted-items-below',
            // Existem entregas excluídas nesse item
          ],
        };
      } else if (
        node.workpackType === TypeWorkpackEnumWBS.Project ||
        node.workpackType === TypeWorkpackEnumWBS.Organizer
      ) {
        if (
          node.classifications.deletedWithBaseline ||
          node.classifications.isNew ||
          node.classifications.noSchedule ||
          node.classifications.noScope ||
          node.classifications.toCancel
        ) {
          return {
            displayWarningIcon: true,
            displayColoredText: true,
            displayDashedText: false,
            textTooltipMessages: [
              'workpack-eap-alert-pending-items',
              // 'Verifique itens pendentes abaixo',
            ],
          };
        } else {
          return {
            displayWarningIcon: false,
            displayColoredText: false,
            displayDashedText: false,
            textTooltipMessages: [],
          };
        }
      } else if (
        node.workpackType === TypeWorkpackEnumWBS.Deliverable ||
        node.workpackType === TypeWorkpackEnumWBS.Milestone
      ) {
        const messages = [];

        if (node.classifications.deletedWithBaseline) {
          // messages.push('Este item foi excluído');
          messages.push('workpack-eap-alert-deleted-item');
        }
        if (node.classifications.isNew) {
          // messages.push('Item novo fora da Linha de Base ativa');
          messages.push('workpack-eap-alert-new-item');
        }
        if (node.classifications.noSchedule) {
          // messages.push('Entrega sem Cronograma');
          messages.push('workpack-eap-alert-no-schedule');
        }
        if (!node.classifications.noSchedule && node.classifications.noScope) {
          // messages.push('Entrega sem escopo estimado (físico = 0)');
          messages.push('workpack-eap-alert-no-scope');
        }
        if (node.classifications.toCancel) {
          // messages.push('Item a cancelar. Requer aprovação de nova Linha de Base');
          messages.push('workpack-eap-alert-to-cancel');
        }

        return {
          displayWarningIcon: messages.length > 0,
          displayColoredText: messages.length > 0,
          displayDashedText: false,
          textTooltipMessages: messages,
        };
      }
    }
  }

  shouldDisplayNewTag(node: any) {
    return (
      (node.workpackType === TypeWorkpackEnumWBS.Deliverable ||
        node.workpackType === TypeWorkpackEnumWBS.Milestone) &&
      node.classifications &&
      node.classifications.isNew
    );
  }

  parseTooltipTranslatedStrings(messages: Array<string>): string {
    if (messages && messages.length > 0) {
      const finalMessagesObj = this.translateSrv.instant(messages);
      const finalMessages = Object.values(finalMessagesObj);
      if (finalMessages.length > 1) {
        finalMessages[0] = `- ${finalMessages[0]}`;
      }

      return finalMessages.join('\n- ');
    }

    return '';
  }

  getWorkpackStatusConfig(status: ProjectStatus | DeliverableStatus): WorkpackStatusConfig {
    return getWorkpackStatusConfigByStatus(status);
  }
}
