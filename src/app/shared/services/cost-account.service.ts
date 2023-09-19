import { Injectable, Inject, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { ICostAccount, ICostByWorkpack } from '../interfaces/ICostAccount';
import { IHttpResult } from '../interfaces/IHttpResult';
import { PrepareHttpParams } from '../utils/query.util';
import { BehaviorSubject } from 'rxjs';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { FilterDataviewService } from './filter-dataview.service';
import { WorkpackService } from './workpack.service';
import { OrganizationService } from './organization.service';

@Injectable({ providedIn: 'root' })
export class CostAccountService extends BaseService<ICostAccount> {

  private resetCostAccounts = new BehaviorSubject<boolean>(false);
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  filters;
  costAccounts;
  idFilterSelected;
  funders;
  term = '';
  loading;

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService,
    private filterSrv: FilterDataviewService,
    private organizationSrv: OrganizationService
  ) {
    super('cost-accounts', injector);
  }
 
  resetCostAccountsData() {
    this.filters = [];
    this.costAccounts = [];
    this.idFilterSelected = undefined;
    this.term = '';
    this.loading = true;
    this.nextResetCostAccount(true);
  }

  async loadCostAccounts(params?) {
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    if (this.workpackData && this.workpackData?.workpack?.id && this.workpackData?.workpackModel && this.workpackData.workpackModel.costSessionActive) {
      if (params) {
        this.idFilterSelected = params.idFilterSelected;
        this.term = params.term;
      } else {
        const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${this.workpackData.workpack.model.id}/costAccounts`);
        this.filters = resultFilters.success && resultFilters.data ? resultFilters.data : [];
        this.idFilterSelected = this.filters.find(defaultFilter => !!defaultFilter.favorite) ?
          this.filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
        this.funders = (this.workpackParams.idOffice || this.workpackParams.idOfficeOwnerWorkpackLinked) &&
          await this.loadOrganizationsOffice(this.workpackParams.idOfficeOwnerWorkpackLinked ? this.workpackParams.idOfficeOwnerWorkpackLinked
            : this.workpackParams.idOffice);
      }
      const result = await this.GetAll({ 'id-workpack': this.workpackParams.idWorkpack, idFilter: this.idFilterSelected, term: this.term });
      if (result.success) {
        this.costAccounts = result.data;
        this.loading = false;
        this.nextResetCostAccount(true);
      }
    } else {
      this.loading = false;
      this.nextResetCostAccount(true);
    }
  }

  async loadOrganizationsOffice(idOffice) {
    const result = await this.organizationSrv.GetAll({ 'id-office': idOffice });
    if (result.success) {
      const organizationsOffice = result.data;
      return organizationsOffice.map(org => ({
        label: org.name,
        value: org.id
      }));
    }
  }

  deleteCostAccountFromData(id) {
    this.costAccounts = this.costAccounts.filter( cost => cost.id !== id );
  }

  getCostAccountsData() {
    return {
      workpackData: this.workpackData,
      workpackParams: this.workpackParams,
      filters: this.filters,
      costAccounts: this.costAccounts,
      idFilterSelected: this.idFilterSelected,
      term: this.term,
      funders: this.funders,
      loading: this.loading
    }
  }

  nextResetCostAccount(nextValue: boolean) {
    this.resetCostAccounts.next(nextValue);
  }

  get observableResetCostAccount() {
    return this.resetCostAccounts.asObservable();
  }


  public async GetCostsByWorkpack(options): Promise<IHttpResult<ICostByWorkpack>> {
    const result = await this.http.get(`${this.urlBase}/workpack`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<ICostByWorkpack>;
  }
}
