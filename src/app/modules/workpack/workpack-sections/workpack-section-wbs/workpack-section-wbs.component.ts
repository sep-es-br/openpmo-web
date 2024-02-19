import { Component, OnDestroy, Output, EventEmitter } from '@angular/core';
import {
  IWorkpackBreakdownStructure,
} from 'src/app/shared/interfaces/IWorkpackBreakdownStructure';
import { TypeWorkpackEnumWBS } from 'src/app/shared/enums/TypeWorkpackEnum';
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

@Component({
  selector: 'app-workpack-section-wbs',
  templateUrl: './workpack-section-wbs.component.html',
  styleUrls: ['./workpack-section-wbs.component.scss']
})
export class WorkpackSectionWBSComponent implements OnDestroy {

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
  collapsed: boolean = true;
  workpackParams: IWorkpackParams;

  constructor(
    private breakdownStructureSrv: BreakdownStructureService,
    private translateSrv: TranslateService,
    private actRouter: ActivatedRoute,
    private route: Router,
    private workpackSrv: WorkpackService,
    private workpackBreadcrumbStorageSrv: WorkpackBreadcrumbStorageService,
    private breadcrumbSrv: BreadcrumbService
  ) {
    this.isLoading = true;
    this.actRouter.queryParams.subscribe(async ({ idPlan }) => {
      this.idPlan = idPlan && +idPlan;
    });
    this.translateSrv.onLangChange.pipe(takeUntil(this.$destroy)).subscribe(() => {
      setTimeout(() => this.setLanguage(), 500);
    });
    this.breakdownStructureSrv.observableResetBreakdownStructure.pipe(takeUntil(this.$destroy)).subscribe(reset => {
      if (reset) {
        this.loadBreakdownStructureData();
      }
    })
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
      this.breakdownStructureSrv.loadBWSExpandedAll(this.workpackParams.idWorkpack);
    }
  }

  loadBreakdownStructureData() {
    this.setLanguage();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    const { wbsTree, loading } = this.breakdownStructureSrv.getWBSTree();
    this.wbsTree = wbsTree;
    this.isLoading = loading;
  }

  nodeCollapse(nodeList, level) {
    level++;
    return nodeList ? nodeList.map(node => ({
      ...node,
      expanded: level <= 1,
      children: node.children ? this.nodeCollapse(node.children, level) : []
    })) : [];
  }

  async nodeExpand(event) {
    this.getTopPosLoading();
    this.isLoading = true;
    await this.breakdownStructureSrv.nodeExpand(event);
    this.isLoading = false;
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
    if (properties?.dashboardData?.tripleConstraint?.cost &&
      properties?.dashboardData?.tripleConstraint?.cost?.foreseenValue > 0) {
      return true;
    }
    return false;
  }

  validateShowTripleConstraintSchedule(properties: IWorkpackBreakdownStructure) {
    if (properties?.dashboardData?.tripleConstraint?.schedule &&
      properties?.dashboardData?.tripleConstraint?.schedule?.foreseenStartDate !== null) {
      return true;
    }
    return false;
  }

  validateShowTripleConstraintScope(properties: IWorkpackBreakdownStructure) {
    if (properties?.dashboardData?.tripleConstraint?.scope &&
      properties?.dashboardData?.tripleConstraint?.scope?.foreseenValue > 0) {
      return true;
    }
    return false;
  }

  navigateToWorkpack(idWorkpack) {
    this.setWorkpackBreadcrumbStorage(idWorkpack, this.idPlan)
    this.route.navigate(['/workpack'], {
      queryParams: {
        id: idWorkpack,
        idPlan: this.idPlan
      }
    });
  }

  async setWorkpackBreadcrumbStorage(idWorkpack, idPlan) {
    const breadcrumbItems = await this.workpackBreadcrumbStorageSrv.getBreadcrumbs(idWorkpack, idPlan);
    this.breadcrumbSrv.setBreadcrumbStorage(breadcrumbItems);
  }

}
