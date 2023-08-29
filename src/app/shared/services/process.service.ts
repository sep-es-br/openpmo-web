import { PrepareHttpParams } from './../utils/query.util';
import { IProcess } from './../interfaces/IProcess';
import { IHttpResult } from './../interfaces/IHttpResult';
import { Inject, Injectable, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { BehaviorSubject } from 'rxjs';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { WorkpackService } from './workpack.service';
import { FilterDataviewService } from './filter-dataview.service';

@Injectable({
  providedIn: 'root'
})
export class ProcessService extends BaseService<IProcess> {

  private resetProcesses = new BehaviorSubject<boolean>(false);
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  filters;
  processes;
  idFilterSelected;
  term = '';
  loading;

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService,
    private filterSrv: FilterDataviewService
  ) {
    super('processes', injector);
  }

  resetProcessesData() {
    this.filters = [];
    this.processes = [];
    this.idFilterSelected = undefined;
    this.term = '';
    this.loading = true;
    this.nextResetProcess(true);
  }

  async loadProcesses(params?) {
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    if (this.workpackData && this.workpackData?.workpack?.id && this.workpackData?.workpackModel &&
      this.workpackData.workpackModel.processesManagementSessionActive) {
      if (!this.workpackParams.idWorkpackModelLinked || (this.workpackSrv.getEditPermission() && !!this.workpackParams.idWorkpackModelLinked)) {
        if (params) {
          this.idFilterSelected = params.idFilterSelected;
          this.term = params.term
        } else {
          const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${this.workpackData.workpack.model.id}/processes`);
          this.filters = resultFilters.success && Array.isArray(resultFilters.data) ? resultFilters.data : [];
          this.idFilterSelected = this.filters.find(defaultFilter => !!defaultFilter.favorite) ?
            this.filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
        }
        const resultProcess = await this.GetAll({ 'id-workpack': this.workpackParams.idWorkpack, idFilter: this.idFilterSelected, term: this.term });
        this.processes = resultProcess.success ? resultProcess.data : [];
        this.loading = false;
        this.nextResetProcess(true);
      }
    }
  }


  getProcessesData() {
    return {
      workpackData: this.workpackData,
      workpackParams: this.workpackParams,
      filters: this.filters,
      processes: this.processes,
      term: this.term,
      idFilterSelected: this.idFilterSelected,
      loading: this.loading
    }
  }

  deleteProcessFromData(id) {
    this.processes = this.processes.filter( process => process.id !== id );
  }

  nextResetProcess(nextValue: boolean) {
    this.resetProcesses.next(nextValue);
  }

  get observableResetProcess() {
    return this.resetProcesses.asObservable();
  }


  public async GetProcessByNumber(options?): Promise<IHttpResult<IProcess>> {
    return this.http.get(`${this.urlBase}/edocs`, { params: PrepareHttpParams(options) }).toPromise() as Promise<IHttpResult<IProcess>>;
  }

}