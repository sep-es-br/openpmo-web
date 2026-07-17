import { Inject, Injectable, Injector } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

import { BaseService } from '../base/base.service';
import { IWorkpackData, IWorkpackParams } from '../interfaces/IWorkpackDataParams';
import { WorkpackService } from './workpack.service';
import { FilterDataviewService } from './filter-dataview.service';
import { ICommitment } from '../interfaces/ICommitment';
import { IHttpResult } from '../interfaces/IHttpResult';
import { PrepareHttpParams } from '../utils/query.util';

@Injectable({
  providedIn: 'root'
})
export class CommitmentsService extends BaseService<ICommitment> {

  private resetCommitments = new BehaviorSubject<boolean>(false);

  workpackData: IWorkpackData;
  workpackParams: IWorkpackParams;
  filters;
  commitments;
  idFilterSelected;
  term = '';
  loading;

  constructor(
    @Inject(Injector) injector: Injector,
    private workpackSrv: WorkpackService,
    private filterSrv: FilterDataviewService
  ) {
    super('commitments', injector);
  }

  resetCommitmentsData() {
    this.filters = [];
    this.commitments = [];
    this.idFilterSelected = undefined;
    this.term = '';
    this.loading = true;
    this.nextResetCommitments(true);
  }

  async loadCommitments(params?) {
    this.workpackData = this.workpackSrv.getWorkpackData();
    this.workpackParams = this.workpackSrv.getWorkpackParams();

    if (
      this.workpackData &&
      this.workpackData?.workpack?.id &&
      this.workpackData?.workpackModel &&
      this.workpackData.workpackModel.commitmentsSessionActive
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
              `workpackModels/${this.workpackData.workpackModel.id}/commitments`
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

        const resultCommitments = await this.GetAll({
          'id-workpack': this.workpackParams.idWorkpack,
          idFilter: this.idFilterSelected,
          term: this.term
        });

        this.commitments =
          resultCommitments.success
            ? resultCommitments.data
            : [];

        this.loading = false;
        this.nextResetCommitments(true);
      }

    } else {
      this.loading = false;
      this.nextResetCommitments(true);
    }
  }

  getCommitmentsData() {
    return {
      workpackData: this.workpackData,
      workpackParams: this.workpackParams,
      filters: this.filters,
      commitments: this.commitments,
      term: this.term,
      idFilterSelected: this.idFilterSelected,
      loading: this.loading
    };
  }

  deleteCommitmentFromData(id) {
    this.commitments =
      this.commitments.filter(
        commitment => commitment.id !== id
      );
  }

  nextResetCommitments(nextValue: boolean) {
    this.resetCommitments.next(nextValue);
  }

  get observableResetCommitments() {
    return this.resetCommitments.asObservable();
  }

  public async GetCommitmentByNumber(
    options?
  ): Promise<IHttpResult<ICommitment>> {
    return this.http.get(
      `${this.urlBase}/search`,
      {
        params:
          PrepareHttpParams(options)
      }
    ).toPromise() as
      Promise<IHttpResult<ICommitment>>;
  }
}
