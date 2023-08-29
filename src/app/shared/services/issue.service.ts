import { IIssue } from './../interfaces/IIssue';
import { IHttpResult } from './../interfaces/IHttpResult';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { BehaviorSubject } from 'rxjs';
import { WorkpackService } from './workpack.service';
import { FilterDataviewService } from './filter-dataview.service';

@Injectable({
  providedIn: 'root'
})
export class IssueService extends BaseService<IIssue> {

  private resetIssues = new BehaviorSubject<boolean>(false);
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  filters;
  term = '';
  issues;
  idFilterSelected;
  loading;

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService,
    private filterSrv: FilterDataviewService
  ) {
    super('issues', injector);
  }

  resetIssuesData() {
    this.filters = [];
    this.issues = [];
    this.idFilterSelected = undefined;
    this.term = '';
    this.loading = true;
    this.nextResetIssue(true);
  }

  async loadIssues(params?) {
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    if (this.workpackData && this.workpackData?.workpack?.id && this.workpackData?.workpackModel &&
      this.workpackData.workpackModel.riskAndIssueManagementSessionActive) {

      if (!this.workpackParams.idWorkpackModelLinked || (this.workpackSrv.getEditPermission() && !!this.workpackParams.idWorkpackModelLinked)) {
        if (params) {
          this.idFilterSelected = params.idFilterSelected;
          this.term = params.term;
        } else {
          const resultFilter = await this.filterSrv.getAllFilters(`workpackModels/${this.workpackData.workpack.model.id}/issues`);
          if (resultFilter.success) {
            this.filters = resultFilter.data;
            this.idFilterSelected = this.filters && this.filters.find(defaultFilter => !!defaultFilter.favorite) ?
              this.filters && this.filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
          }
        }
        const resultIssues = await this.GetAll({ 'id-workpack': this.workpackParams.idWorkpack, idFilter: this.idFilterSelected, term: this.term });
        if (resultIssues.success) {
          this.issues = resultIssues.data;
          this.loading = false;
          this.nextResetIssue(true);
        }
      }
    }
  }

  getIssuesData() {
    return {
      workpackData: this.workpackData,
      workpackParams: this.workpackParams,
      filters: this.filters,
      issues: this.issues,
      idFilterSelected: this.idFilterSelected,
      term: this.term,
      loading: this.loading
    }
  }

  deleteIssueFromData(id) {
    this.issues = this.issues.filter( issue => issue.id !== id );
  }

  nextResetIssue(nextValue: boolean) {
    this.resetIssues.next(nextValue);
  }

  get observableResetIssue() {
    return this.resetIssues.asObservable();
  }


  public async CreateIssueFromRisk(idRisk: number): Promise<IHttpResult<IIssue>> {
    return this.http.post(`${this.urlBase}/create-from-risk`, { idRisk }).toPromise() as Promise<IHttpResult<IIssue>>;
  }



}