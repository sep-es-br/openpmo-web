import { Inject, Injectable, Injector } from '@angular/core';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IPlanBreakdownStructure } from '../interfaces/IPlanBreakdownStructure';
import { IWorkpackBreakdownStructure } from '../interfaces/IWorkpackBreakdownStructure';
import { PrepareHttpParams } from '../utils/query.util';
import { WorkpackService } from './workpack.service';
import { BreakdownStructureService } from './breakdown-structure.service';

@Injectable({ providedIn: 'root' })
export class PlanBreakdownStructureService extends BreakdownStructureService {
  planId: number;

  constructor(
    @Inject(Injector) injector: Injector,
    workpackSrv: WorkpackService
  ) {
    super(injector, workpackSrv);
  }

  async loadPlanBreakdownStructure(idPlan: number, allLevels: boolean) {
    this.planId = idPlan;
    this.loading = true;
    this.expandedAll = allLevels;
    this.expandedAllDone = allLevels;

    const { success, data } = await this.getByPlanId(idPlan, { allLevels });
    this.wbsTree = success && data ? this.mapPlanTreeNodes(data) : [];
    this.loading = false;
    return this.wbsTree;
  }

  async loadExpandedAll() {
    return this.loadPlanBreakdownStructure(this.planId, true);
  }

  collapseAllPlan() {
    this.expandedAll = false;
    this.wbsTree = this.wbsTree.map(root => ({
      ...root,
      expanded: true,
      children: this.nodeCollapse(root.children, -1),
    }));
    return this.wbsTree;
  }

  async expandPlanNode(event) {
    const idWorkpack = event.node?.idWorkpack;
    if (!idWorkpack || event.node?.children?.length) {
      return;
    }

    const { success, data } = await this.getPlanWorkpack(idWorkpack, this.planId, {
      allLevels: false,
    });
    if (success && data) {
      const tree = this.mapTreeNodes(data);
      event.node.children = tree?.length ? tree[0].children : [];
    }
  }

  private mapPlanTreeNodes(data: IPlanBreakdownStructure) {
    return [{
      ...data,
      label: data.planName,
      workpackName: data.planName,
      workpackType: 'Plan',
      expanded: true,
      leaf: false,
      children: this.mapTreeNodesChildren(data.workpackModels || [], false, 0),
    }];
  }

  private async getByPlanId(
    idPlan: number,
    options
  ): Promise<IHttpResult<IPlanBreakdownStructure>> {
    return this.http.get<IHttpResult<IPlanBreakdownStructure>>(
      `${this.urlBase}/plan/${idPlan}`,
      { params: PrepareHttpParams(options) }
    ).toPromise();
  }

  private async getPlanWorkpack(
    idWorkpack: number,
    idPlan: number,
    options
  ): Promise<IHttpResult<IWorkpackBreakdownStructure>> {
    return this.http.get<IHttpResult<IWorkpackBreakdownStructure>>(
      `${this.urlBase}/plan/${idPlan}/workpack/${idWorkpack}`,
      { params: PrepareHttpParams(options) }
    ).toPromise();
  }
}
