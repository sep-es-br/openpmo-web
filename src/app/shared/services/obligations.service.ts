import { Inject, Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { BaseService } from '../base/base.service';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { WorkpackService } from './workpack.service';
import { FilterDataviewService } from './filter-dataview.service';
import { IObligation } from '../interfaces/IObligation';
import { IHttpResult } from '../interfaces/IHttpResult';
import { PrepareHttpParams } from '../utils/query.util';
import { IObligationManagementUnit } from '../interfaces/IObligation';

@Injectable({
  providedIn: 'root'
})
export class ObligationsService extends BaseService<IObligation> {

  private resetObligations = new BehaviorSubject<boolean>(false);

  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  filters;
  obligations;
  idFilterSelected;
  term = '';
  loading;

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService,
    private filterSrv: FilterDataviewService
  ) {
    super('obligations', injector);
  }
  getProviderYears():Promise<IHttpResult<number[]>> { return this.http.get<IHttpResult<number[]>>(`${this.urlBase}/years`).toPromise(); }
  getProviderManagementUnits(year:number):Promise<IHttpResult<IObligationManagementUnit[]>> { return this.http.get<IHttpResult<IObligationManagementUnit[]>>(`${this.urlBase}/management-units`,{params:{year:String(year)}}).toPromise(); }
  getProviderProcesses(year:number,u:IObligationManagementUnit):Promise<IHttpResult<IObligation[]>> { return this.http.get<IHttpResult<IObligation[]>>(`${this.urlBase}/processes`,{params:{year:String(year),'management-unit-code':String(u.code)}}).toPromise(); }
  getProviderProcess(id:string,code:string):Promise<IHttpResult<IObligation>> { return this.http.get<IHttpResult<IObligation>>(`${this.urlBase}/processes/${id}`,{params:{'management-unit-code':code}}).toPromise(); }

  resetObligationsData() {
    this.filters = [];
    this.obligations = [];
    this.idFilterSelected = undefined;
    this.term = '';
    this.loading = true;
    this.nextResetObligations(true);
  }

  async loadObligations(params?) {
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackParams = this.workpackSrv.getWorkpackParams();

    if (
      this.workpackData &&
      this.workpackData?.workpack?.id &&
      this.workpackData?.workpackModel &&
      this.workpackData.workpackModel.obligationsSessionActive
    ) {

      if (
        !this.workpackParams.idWorkpackModelLinked ||
        (
          this.workpackSrv.getEditPermission() &&
          !!this.workpackParams.idWorkpackModelLinked
        )
      ) {

        if (params) {
          this.idFilterSelected = params.idFilterSelected;
          this.term = params.term;
        } else {

          const resultFilters =
            await this.filterSrv.getAllFilters(
              `workpackModels/${this.workpackData.workpackModel.id}/obligations`
            );

          this.filters =
            resultFilters.success &&
            Array.isArray(resultFilters.data)
              ? resultFilters.data
              : [];

          this.idFilterSelected =
            this.filters.find(filter => !!filter.favorite)
              ? this.filters.find(filter => !!filter.favorite).id
              : undefined;
        }

        const resultObligations = await this.GetAll({
          'id-workpack': this.workpackParams.idWorkpack,
          idFilter: this.idFilterSelected,
          term: this.term
        });

        this.obligations =
          resultObligations.success
            ? resultObligations.data
            : [];

        this.loading = false;
        this.nextResetObligations(true);
      }

    } else {
      this.loading = false;
      this.nextResetObligations(true);
    }
  }

  getObligationsData() {
    return {
      workpackData: this.workpackData,
      workpackParams: this.workpackParams,
      filters: this.filters,
      obligations: this.obligations,
      term: this.term,
      idFilterSelected: this.idFilterSelected,
      loading: this.loading
    };
  }

  deleteObligationFromData(id) {
    this.obligations =
      this.obligations.filter(
        obligation => obligation.id !== id
      );
  }

  nextResetObligations(nextValue: boolean) {
    this.resetObligations.next(nextValue);
  }

  get observableResetObligations() {
    return this.resetObligations.asObservable();
  }

  public async GetObligationByNumber(
    options?
  ): Promise<IHttpResult<IObligation>> {
    return this.http.get(
      `${this.urlBase}/search`,
      {
        params:
          PrepareHttpParams(options)
      }
    ).toPromise() as
      Promise<IHttpResult<IObligation>>;
  }
}
