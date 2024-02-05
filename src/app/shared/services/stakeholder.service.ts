import { BehaviorSubject } from 'rxjs';
import { Injectable, Inject, Injector } from '@angular/core';
import { BaseService } from '../base/base.service';
import { IHttpResult } from '../interfaces/IHttpResult';
import { IStakeholder } from '../interfaces/IStakeholder';
import { PrepareHttpParams } from '../utils/query.util';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { FilterDataviewService } from './filter-dataview.service';
import { WorkpackService } from './workpack.service';

@Injectable({ providedIn: 'root' })
export class StakeholderService extends BaseService<IStakeholder> {

  private resetStakeholders = new BehaviorSubject<boolean>(false);
  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  filters;
  stakeholders;
  idFilterSelected;
  term = '';
  loading;

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService,
    private filterSrv: FilterDataviewService
  ) {
    super('stakeholders', injector);
  }

  resetStakeholdersData() {
    this.filters = [];
    this.stakeholders = [];
    this.idFilterSelected = undefined;
    this.term = '';
    this.loading = true;
    this.nextResetStakeholder(true);
  }

  getStakeholdersData() {
    return {
      workpackData: this.workpackData,
      workpackParams: this.workpackParams,
      filters: this.filters,
      stakeholders: this.stakeholders,
      idFilterSelected: this.idFilterSelected,
      term: this.term,
      loading: this.loading
    }
  }

  deleteStakeholderFromData(stakeholder) {
    this.stakeholders = this.stakeholders.filter( stake => stake !== stakeholder );
  }

  nextResetStakeholder(nextValue: boolean) {
    this.resetStakeholders.next(nextValue);
  }

  get observableResetStakeholder() {
    return this.resetStakeholders.asObservable();
  }


  async loadStakeholders(params?) {
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackParams = this.workpackSrv.getWorkpackParams();
    if (this.workpackData && this.workpackData?.workpack?.id && this.workpackData?.workpackModel && this.workpackData.workpackModel.stakeholderSessionActive) {
      if (!this.workpackParams.idWorkpackModelLinked || (this.workpackSrv.getEditPermission() && !!this.workpackParams.idWorkpackModelLinked)) {
        if (params) {
          this.idFilterSelected = params.idFilterSelected;
          this.term = params.term;
        } else {
          const resultFilters = await this.filterSrv.getAllFilters(`workpackModels/${this.workpackData.workpackModel.id}/stakeholders`);
          this.filters = resultFilters.success && Array.isArray(resultFilters.data) ? resultFilters.data : [];
          this.idFilterSelected = this.filters.find(defaultFilter => !!defaultFilter.favorite) ?
            this.filters.find(defaultFilter => !!defaultFilter.favorite).id : undefined;
        }
        const result = await this.GetAll({ 'id-workpack': this.workpackParams.idWorkpack, idFilter: this.idFilterSelected, term: this.term });
        if (result.success) {
          this.stakeholders = result.data;
          this.loading = false;
          this.nextResetStakeholder(true);
        }
      }
    } else {
      this.loading = false;
      this.nextResetStakeholder(true);
    }
  }


  public postStakeholderPerson(stakeholder: IStakeholder): Promise<IHttpResult<IStakeholder>> {
    return this.http.post(`${this.urlBase}/person`, stakeholder).toPromise() as Promise<IHttpResult<IStakeholder>>;
  }

  public putStakeholderPerson(stakeholder: IStakeholder): Promise<IHttpResult<IStakeholder>> {
    return this.http.put(`${this.urlBase}/person`, stakeholder).toPromise() as Promise<IHttpResult<IStakeholder>>;
  }

  public postStakeholderOrganization(stakeholder: IStakeholder): Promise<IHttpResult<IStakeholder>> {
    return this.http.post(`${this.urlBase}/organization`, stakeholder).toPromise() as Promise<IHttpResult<IStakeholder>>;
  }

  public putStakeholderOrganization(stakeholder: IStakeholder): Promise<IHttpResult<IStakeholder>> {
    return this.http.put(`${this.urlBase}/organization`, stakeholder).toPromise() as Promise<IHttpResult<IStakeholder>>;
  }

  public async GetStakeholderPerson(options?): Promise<IHttpResult<IStakeholder>> {
    const result = await this.http.get(`${this.urlBase}/person`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IStakeholder>;
  }

  public async GetStakeholderOrganization(options?): Promise<IHttpResult<IStakeholder>> {
    const result = await this.http.get(`${this.urlBase}/organization`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<IStakeholder>;
  }

  public async GetResponsibles(options?): Promise<IHttpResult<{ id: number; name: string }[]>> {
    const result = await this.http.get(`${this.urlBase}/responsibles`, { params: PrepareHttpParams(options) }).toPromise();
    return result as IHttpResult<{ id: number; name: string }[]>;
  }

  public async deleteStakeholderPerson(params,
    options?: { message?: string; field?: string; useConfirm?: boolean }): Promise<IHttpResult<IStakeholder>> {
    const message = options?.message;
    const field: string = options?.field;
    const useConfirm: boolean = options?.useConfirm || true;

    return new Promise(async (resolve, reject) => {
      if (useConfirm) {
        this.confirmationSrv.confirm({
          message: message || `${this.translateSrv.instant('messages.deleteConfirmation')}?`,
          key: 'deleteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async () => {
            const result = await this.http.delete<IHttpResult<IStakeholder>>(`${this.urlBase}/person`,
              { params: PrepareHttpParams(params) }).toPromise();
            if (result.success) {
              setTimeout(() => {
                this.messageSrv.add({
                  severity: 'success',
                  summary: this.translateSrv.instant('success'),
                  detail: this.translateSrv.instant('messages.deleteSuccessful')
                });
              }, 300);
            }
            resolve(result);
          },
          reject: () => {
            resolve({ success: false, data: undefined });
          }
        });
      } else {
        const result = await this.http.delete<IHttpResult<IStakeholder>>(`${this.urlBase}/person`,
          { params: PrepareHttpParams(params) }).toPromise();
        resolve(result);
      }
    });
  }

  public async deleteStakeholderOrganization(params,
    options?: { message?: string; field?: string; useConfirm?: boolean }): Promise<IHttpResult<IStakeholder>> {
    const message = options?.message;
    const field: string = options?.field;
    const useConfirm: boolean = options?.useConfirm || true;

    return new Promise(async (resolve, reject) => {
      if (useConfirm) {
        this.confirmationSrv.confirm({
          message: message || `${this.translateSrv.instant('messages.deleteConfirmation')}?`,
          key: 'deleteConfirm',
          acceptLabel: this.translateSrv.instant('yes'),
          rejectLabel: this.translateSrv.instant('no'),
          accept: async () => {
            const result = await this.http.delete<IHttpResult<IStakeholder>>(`${this.urlBase}/organization`,
              { params: PrepareHttpParams(params) }).toPromise();
            if (result.success) {
              setTimeout(() => {
                this.messageSrv.add({
                  severity: 'success',
                  summary: this.translateSrv.instant('success'),
                  detail: this.translateSrv.instant('messages.deleteSuccessful')
                });
              }, 300);
            }
            resolve(result);
          },
          reject: () => {
            resolve({ success: false, data: undefined });
          }
        });
      } else {
        const result = await this.http.delete<IHttpResult<IStakeholder>>(`${this.urlBase}/organization`,
          { params: PrepareHttpParams(params) }).toPromise();
        resolve(result);
      }
    });
  }
}
