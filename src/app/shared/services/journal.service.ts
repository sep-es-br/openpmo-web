import { BehaviorSubject } from 'rxjs';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IJournal } from '../interfaces/Journal';
import { ITreeViewScopePlan, ITreeViewScopeWorkpack } from '../interfaces/ITreeScopePersons';
import { OfficeService } from './office.service';
import { TreeNode } from 'primeng/api';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { WorkpackService } from './workpack.service';

@Injectable({
  providedIn: 'root'
})
export class JournalService extends BaseService<IJournal> {

  private resetJournal = new BehaviorSubject<boolean>(false);
  private resetScope = new BehaviorSubject<boolean>(false);
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  treeViewScope: TreeNode[] = [];
  selectedWorkpacks: TreeNode[] = [];
  journalData: IJournal[] = [];
  from = '';
  to = '';
  type = ['INFORMATION'];
  scopeName = '';
  page = 0;
  pageSize = 5;
  hasMore = true;
  hasAll = true;
  loading;

  constructor(
    @Inject(Injector) injector: Injector,
    private officeSrv: OfficeService,
    private workpackSrv: WorkpackService
  ) {
    super('journal', injector);
  }

  resetJournalData() {
    this.selectedWorkpacks = [];
    this.journalData = [];
    this.loading = true;
    this.from = '';
    this.to = '';
    this.type = ['INFORMATION'];
    this.scopeName = '';
    this.page = 0;
    this.pageSize = 5;
    this.hasMore = true;
    this.hasAll = true;
    this.nextResetJournal(true);
  }

  nextResetJournal(nextValue: boolean) {
    this.resetJournal.next(nextValue);
  }

  get observableResetJournal() {
    return this.resetJournal.asObservable();
  }

  nextResetScope(nextValue: boolean) {
    this.resetScope.next(nextValue);
  }

  get observableResetScope() {
    return this.resetScope.asObservable();
  }

  // retorna os valores do journal no service
  getJournal() {
    return {
      workpackData: this.workpackData,
      workpackParams: this.workpackParams,
      treeViewScope: this.treeViewScope,
      selectedWorkpacks: this.selectedWorkpacks,
      journalData: this.journalData,
      searchParams: {
        from: this.from,
        to: this.to,
        type: this.type,
        scopeName: this.scopeName
      },
      page: this.page,
      pageSize: this.pageSize,
      hasMore: this.hasMore,
      hasAll: this.hasAll,
      loading: this.loading
    }
  }

  async loadScope() {
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    if (!!this.workpackData.workpack && !!this.workpackData.workpack.id &&
      !this.workpackData.workpack.canceled && !!this.workpackData.workpackModel &&
      !!this.workpackData.workpackModel.journalManagementSessionActive) {
      await this.loadTreeViewScope();
      this.nextResetScope(true);
      }
  }

  // carregando os dados do journal passando os parametros recebidos
  async loadJournal(params?) {
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    if (!!this.workpackData.workpack && !!this.workpackData.workpack.id  && !!this.workpackData.workpackModel &&
      !!this.workpackData.workpackModel.journalManagementSessionActive) {
      if (params) {
        this.selectedWorkpacks = params.selectedWorkpacks ? params.selectedWorkpacks : this.selectedWorkpacks;
        this.from = params.from ? params.from : this.from;
        this.to = params.to ? params.to : this.to;
        this.type = params.type ? params.type : this.type;
        this.scopeName = params.scopeName ? params.scopeName : this.scopeName;
        this.page = params.page ? params.page : this.page;
        this.pageSize = params.pageSize ? params.pageSize : this.pageSize;
        this.hasAll = params.hasAll !== undefined ? params.hasAll : this.hasAll;
        this.hasMore = params.hasMore !== undefined ? params.hasMore : this.hasMore;
      }
      if (this.workpackData && this.workpackData.workpackModel && this.workpackData.workpackModel.journalManagementSessionActive) {
        await this.getJournalData();
        this.loading = false;
        this.nextResetJournal(true);
      }
    } else {
      this.loading = false;
      this.nextResetJournal(true);
    }

  }

  // busca na api
  async getJournalData() {
    const { data, success } = await this.GetAll({
      idWorkpack: this.workpackData.workpack.id,
      from: this.from,
      to: this.to,
      type: this.type.join(','),
      scope: this.selectedWorkpacks.map(node => node.data).join(','),
      page: this.page,
      size: this.pageSize
    });
    if (success) {
      this.journalData = this.page > 0 ? this.journalData.concat(data) : data;
      this.hasMore = data.length > 0 && data.length === this.pageSize;
      this.hasAll = true;
    }
  }


  async loadTreeViewScope() {
    const { data, success } = await this.officeSrv.GetTreeScopePersons(this.workpackParams.idOffice, {
      'id-plan': this.workpackParams.idPlan,
      'id-workpack': this.workpackParams.idWorkpack
    });
    if (success) {
      const treePlan = data.plans.find(plan => plan.id === this.workpackParams.idPlan);
      const treeWorkpackCurrent = this.findTreeWorkpack(this.workpackData.workpack.id, treePlan) as any;
      this.treeViewScope = this.loadTreeNodeWorkpacks([{ ...treeWorkpackCurrent }]);
      this.selectedWorkpacks = this.setSelectedNodes(this.treeViewScope);
    }
  }

  setSelectedNodes(list: TreeNode[]) {
    let result = [];
    list.forEach(l => {
      result.push(l);
      if (l.children && l.children.length > 0) {
        const resultChildren = this.setSelectedNodes(l.children);
        result = result.concat(resultChildren);
      }
    });
    return result;
  }

  findTreeWorkpack(id: number, treePlan: ITreeViewScopePlan) {
    let treeWorkpack;
    treePlan.workpacks.some(workpack => {
      treeWorkpack = workpack.id === id ? workpack : this.findTreeWorkpackChildren(id, workpack.children);
      return treeWorkpack;
    });
    return treeWorkpack;
  }

  findTreeWorkpackChildren(id: number, treeWorkpacks: ITreeViewScopeWorkpack[]) {
    let treeWorkpack;
    if (treeWorkpacks) {
      treeWorkpacks.some(workpack => {
        treeWorkpack = workpack.id === id ? workpack : this.findTreeWorkpackChildren(id, workpack.children);
        return treeWorkpack;
      });
    }
    return treeWorkpack;
  }


  loadTreeNodeWorkpacks(treeWorkpacks: ITreeViewScopeWorkpack[], parent?: TreeNode): TreeNode[] {
    if (!treeWorkpacks) {
      return [];
    }
    return treeWorkpacks.map(worckpack => {
      if (worckpack.children) {
        const node = {
          label: worckpack.name,
          icon: worckpack.icon,
          data: worckpack.id,
          children: undefined,
          parent,
          selectable: true,
          type: 'workpack',
          expanded: true
        };
        node.children = this.loadTreeNodeWorkpacks(worckpack.children, node);
        return node;
      }
      return {
        label: worckpack.name,
        data: worckpack.id,
        children: undefined,
        parent,
        icon: worckpack.icon,
        selectable: true
      };
    });
  }

}
