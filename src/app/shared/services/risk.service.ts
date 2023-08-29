import { WorkpackService } from 'src/app/shared/services/workpack.service';
import { IRisk } from './../interfaces/IRisk';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { FilterDataviewService } from './filter-dataview.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RiskService extends BaseService<IRisk> {

  private resetRisks = new BehaviorSubject<boolean>(false);
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  filters;
  risks;
  idFilterSelected;
  term = '';
  loading;

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService,
    private filterSrv: FilterDataviewService
  ) {
    super('risks', injector);
  }

  resetRisksData() {
    this.filters = [];
    this.risks = [];
    this.idFilterSelected = undefined;
    this.term = '';
    this.loading = true;
    this.nextResetRisk(true);
  }

  async loadRisks(params?) {
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    if (this.workpackData && this.workpackData?.workpack?.id && this.workpackData?.workpackModel &&
      this.workpackData.workpackModel.riskAndIssueManagementSessionActive) {
      if (!this.workpackParams.idWorkpackModelLinked || (this.workpackSrv.getEditPermission() && !!this.workpackParams.idWorkpackModelLinked)) {
        if (params) {
          this.idFilterSelected = params.idFilterSelected;
          this.term = params.term
        } else {
          const resultFilter = await this.filterSrv.getAllFilters(`workpackModels/${this.workpackData.workpack.model.id}/risks`);
          if (resultFilter.success) {
            this.filters = resultFilter.data;
            this.idFilterSelected = this.filters && this.filters.find(defaultFilter => !!defaultFilter.favorite) ?
            this.filters && this.filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
          }
        }
        const resultRisks = await this.GetAll({ 'id-workpack': this.workpackParams.idWorkpack, idFilter: this.idFilterSelected, term: this.term });
        if (resultRisks.success) {
          this.risks = resultRisks.data;
          this.loading = false;
          this.nextResetRisk(true);
        }
      }
    }
  }

  getRisksData() {
    return {
      workpackData: this.workpackData,
      workpackParams: this.workpackParams,
      filters: this.filters,
      risks: this.risks,
      term: this.term,
      idFilterSelected: this.idFilterSelected,
      loading: this.loading
    }
  }

  deleteRiskFromData(id) {
    this.risks = this.risks.filter( risk => risk.id !== id );
  }

  nextResetRisk(nextValue: boolean) {
    this.resetRisks.next(nextValue);
  }

  get observableResetRisk() {
    return this.resetRisks.asObservable();
  }

}